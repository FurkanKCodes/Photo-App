import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app, url_for
from werkzeug.utils import secure_filename
from db import get_db_connection
# IMPORT PILLOW & IMAGEOPS
from PIL import Image, ImageOps
# IMPORT OPENCV FOR VIDEO THUMBNAILS
import cv2 

photos_bp = Blueprint('photos', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'm4v'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==========================================
# HELPER: CREATE THUMBNAIL (IMAGE & VIDEO)
# ==========================================
def create_thumbnail(file_path, filename):
    try:
        size = (300, 300)
        ext = filename.rsplit('.', 1)[1].lower()
        is_video = ext in ['mp4', 'mov', 'avi', 'm4v']
        
        img = None

        if is_video:
            # Extract first frame from video using OpenCV
            cam = cv2.VideoCapture(file_path)
            ret, frame = cam.read()
            if ret:
                # Convert color from BGR (OpenCV) to RGB (Pillow)
                img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            cam.release()
        else:
            # Process Image
            img = Image.open(file_path)
            img = ImageOps.exif_transpose(img) # Fix rotation
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

        if img:
            img.thumbnail(size)
            thumb_filename = f"thumb_{filename}"
            # Thumbnails are always saved as JPEG images, even for videos
            thumb_path = os.path.join(os.path.dirname(file_path), thumb_filename)
            img.save(thumb_path, "JPEG", quality=85)
            print(f"Thumbnail created: {thumb_filename}")
            return thumb_filename
        else:
            print("Failed to load image or video frame")
            return None

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

            cursor.execute("SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", (user_id, group_id))
            if not cursor.fetchone():
                cursor.close(); conn.close()
                return jsonify({"error": "You are not a member of this group"}), 403

            filename = secure_filename(file.filename)
            upload_folder = current_app.config['UPLOAD_FOLDER']
            save_path = os.path.join(upload_folder, filename)
            file.save(save_path)

            # Generate Thumbnail (For both Images and Videos)
            create_thumbnail(save_path, filename)

            sql = "INSERT INTO photos (file_name, user_id, group_id) VALUES (%s, %s, %s)"
            cursor.execute(sql, (filename, user_id, group_id))
            conn.commit()
            cursor.close(); conn.close()

            return jsonify({"message": "File uploaded successfully", "filename": filename}), 201
        except Exception as e:
            return jsonify({"error": "Internal Server Error"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

# ==========================================
# GET GROUP PHOTOS
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

        cursor.execute("SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", (user_id, group_id))
        if not cursor.fetchone():
            cursor.close(); conn.close()
            return jsonify({"error": "Unauthorized"}), 403

        sql = """
            SELECT photos.id, photos.file_name, photos.upload_date, 
                   photos.user_id as uploader_id, 
                   users.username, users.profile_image
            FROM photos 
            JOIN users ON photos.user_id = users.id 
            WHERE photos.group_id = %s 
            AND photos.id NOT IN (SELECT photo_id FROM hidden_photos WHERE user_id = %s)
            AND photos.user_id NOT IN (
                SELECT blocked_id FROM blocked_users WHERE blocker_id = %s
                UNION
                SELECT blocked_id FROM blocked_users WHERE blocked_id = %s
            )
            ORDER BY photos.upload_date DESC
        """
        cursor.execute(sql, (group_id, user_id, user_id, user_id))
        photos = cursor.fetchall()

        photo_list = []
        for photo in photos:
            filename = photo['file_name']
            original_url = url_for('photos.uploaded_file', filename=filename, _external=True)
            ext = filename.rsplit('.', 1)[1].lower()
            media_type = 'video' if ext in ['mp4', 'mov', 'avi', 'm4v'] else 'image'
            
            # Construct Thumbnail URL (Same logic for Image and Video now)
            # Backend creates thumb_filename.ext (e.g. thumb_video.mp4 -> it is actually a jpg but filename might differ based on impl)
            # In our create_thumbnail implementation above, we save it as thumb_{filename}.
            # Example: video.mp4 -> thumb_video.mp4 (content is jpeg).
            # Pillow save() keeps content as JPEG but filename depends on path.
            
            thumb_name = f"thumb_{filename}"
            thumbnail_url = url_for('photos.uploaded_file', filename=thumb_name, _external=True)

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

        cursor.close(); conn.close()
        return jsonify(photo_list), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error"}), 500

# ==========================================
# BULK ACTION
# ==========================================
@photos_bp.route('/bulk-action', methods=['POST'])
def bulk_action():
    data = request.json
    user_id = data.get('user_id')
    photo_ids = data.get('photo_ids') 
    action_type = data.get('action_type')

    if not user_id or not photo_ids or not action_type:
        return jsonify({"error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if action_type == 'hide':
            values = [(user_id, pid) for pid in photo_ids]
            sql = "INSERT IGNORE INTO hidden_photos (user_id, photo_id) VALUES (%s, %s)"
            cursor.executemany(sql, values)
            conn.commit()
            cursor.close(); conn.close()
            return jsonify({"message": "Photos hidden successfully"}), 200

        elif action_type == 'delete':
            format_strings = ','.join(['%s'] * len(photo_ids))
            cursor.execute(f"SELECT id, file_name, user_id FROM photos WHERE id IN ({format_strings})", tuple(photo_ids))
            photos_to_delete = cursor.fetchall()

            for photo in photos_to_delete:
                if str(photo['user_id']) != str(user_id):
                    cursor.close(); conn.close()
                    return jsonify({"error": "Unauthorized: You do not own all selected photos"}), 403

            cursor.execute(f"DELETE FROM photos WHERE id IN ({format_strings})", tuple(photo_ids))
            conn.commit()

            upload_folder = current_app.config['UPLOAD_FOLDER']
            for photo in photos_to_delete:
                try:
                    file_path = os.path.join(upload_folder, photo['file_name'])
                    if os.path.exists(file_path): os.remove(file_path)
                    thumb_path = os.path.join(upload_folder, f"thumb_{photo['file_name']}")
                    if os.path.exists(thumb_path): os.remove(thumb_path)
                except Exception as e:
                    print(f"File deletion error: {e}")

            cursor.close(); conn.close()
            return jsonify({"message": "Photos deleted successfully"}), 200

        else:
            return jsonify({"error": "Invalid action type"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# SINGLE ACTIONS
# ==========================================
@photos_bp.route('/hide-photo', methods=['POST'])
def hide_photo():
    return bulk_action() 

@photos_bp.route('/delete-photo', methods=['DELETE'])
def delete_photo():
    # Mapping delete single to bulk logic for cleaner code
    # But since frontend sends query params for single delete, we keep this wrapper
    user_id = request.args.get('user_id')
    photo_id = request.args.get('photo_id')
    
    # Create dummy request-like object or call logic directly? 
    # For safety, let's just keep original logic here to match frontend exactly
    if not user_id or not photo_id: return jsonify({"error": "Missing fields"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT file_name, user_id FROM photos WHERE id = %s", (photo_id,))
        photo = cursor.fetchone()
        if not photo:
            cursor.close(); conn.close(); return jsonify({"error": "Not found"}), 404
        if str(photo['user_id']) != str(user_id):
            cursor.close(); conn.close(); return jsonify({"error": "Unauthorized"}), 403
        cursor.execute("DELETE FROM photos WHERE id = %s", (photo_id,))
        conn.commit()
        upload_folder = current_app.config['UPLOAD_FOLDER']
        fp = os.path.join(upload_folder, photo['file_name'])
        if os.path.exists(fp): os.remove(fp)
        tp = os.path.join(upload_folder, f"thumb_{photo['file_name']}")
        if os.path.exists(tp): os.remove(tp)
        cursor.close(); conn.close()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

@photos_bp.route('/report-content', methods=['POST'])
def report_content():
    return jsonify({"message": "Reported"}), 200

@photos_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)