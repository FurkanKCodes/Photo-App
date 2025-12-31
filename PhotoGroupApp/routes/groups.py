import os
import string
import random
import requests # IMPORT REQUESTS
from flask import Blueprint, request, jsonify, current_app, send_from_directory, url_for
from werkzeug.utils import secure_filename
from db import get_db_connection
from PIL import Image

groups_bp = Blueprint('groups', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_group_code():
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=8))

# --- HELPER: THUMBNAIL ---
def create_thumbnail(image_path, filename):
    try:
        size = (300, 300)
        with Image.open(image_path) as img:
            if img.mode in ('RGBA', 'P'): img = img.convert('RGB')
            img.thumbnail(size)
            thumb_path = os.path.join(os.path.dirname(image_path), f"thumb_{filename}")
            img.save(thumb_path, "JPEG", quality=85)
            return f"thumb_{filename}"
    except Exception as e:
        print(f"Thumbnail error: {e}")
        return None

# --- HELPER: PUSH NOTIFICATION ---
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
        # Expo API Call
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=message,
            headers={"Accept": "application/json", "Accept-Encoding": "gzip, deflate"}
        )
    except Exception as e:
        print(f"Push notification error: {e}")

# ==========================================
# CREATE GROUP (Updated with Description)
# ==========================================
@groups_bp.route('/create-group', methods=['POST'])
def create_group():
    user_id = request.form.get('user_id')
    group_name = request.form.get('group_name')
    description = request.form.get('description') 

    if not user_id or not group_name:
        return jsonify({"error": "Missing data"}), 400

    picture_filename = None
    if 'picture' in request.files:
        file = request.files['picture']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_name = f"{generate_group_code()}_{filename}"
            path = current_app.config['UPLOAD_FOLDER']
            file.save(os.path.join(path, unique_name))
            create_thumbnail(os.path.join(path, unique_name), unique_name)
            picture_filename = unique_name

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        new_code = ""
        while True:
            new_code = generate_group_code()
            cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (new_code,))
            if not cursor.fetchone(): break 

        sql_group = "INSERT INTO groups_table (group_code, created_by, group_name, description, picture, is_joining_active) VALUES (%s, %s, %s, %s, %s, 1)"
        cursor.execute(sql_group, (new_code, user_id, group_name, description, picture_filename))
        group_id = cursor.lastrowid 

        sql_member = "INSERT INTO groups_members (user_id, group_id, is_admin) VALUES (%s, %s, %s)"
        cursor.execute(sql_member, (user_id, group_id, 1))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Group created", "group_code": new_code}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# EDIT GROUP 
