import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app, url_for
from werkzeug.utils import secure_filename
from db import get_db_connection
# IMPORT PILLOW & IMAGEOPS
from PIL import Image, ImageOps

photos_bp = Blueprint('photos', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'm4v'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==========================================
# HELPER: CREATE THUMBNAIL (FIXED ROTATION)
# ==========================================
def create_thumbnail(image_path, filename):
    """
    Creates a 300x300 thumbnail for images.
    Automatically fixes EXIF rotation issues.
    """
    try:
        size = (300, 300)
        with Image.open(image_path) as img:
            # FIX: Rotate the image based on EXIF data (fixes sideways images)
            img = ImageOps.exif_transpose(img)

            # Convert to RGB (handles PNG transparency)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            img.thumbnail(size)
            
            thumb_filename = f"thumb_{filename}"
            thumb_path = os.path.join(os.path.dirname(image_path), thumb_filename)
            img.save(thumb_path, "JPEG", quality=85)
            print(f"Thumbnail created: {thumb_filename}")
            return thumb_filename
    except Exception as e:
        print(f"Thumbnail creation failed: {e}")
        return None

# ==========================================
# UPLOAD PHOTO
# ==========================================
@photos_bp.route('/upload-photo', methods=['POST'])
def upload_photo():
    if 'photo' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['photo']
    user_id = request.form.get('user_id')
    group_id = request.form.get('group_id')

    if not file or file.filename == '' or not user_id or not group_id:
        return jsonify({"error": "Missing data"}), 400

    if allowed_file(file.filename):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # MEMBER CHECK
            cursor.execute(
                "SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", 
                (user_id, group_id)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": "You are not a member of this group"}), 403

            filename = secure_filename(file.filename)
            upload_folder = current_app.config['UPLOAD_FOLDER']
            save_path = os.path.join(upload_folder, filename)
            
            # 1. Save Original File
            file.save(save_path)

            # 2. Generate Thumbnail (Only if it's an image)
            ext = filename.rsplit('.', 1)[1].lower()
            is_video = ext in ['mp4', 'mov', 'avi', 'm4v']
            
            if not is_video:
                create_thumbnail(save_path, filename)

            # 3. Save Metadata to DB
            sql = "INSERT INTO photos (file_name, user_id, group_id) VALUES (%s, %s, %s)"
            cursor.execute(sql, (filename, user_id, group_id))
            conn.commit()
            
            cursor.close()
            conn.close()

            return jsonify({
                "message": "File uploaded successfully", 
                "filename": filename
            }), 201

        except Exception as e:
            print(f"Error: {e}")
            return jsonify({"error": "Internal Server Error"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

# ==========================================
# GET GROUP PHOTOS (UPDATED FOR BLOCKING)
# ==========================================
@photos_bp.route('/group-photos', methods=['GET'])
def get_group_photos():
    group_id = request.args.get('group_id')
    user_id = request.args.get('user_id')

    if not group_id or not user_id:
        return jsonify({"error": "group_id and user_id are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # MEMBER CHECK
        cursor.execute(
            "SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", 
            (user_id, group_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Unauthorized"}), 403

        # FETCH PHOTOS 
        # UPDATED SQL: Exclude photos from users I blocked OR users who blocked me
        # Also exclude photos explicitly hidden in hidden_photos table (for "delete for me" feature)
        sql = """
            SELECT photos.id, photos.file_name, photos.upload_date, 
                   photos.user_id as uploader_id, 
                   users.username, users.profile_image
            FROM photos 
            JOIN users ON photos.user_id = users.id 
            WHERE photos.group_id = %s 
            
            -- Exclude explicitly hidden photos (Delete for me)
            AND photos.id NOT IN (
                SELECT photo_id FROM hidden_photos WHERE user_id = %s
            )
            
            -- Exclude photos from blocked/blocking users
            AND photos.user_id NOT IN (
                -- Users I blocked
                SELECT blocked_id FROM blocked_users WHERE blocker_id = %s
                UNION
                -- Users who blocked me
                SELECT blocker_id FROM blocked_users WHERE blocked_id = %s
            )
            
            ORDER BY photos.upload_date DESC
        """
        cursor.execute(sql, (group_id, user_id, user_id, user_id))
        photos = cursor.fetchall()

        photo_list = []
        for photo in photos:
            filename = photo['file_name']
            
            # Original URL
            original_url = url_for('photos.uploaded_file', filename=filename, _external=True)
            
            # Determine Type
            ext = filename.rsplit('.', 1)[1].lower()
            media_type = 'video' if ext in ['mp4', 'mov', 'avi', 'm4v'] else 'image'
            
            # Construct Thumbnail URL
            if media_type == 'image':
                thumb_name = f"thumb_{filename}"
                thumbnail_url = url_for('photos.uploaded_file', filename=thumb_name, _external=True)
            else:
                thumbnail_url = original_url 

            photo_list.append({
                "id": photo['id'],
                "url": original_url,
                "thumbnail": thumbnail_url,
                "type": media_type,
                "uploader_id": photo['uploader_id'],
                "uploaded_by": photo['username'],
                "user_avatar": photo['profile_image'],
                "date": photo['upload_date']
            })

        cursor.close()
        conn.close()
        return jsonify(photo_list), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# ==========================================
# HIDE & DELETE ROUTES (UNCHANGED)
# ==========================================
@photos_bp.route('/hide-photo', methods=['POST'])
def hide_photo():
    data = request.json
    user_id = data.get('user_id')
    photo_id = data.get('photo_id')
    if not user_id or not photo_id: return jsonify({"error": "Missing fields"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "INSERT IGNORE INTO hidden_photos (user_id, photo_id) VALUES (%s, %s)"
        cursor.execute(sql, (user_id, photo_id))
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "Photo hidden successfully"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@photos_bp.route('/delete-photo', methods=['DELETE'])
def delete_photo():
    user_id = request.args.get('user_id')
    photo_id = request.args.get('photo_id')
    if not user_id or not photo_id: return jsonify({"error": "Missing fields"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT file_name, user_id FROM photos WHERE id = %s", (photo_id,))
        photo = cursor.fetchone()
        if not photo:
            cursor.close(); conn.close()
            return jsonify({"error": "Photo not found"}), 404
        if str(photo['user_id']) != str(user_id):
            cursor.close(); conn.close()
            return jsonify({"error": "Unauthorized"}), 403
        cursor.execute("DELETE FROM photos WHERE id = %s", (photo_id,))
        conn.commit()
        upload_folder = current_app.config['UPLOAD_FOLDER']
        file_path = os.path.join(upload_folder, photo['file_name'])
        if os.path.exists(file_path): os.remove(file_path)
        thumb_path = os.path.join(upload_folder, f"thumb_{photo['file_name']}")
        if os.path.exists(thumb_path): os.remove(thumb_path)
        cursor.close(); conn.close()
        return jsonify({"message": "Photo deleted successfully"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@photos_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)