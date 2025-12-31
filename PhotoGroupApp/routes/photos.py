import os
import requests # IMPORT REQUESTS FOR PUSH
from flask import Blueprint, request, jsonify, send_from_directory, current_app, url_for
from werkzeug.utils import secure_filename
from db import get_db_connection
from PIL import Image, ImageOps
import cv2 
from datetime import datetime

photos_bp = Blueprint('photos', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'm4v'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- HELPER: PUSH NOTIFICATION (Repeated to keep file standalone) ---
def send_expo_push_notification(tokens, title, body, data=None):
    if not tokens: return
    try:
        message = {
            "to": tokens,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data or {}
        }
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=message,
            headers={"Accept": "application/json", "Accept-Encoding": "gzip, deflate"}
        )
    except Exception as e:
        print(f"Push notification error: {e}")

# ==========================================
# HELPER: CREATE THUMBNAIL 
# ==========================================
def create_thumbnail(file_path, filename):
    try:
        size = (300, 300)
        ext = filename.rsplit('.', 1)[1].lower()
        is_video = ext in ['mp4', 'mov', 'avi', 'm4v']
        
        img = None

        if is_video:
            cam = cv2.VideoCapture(file_path)
            ret, frame = cam.read()
            if ret:
                img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            cam.release()
        else:
            img = Image.open(file_path)
            img = ImageOps.exif_transpose(img) 
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

        if img:
            img.thumbnail(size)
            thumb_filename = f"thumb_{filename}"
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
# UPLOAD PHOTO (UPDATED WITH LAZY RESET LIMITS)
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
            cursor = conn.cursor(dictionary=True)

            # Check membership
            cursor.execute("SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", (user_id, group_id))
            if not cursor.fetchone():
                cursor.close(); conn.close()
                return jsonify({"error": "You are not a member of this group"}), 403

            # --- START: LAZY RESET & LIMIT CHECK LOGIC ---
            
            # Determine if it is video or photo based on extension
            ext = file.filename.rsplit('.', 1)[1].lower()
            is_video = ext in ['mp4', 'mov', 'avi', 'm4v']
            
            # Get current UTC date
            today = datetime.utcnow().date()
            
            # Fetch user stats
            cursor.execute("SELECT daily_photo_count, daily_video_count, last_upload_date FROM users WHERE id = %s", (user_id,))
            user_stats = cursor.fetchone()
            
            if user_stats:
                db_date = user_stats['last_upload_date']
                
                # LAZY RESET: If date is None (new user) or old date (yesterday etc.)
                if db_date is None or db_date < today:
                    # Reset counters and update date to today
                    cursor.execute("""
                        UPDATE users 
                        SET daily_photo_count = 0, daily_video_count = 0, last_upload_date = %s 
                        WHERE id = %s
                    """, (today, user_id))
                    conn.commit()
                    # Update local variables for the check below
                    current_p_count = 0
                    current_v_count = 0
                else:
                    current_p_count = user_stats['daily_photo_count']
                    current_v_count = user_stats['daily_video_count']

                # LIMIT CHECK
                if is_video:
                    if current_v_count >= 2:
                        cursor.close(); conn.close()
                        return jsonify({"error": "LIMIT_EXCEEDED_VIDEO"}), 403
                else:
                    if current_p_count >= 10:
                        cursor.close(); conn.close()
                        return jsonify({"error": "LIMIT_EXCEEDED_PHOTO"}), 403
            
            # --- END: LAZY RESET & LIMIT CHECK LOGIC ---

            filename = secure_filename(file.filename)
            upload_folder = current_app.config['UPLOAD_FOLDER']
            save_path = os.path.join(upload_folder, filename)
            file.save(save_path)

            create_thumbnail(save_path, filename)

            sql = "INSERT INTO photos (file_name, user_id, group_id, upload_date) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (filename, user_id, group_id, datetime.utcnow()))
            
            # --- INCREMENT COUNTER AFTER SUCCESSFUL INSERT ---
            if is_video:
                cursor.execute("UPDATE users SET daily_video_count = daily_video_count + 1 WHERE id = %s", (user_id,))
            else:
                cursor.execute("UPDATE users SET daily_photo_count = daily_photo_count + 1 WHERE id = %s", (user_id,))
            
            conn.commit()
            # -------------------------------------------------

            # ... (NOTIFICATION LOGIC) ...
            # Get Group Info & Uploader Info
            cursor.execute("SELECT group_name FROM groups_table WHERE id = %s", (group_id,))
            group_row = cursor.fetchone()
            
            cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
            user_row = cursor.fetchone()

            if group_row and user_row:
                group_name = group_row['group_name']
                uploader_name = user_row['username']

                sql_members = """
                    SELECT u.push_token 
                    FROM users u
                    JOIN groups_members gm ON u.id = gm.user_id
                    WHERE gm.group_id = %s 
                    AND u.id != %s 
                    AND u.push_token IS NOT NULL
                    AND gm.notifications = 1
                """
                cursor.execute(sql_members, (group_id, user_id))
                members = cursor.fetchall()
                
                tokens = [m['push_token'] for m in members]

                if tokens:
                    title = group_name
                    body = f"{uploader_name}, {group_name} grubuna medya yükledi"
                    data_payload = {"screen": "MediaGallery", "groupId": group_id}
                    
                    send_expo_push_notification(tokens, title, body, data_payload)
            
            cursor.close(); conn.close()

            return jsonify({"message": "File uploaded successfully", "filename": filename}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
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
                "date": photo['upload_date'].isoformat() + 'Z'
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
    user_id = request.args.get('user_id')
    photo_id = request.args.get('photo_id')
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

# ==========================================
# REPORT CONTENT (FIXED: GETS UPLOADER_ID)
# ==========================================
@photos_bp.route('/report-content', methods=['POST'])
def report_content():
    data = request.json
    reporter_id = data.get('reporter_id')
    photo_id = data.get('photo_id')
    reason = data.get('reason')

    if not reporter_id or not photo_id or not reason:
        return jsonify({"error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT user_id FROM photos WHERE id = %s", (photo_id,))
        result = cursor.fetchone()
        
        if not result:
            cursor.close(); conn.close()
            return jsonify({"error": "Photo not found"}), 404
            
        uploader_id = result[0]

        sql = "INSERT INTO content_reports (reporter_id, uploader_id, photo_id, reason) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (reporter_id, uploader_id, photo_id, reason))
        conn.commit()
        
        cursor.close()
        conn.close()
        return jsonify({"message": "Reported successfully"}), 201
    except Exception as e:
        print(f"Report error: {e}")
        return jsonify({"error": str(e)}), 500

@photos_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)