# ==========================================
@groups_bp.route('/edit-group', methods=['POST'])
def edit_group():
    user_id = request.form.get('user_id')
    group_id = request.form.get('group_id')
    group_name = request.form.get('group_name')
    description = request.form.get('description')

    if not user_id or not group_id: return jsonify({"error": "Missing data"}), 400

    picture_filename = None
    if 'picture' in request.files:
        file = request.files['picture']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_name = f"{generate_group_code()}_{filename}"
            path = current_app.config['UPLOAD_FOLDER']
            file.save(os.path.join(path, unique_name))
            create_thumbnail(os.path.join(path, unique_name), unique_name)
            picture_filename = unique_name

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT is_admin FROM groups_members WHERE user_id=%s AND group_id=%s", (user_id, group_id))
        row = cursor.fetchone()
        if not row or row['is_admin'] != 1:
            cursor.close(); conn.close()
            return jsonify({"error": "Unauthorized"}), 403

        sql = "UPDATE groups_table SET group_name=%s, description=%s"
        params = [group_name, description]
        
        if picture_filename:
            sql += ", picture=%s"
            params.append(picture_filename)
        
        sql += " WHERE id=%s"
        params.append(group_id)

        cursor.execute(sql, tuple(params))
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "Updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# DELETE GROUP 
# ==========================================
@groups_bp.route('/delete-group', methods=['DELETE'])
def delete_group():
    user_id = request.args.get('user_id')
    group_id = request.args.get('group_id')

    if not user_id or not group_id:
        return jsonify({"error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT is_admin FROM groups_members WHERE user_id=%s AND group_id=%s", (user_id, group_id))
        row = cursor.fetchone()
        
        if not row or row['is_admin'] != 1:
            cursor.close(); conn.close()
            return jsonify({"error": "Unauthorized. Only admins can delete the group."}), 403

        cursor.execute("DELETE FROM groups_table WHERE id = %s", (group_id,))
        
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "Group deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# JOIN GROUP (UPDATED WITH PUSH NOTIFICATION)
# ==========================================
@groups_bp.route('/join-group', methods=['POST'])
def join_group():
    data = request.json
    user_id = data.get('user_id')
    code = data.get('group_code')

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Find Group & Check Status
        cursor.execute("SELECT id, group_name, picture, is_joining_active FROM groups_table WHERE group_code = %s", (code,))
        group = cursor.fetchone()

        if not group:
            cursor.close(); conn.close()
            return jsonify({"status": "error", "message": "Grup bulunamadı"}), 404
        
        if group['is_joining_active'] == 0:
            cursor.close(); conn.close()
            return jsonify({"status": "error", "message": "Gruba alımlar kapalı"}), 403

        group_id = group['id']

        # 2. Check Member
        cursor.execute("SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", (user_id, group_id))
        if cursor.fetchone():
            cursor.close(); conn.close()
            return jsonify({"status": "error", "message": "Zaten bu grubun üyesisiniz"}), 409

        # 3. Check Request
        cursor.execute("SELECT id FROM group_requests WHERE user_id = %s AND group_id = %s", (user_id, group_id))
        if cursor.fetchone():
            cursor.close(); conn.close()
            return jsonify({"status": "error", "message": "Zaten bir istek gönderdiniz"}), 409

        # 4. Create Request
        cursor.execute("INSERT INTO group_requests (user_id, group_id) VALUES (%s, %s)", (user_id, group_id))
        conn.commit()

        # --- NOTIFICATION LOGIC ---
        # Get Requestor Name
        cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        requestor = cursor.fetchone()
        requestor_name = requestor['username'] if requestor else "Bir kullanıcı"

        # Get Admins of the group who have push tokens
        sql_admins = """
            SELECT u.push_token 
            FROM users u
            JOIN groups_members gm ON u.id = gm.user_id
            WHERE gm.group_id = %s 
            AND gm.is_admin = 1 
            AND u.push_token IS NOT NULL
            AND gm.notifications = 1
        """
        cursor.execute(sql_admins, (group_id,))
        admins = cursor.fetchall()
        
        admin_tokens = [a['push_token'] for a in admins]

        if admin_tokens:
            title = group['group_name']
            body = f"{requestor_name}, {group['group_name']} grubuna katılma isteği gönderdi"
            data_payload = {"screen": "GroupDetails", "groupId": group_id}
            
            send_expo_push_notification(admin_tokens, title, body, data_payload)
        # --------------------------

        cursor.close(); conn.close()
        return jsonify({"status": "success", "message": "Katılma isteğiniz iletilmiştir."}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================
# BLOCK USER
# ==========================================
@groups_bp.route('/block-user', methods=['POST'])
def block_user():
    data = request.json
    blocker_id = data.get('blocker_id')
    blocked_id = data.get('blocked_id')

    if not blocker_id or not blocked_id:
        return jsonify({"error": "Missing IDs"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql_block = "INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (%s, %s)"
        cursor.execute(sql_block, (blocker_id, blocked_id))

        sql_hide_1 = """
            INSERT IGNORE INTO hidden_photos (user_id, photo_id)
            SELECT %s, id FROM photos WHERE user_id = %s
        """
        cursor.execute(sql_hide_1, (blocker_id, blocked_id))

        sql_hide_2 = """
            INSERT IGNORE INTO hidden_photos (user_id, photo_id)
            SELECT %s, id FROM photos WHERE user_id = %s
        """
        cursor.execute(sql_hide_2, (blocked_id, blocker_id))

        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "User blocked successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# UNBLOCK USER
# ==========================================
@groups_bp.route('/unblock-user', methods=['POST'])
def unblock_user():
    data = request.json
    blocker_id = data.get('blocker_id')
    blocked_id = data.get('blocked_id')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM blocked_users WHERE blocker_id = %s AND blocked_id = %s", (blocker_id, blocked_id))

        sql_unhide_1 = """
            DELETE FROM hidden_photos 
            WHERE user_id = %s 
            AND photo_id IN (SELECT id FROM photos WHERE user_id = %s)
        """
        cursor.execute(sql_unhide_1, (blocker_id, blocked_id))

        sql_unhide_2 = """
            DELETE FROM hidden_photos 
            WHERE user_id = %s 
            AND photo_id IN (SELECT id FROM photos WHERE user_id = %s)
        """
        cursor.execute(sql_unhide_2, (blocked_id, blocker_id))

        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "User unblocked"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# GET BLOCKED USERS
# ==========================================
@groups_bp.route('/get-blocked-users', methods=['GET'])
def get_blocked_users():
    user_id = request.args.get('user_id')
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT b.blocked_id, u.username, u.profile_image, b.created_at
            FROM blocked_users b
            JOIN users u ON b.blocked_id = u.id
            WHERE b.blocker_id = %s
            ORDER BY b.created_at DESC
        """
        cursor.execute(sql, (user_id,))
        users = cursor.fetchall()
        
        for u in users:
            if u['profile_image']:
                 u['thumbnail_url'] = url_for('groups.uploaded_file', filename=f"thumb_{u['profile_image']}", _external=True)
            else:
                 u['thumbnail_url'] = None

        cursor.close(); conn.close()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# TOGGLE JOINING STATUS
# ==========================================
@groups_bp.route('/toggle-joining', methods=['POST'])
def toggle_joining():
    data = request.json
    user_id = data.get('user_id')
    group_id = data.get('group_id')
    status = data.get('status') 

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT is_admin FROM groups_members WHERE user_id=%s AND group_id=%s", (user_id, group_id))
        row = cursor.fetchone()
        if not row or row[0] != 1:
            cursor.close(); conn.close()
            return jsonify({"error": "Sadece yöneticiler değiştirebilir"}), 403

        cursor.execute("UPDATE groups_table SET is_joining_active = %s WHERE id = %s", (status, group_id))
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "Updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# GET GROUP REQUESTS
# ==========================================
@groups_bp.route('/get-group-requests', methods=['GET'])
def get_group_requests():
    group_id = request.args.get('group_id')
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT r.id as request_id, u.id as user_id, u.username, u.profile_image 
            FROM group_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.group_id = %s
        """
        cursor.execute(sql, (group_id,))
        requests = cursor.fetchall()

        for r in requests:
            if r['profile_image']:
                r['thumbnail_url'] = url_for('groups.uploaded_file', filename=f"thumb_{r['profile_image']}", _external=True)
            else:
                r['thumbnail_url'] = None

        cursor.close(); conn.close()
        return jsonify(requests), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# MANAGE REQUEST 
# ==========================================
@groups_bp.route('/manage-request', methods=['POST'])
def manage_request():
    data = request.json
    admin_id = data.get('admin_id')
    group_id = data.get('group_id')
    target_user_id = data.get('target_user_id')
    action = data.get('action') 

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT is_admin FROM groups_members WHERE user_id=%s AND group_id=%s", (admin_id, group_id))
        row = cursor.fetchone()
        if not row or row[0] != 1:
            cursor.close(); conn.close()
            return jsonify({"error": "Sadece yöneticiler isteklere cevap verebilir"}), 403

        cursor.execute("DELETE FROM group_requests WHERE user_id=%s AND group_id=%s", (target_user_id, group_id))

        if action == 'accept':
            cursor.execute("INSERT INTO groups_members (user_id, group_id) VALUES (%s, %s)", (target_user_id, group_id))
            try:
                # A) Get Group Name
                cursor.execute("SELECT group_name FROM groups_table WHERE id = %s", (group_id,))
                group_res = cursor.fetchone()
                
                # B) Get Accepted User's Push Token
                cursor.execute("SELECT push_token FROM users WHERE id = %s", (target_user_id,))
                user_res = cursor.fetchone()

                if group_res and user_res and user_res[0]:
                    group_name = group_res[0]
                    user_token = user_res[0]
                    
                    # Send Notification
                    send_expo_push_notification(
                        tokens=[user_token],
                        title=group_name,
                        body=f"'{group_name}' grubuna katıldınız!",
                        data={"screen": "GroupDetails", "groupId": group_id}
                    )
            except Exception as notify_error:
                print(f"Notification error (Non-critical): {notify_error}")
            # --- NEW NOTIFICATION CODE END ---
        
        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "Success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# MANAGE MEMBER
# ==========================================
@groups_bp.route('/manage-member', methods=['POST'])
def manage_member():
    data = request.json
    admin_id = data.get('admin_id')
    group_id = data.get('group_id')
    target_user_id = data.get('target_user_id')
    action = data.get('action') 

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT is_admin FROM groups_members WHERE user_id=%s AND group_id=%s", (admin_id, group_id))
        row = cursor.fetchone()
        if not row or row[0] != 1:
            cursor.close(); conn.close()
            return jsonify({"error": "Unauthorized"}), 403

        if action == 'kick':
            cursor.execute("DELETE FROM groups_members WHERE user_id=%s AND group_id=%s", (target_user_id, group_id))
        
        elif action == 'promote':
            cursor.execute("UPDATE groups_members SET is_admin = 0 WHERE user_id=%s AND group_id=%s", (admin_id, group_id))
            cursor.execute("UPDATE groups_members SET is_admin = 1 WHERE user_id=%s AND group_id=%s", (target_user_id, group_id))

        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "Success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# LEAVE GROUP
# ==========================================
@groups_bp.route('/leave-group', methods=['POST'])
def leave_group():
    data = request.json
    user_id = data.get('user_id')
    group_id = data.get('group_id')

    if not user_id or not group_id:
        return jsonify({"error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT is_admin FROM groups_members WHERE user_id=%s AND group_id=%s", (user_id, group_id))
        member_row = cursor.fetchone()

        if not member_row:
            cursor.close(); conn.close()
            return jsonify({"error": "Member not found"}), 404
        
        was_admin = (member_row['is_admin'] == 1)

        cursor.execute("DELETE FROM groups_members WHERE user_id=%s AND group_id=%s", (user_id, group_id))

        cursor.execute("SELECT count(*) as count FROM groups_members WHERE group_id=%s", (group_id,))
        res = cursor.fetchone()
        
        if res['count'] == 0:
            cursor.execute("DELETE FROM groups_table WHERE id=%s", (group_id,))
            
            conn.commit()
            cursor.close(); conn.close()
            return jsonify({"message": "Left group and group deleted (empty)"}), 200
        
        if was_admin:
            cursor.execute("SELECT user_id FROM groups_members WHERE group_id=%s AND is_admin=1", (group_id,))
            remaining_admin = cursor.fetchone()

            if not remaining_admin:
                cursor.execute("SELECT user_id FROM groups_members WHERE group_id=%s ORDER BY id ASC LIMIT 1", (group_id,))
                heir = cursor.fetchone()
                
                if heir:
                    cursor.execute("UPDATE groups_members SET is_admin=1 WHERE user_id=%s AND group_id=%s", (heir['user_id'], group_id))

        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"message": "Left group successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# GET GROUP DETAILS 
# ==========================================
@groups_bp.route('/get-group-details', methods=['GET'])
def get_group_details():
    group_id = request.args.get('group_id')
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, group_name, description, picture, group_code, is_joining_active FROM groups_table WHERE id = %s", (group_id,))
        group = cursor.fetchone()
        
        if group:
            if group['picture']:
                group['picture_url'] = url_for('groups.uploaded_file', filename=group['picture'], _external=True)
                group['thumbnail_url'] = url_for('groups.uploaded_file', filename=f"thumb_{group['picture']}", _external=True)
            else:
                group['picture_url'] = None; group['thumbnail_url'] = None
        
        cursor.close(); conn.close()
        return jsonify(group) if group else (jsonify({"error": "Not found"}), 404)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# OTHER ROUTES 
# ==========================================
@groups_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@groups_bp.route('/get-group-members', methods=['GET'])
def get_group_members():
    group_id = request.args.get('group_id')
    current_user_id = request.args.get('current_user_id')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sql = """
            SELECT 
                u.id, 
                u.username, 
                u.profile_image, 
                gm.is_admin, 
                gm.notifications,
                CASE WHEN u.id = %s THEN 0 ELSE 1 END as sort_order,
                CASE WHEN EXISTS (SELECT 1 FROM blocked_users WHERE blocker_id = %s AND blocked_id = u.id) THEN 1 ELSE 0 END as is_blocked_by_me
            FROM groups_members gm 
            JOIN users u ON gm.user_id = u.id 
            WHERE gm.group_id = %s 
            AND u.id NOT IN (
                SELECT blocker_id FROM blocked_users WHERE blocked_id = %s
            )
            ORDER BY sort_order ASC, u.username ASC
        """
        cursor.execute(sql, (current_user_id, current_user_id, group_id, current_user_id))
        members = cursor.fetchall()
        
        for m in members:
            if m['profile_image']:
                m['profile_url'] = url_for('groups.uploaded_file', filename=m['profile_image'], _external=True)
                m['thumbnail_url'] = url_for('groups.uploaded_file', filename=f"thumb_{m['profile_image']}", _external=True)
            else: m['profile_url'] = None; m['thumbnail_url'] = None
            
        cursor.close(); conn.close()
        return jsonify(members), 200
    except Exception as e: return jsonify({"error": str(e)}), 500


# ==========================================
# GET USER GROUPS (UPDATED: Returns Members)
# ==========================================
@groups_bp.route('/my-groups', methods=['GET'])
def get_user_groups():
    user_id = request.args.get('user_id')
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 1. Fetch Groups
        sql = """
            SELECT g.id, g.group_name, g.group_code, g.picture, gm.is_admin 
            FROM groups_table g 
            JOIN groups_members gm ON g.id = gm.group_id 
            WHERE gm.user_id = %s 
            ORDER BY gm.joined_at DESC
        """
        cursor.execute(sql, (user_id,))
        groups = cursor.fetchall()
        
        # 2. Fetch Members for each group to display in the list
        for g in groups:
            # Image URL logic
            if g['picture']:
                g['picture_url'] = url_for('groups.uploaded_file', filename=g['picture'], _external=True)
                g['thumbnail_url'] = url_for('groups.uploaded_file', filename=f"thumb_{g['picture']}", _external=True)
            else: 
                g['picture_url'] = None
                g['thumbnail_url'] = None
            
            # --- NEW: Fetch Members for this group ---
            # We fetch ID and Username to sort them in Frontend
            member_sql = """
                SELECT u.id, u.username 
                FROM users u 
                JOIN groups_members gm ON u.id = gm.user_id 
                WHERE gm.group_id = %s
                AND u.id NOT IN (
                    SELECT blocker_id FROM blocked_users WHERE blocked_id = %s
                )
            """
            cursor.execute(member_sql, (g['id'], user_id))
            g['members'] = cursor.fetchall()
            # -----------------------------------------

        cursor.close(); conn.close()
        return jsonify(groups), 200
    except Exception as e: return jsonify({"error": str(e)}), 500

# ==========================================
# TOGGLE NOTIFICATIONS
# ==========================================
@groups_bp.route('/toggle-notifications', methods=['POST'])
def toggle_notifications():
    data = request.json
    user_id = data.get('user_id')
    group_id = data.get('group_id')

    if not user_id or not group_id:
        return jsonify({"error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Toggle notification status (1 -> 0 or 0 -> 1)
        sql = """
            UPDATE groups_members 
            SET notifications = CASE WHEN notifications = 1 THEN 0 ELSE 1 END
            WHERE user_id = %s AND group_id = %s
        """
        cursor.execute(sql, (user_id, group_id))
        conn.commit()

        # Fetch new status to return to frontend
        cursor.execute("SELECT notifications FROM groups_members WHERE user_id = %s AND group_id = %s", (user_id, group_id))
        row = cursor.fetchone()
        new_status = row[0] if row else 1

        cursor.close(); conn.close()
        return jsonify({"message": "Notification status updated", "notifications": new_status}), 200

    except Exception as e:
        print(f"Toggle notification error: {e}")
        return jsonify({"error": str(e)}), 500