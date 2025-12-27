import os
import string
import random
import datetime
from flask import Blueprint, request, jsonify, current_app, url_for
from db import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from PIL import Image

auth_bp = Blueprint('auth', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- THUMBNAIL HELPER ---
def create_thumbnail(image_path, filename):
    try:
        size = (300, 300)
        with Image.open(image_path) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.thumbnail(size)
            thumb_path = os.path.join(os.path.dirname(image_path), f"thumb_{filename}")
            img.save(thumb_path, "JPEG", quality=85)
            print(f"Profile thumbnail created: thumb_{filename}")
    except Exception as e:
        print(f"Thumbnail error: {e}")

@auth_bp.route('/register', methods=['POST'])
def register():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    phone_number = data.get('phone_number')

    if not username or not email or not password or not phone_number:
        return jsonify({"error": "Username, email, password AND phone_number are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. CHECK IF PHONE NUMBER IS BANNED
        cursor.execute("SELECT id FROM banned_users WHERE phone_number = %s", (phone_number,))
        banned_user = cursor.fetchone()
        
        if banned_user:
            cursor.close()
            conn.close()
            return jsonify({"error": "This phone number has been banned from the system."}), 403

        # 2. CHECK IF USER EXISTS
        cursor.execute("SELECT id FROM users WHERE email = %s OR phone_number = %s", (email, phone_number))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({"message": "User with this email, or phone already exists"}), 409

        hashed_password = generate_password_hash(password)

        sql = """
            INSERT INTO users (username, email, password_hash, phone_number, is_super_admin) 
            VALUES (%s, %s, %s, %s, 0)
        """
        cursor.execute(sql, (username, email, hashed_password, phone_number))
        conn.commit()
        
        new_user_id = cursor.lastrowid
        cursor.close()
        conn.close()

        return jsonify({"message": "User registered successfully", "user_id": new_user_id}), 201

    except Exception as e:
        print(f"Error during register: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.json
    phone_number = data.get('phone_number')
    password = data.get('password')

    if not phone_number or not password:
        return jsonify({"error": "Phone number and password are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM users WHERE phone_number = %s", (phone_number,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and check_password_hash(user['password_hash'], password):
            
            profile_url = None
            thumb_url = None
            if user['profile_image']:
                profile_url = url_for('groups.uploaded_file', filename=user['profile_image'], _external=True)
                thumb_url = url_for('groups.uploaded_file', filename=f"thumb_{user['profile_image']}", _external=True)

            return jsonify({
                "message": "Login successful",
                "user_id": user['id'],
                "username": user['username'],
                "is_super_admin": user['is_super_admin'],
                "profile_image": user['profile_image'],
                "profile_url": profile_url,
                "thumbnail_url": thumb_url
            }), 200
        else:
            return jsonify({"error": "Hatalı telefon numarası veya şifre"}), 401 # 

    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/get-user', methods=['GET'])
def get_user():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # ADDED is_super_admin to SELECT
        cursor.execute("""
            SELECT id, username, email, phone_number, profile_image, is_super_admin, 
                   plan, daily_photo_count, daily_video_count, last_upload_date 
            FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        # Add URLs
        if user and user['profile_image']:
            user['profile_url'] = url_for('groups.uploaded_file', filename=user['profile_image'], _external=True)
            user['thumbnail_url'] = url_for('groups.uploaded_file', filename=f"thumb_{user['profile_image']}", _external=True)
        else:
            user['profile_url'] = None
            user['thumbnail_url'] = None

        cursor.close()
        conn.close()

        if user:
            return jsonify(user), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"Error fetching user: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/update-profile', methods=['POST'])
def update_profile():
    try:
        user_id = request.form.get('user_id')
        username = request.form.get('username')
        email = request.form.get('email')
        phone_number = request.form.get('phone_number')

        if not user_id:
            return jsonify({"error": "User ID required"}), 400

        picture_filename = None
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_name = f"user_{user_id}_{random.randint(1000,9999)}_{filename}"
                
                upload_path = current_app.config['UPLOAD_FOLDER']
                save_path = os.path.join(upload_path, unique_name)
                
                # 1. Save Original
                file.save(save_path)
                
                # 2. Generate Thumbnail
                create_thumbnail(save_path, unique_name)
                
                picture_filename = unique_name

        conn = get_db_connection()
        cursor = conn.cursor()

        query = "UPDATE users SET username=%s, email=%s, phone_number=%s"
        params = [username, email, phone_number]

        if picture_filename:
            query += ", profile_image=%s"
            params.append(picture_filename)

        query += " WHERE id=%s"
        params.append(user_id)

        cursor.execute(query, tuple(params))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        print(f"Error updating profile: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/delete-account', methods=['DELETE'])
def delete_account():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM groups_members WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Account deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting account: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415
    data = request.json
    user_id = data.get('user_id')
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not user_id or not current_password or not new_password:
        return jsonify({"error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        if not check_password_hash(user['password_hash'], current_password):
            cursor.close()
            conn.close()
            return jsonify({"error": "Current password incorrect"}), 401 

        new_hashed_password = generate_password_hash(new_password)
        cursor.close()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hashed_password, user_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        print(f"Error changing password: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================
# UPDATE PUSH TOKEN
# ==========================================
@auth_bp.route('/update-push-token', methods=['POST'])
def update_push_token():
    data = request.json
    user_id = data.get('user_id')
    push_token = data.get('push_token')

    if not user_id or not push_token:
        return jsonify({"error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Save the token to the database
        cursor.execute("UPDATE users SET push_token = %s WHERE id = %s", (push_token, user_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Token updated"}), 200
    except Exception as e:
        print(f"Token update error: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/reset-password-via-phone', methods=['POST'])
def reset_password_via_phone():
    if not request.is_json:
        return jsonify({"error": "JSON formatı gerekli"}), 415

    data = request.json
    phone_number = data.get('phone_number')
    new_password = data.get('new_password')

    if not phone_number or not new_password:
        return jsonify({"error": "Telefon numarası ve yeni şifre gerekli"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Kullanıcı var mı kontrol et
        cursor.execute("SELECT id FROM users WHERE phone_number = %s", (phone_number,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "Bu numarayla kayıtlı kullanıcı bulunamadı"}), 404

        # 2. Yeni şifreyi hashle ve güncelle
        new_hashed_password = generate_password_hash(new_password)
        
        # Cursor'ı yeniden oluştur (Dict olmayan cursor gerekebilir veya aynı cursor ile devam)
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hashed_password, user['id']))
        conn.commit()
        
        cursor.close()
        conn.close()

        return jsonify({"message": "Şifreniz başarıyla sıfırlandı."}), 200

    except Exception as e:
        print(f"Password reset error: {e}")
        return jsonify({"error": str(e)}), 500