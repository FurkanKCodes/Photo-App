import os
import string
import random
from flask import Blueprint, request, jsonify, current_app
from db import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# Define the Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
        
        cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({"message": "User with this email or username already exists"}), 409

        hashed_password = generate_password_hash(password)

        sql = """
            INSERT INTO users (username, email, password_hash, phone_number) 
            VALUES (%s, %s, %s, %s)
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
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user and check_password_hash(user['password_hash'], password):
            return jsonify({
                "message": "Login successful",
                "user_id": user['id'],
                "username": user['username']
            }), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================
# GET USER DETAILS (UPDATED: profile_image)
# ==========================================
@auth_bp.route('/get-user', methods=['GET'])
def get_user():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # UPDATED: Using 'profile_image' column
        cursor.execute("SELECT id, username, email, phone_number, profile_image FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            return jsonify(user), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"Error fetching user: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================
# UPDATE PROFILE (UPDATED: profile_image)
# ==========================================
@auth_bp.route('/update-profile', methods=['POST'])
def update_profile():
    try:
        user_id = request.form.get('user_id')
        username = request.form.get('username')
        email = request.form.get('email')
        phone_number = request.form.get('phone_number')

        if not user_id:
            return jsonify({"error": "User ID required"}), 400

        # Image Handling
        picture_filename = None
        # UPDATED: checking for 'profile_image' in files
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Unique name
                unique_name = f"user_{user_id}_{random.randint(1000,9999)}_{filename}"
                upload_path = current_app.config['UPLOAD_FOLDER']
                file.save(os.path.join(upload_path, unique_name))
                picture_filename = unique_name

        conn = get_db_connection()
        cursor = conn.cursor()

        query = "UPDATE users SET username=%s, email=%s, phone_number=%s"
        params = [username, email, phone_number]

        # UPDATED: updating 'profile_image' column
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

# ==========================================
# DELETE ACCOUNT
# ==========================================
@auth_bp.route('/delete-account', methods=['DELETE'])
def delete_account():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Delete from groups_members
        cursor.execute("DELETE FROM groups_members WHERE user_id = %s", (user_id,))
        
        # 2. Delete the user
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Account deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting account: {e}")
        return jsonify({"error": str(e)}), 500