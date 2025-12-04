import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request
import random
import string
import mysql.connector

# load the password's in the .env file
load_dotenv()

app = Flask(__name__)

# --- DATABASE CONFIGURATION ---
db_config = {
    'user': os.getenv('DB_USER'),      # reads from .env
    'password': os.getenv('DB_PASSWORD'), # reads from .env
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME')    #reads from .env
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

def generate_group_code():
    # Generate 8-character random code
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=8))

# --- 1. ENDPOINT: User Registration ---
@app.route('/register', methods=['POST'])
def register():
    # Expecting JSON payload
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.json
    phone = data.get('phone_number')

    if not phone:
        return jsonify({"error": "phone_number is required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE phone_number = %s", (phone,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            return jsonify({
                "message": "User already exists", 
                "user_id": existing_user[0]
            }), 200

        # Create new user
        sql = "INSERT INTO users (phone_number) VALUES (%s)"
        cursor.execute(sql, (phone,))
        conn.commit()
        
        new_user_id = cursor.lastrowid
        
        cursor.close()
        conn.close()

        return jsonify({
            "message": "User registered successfully", 
            "user_id": new_user_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- 2. ENDPOINT: Create Group ---
@app.route('/create-group', methods=['POST'])
def create_group():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Generate unique code
        while True:
            new_code = generate_group_code()
            # Note: Changed table name to 'groups_table' as per your setup
            cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (new_code,))
            if cursor.fetchone() is None:
                break 

        sql = "INSERT INTO groups_table (group_code) VALUES (%s)"
        cursor.execute(sql, (new_code,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Group created successfully",
            "group_code": new_code
        }), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- 3. ENDPOINT: Join Group ---
@app.route('/join-group', methods=['POST'])
def join_group():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415
        
    data = request.json
    user_id = data.get('user_id')
    code = data.get('group_code')

    if not user_id or not code:
        return jsonify({"error": "user_id and group_code are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Find Group ID
        cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (code,))
        group_row = cursor.fetchone()

        if not group_row:
            return jsonify({"error": "Group not found"}), 404
        
        group_id = group_row[0]

        # 2. Add User to Group (Using 'groups_members' table)
        # Note: Your table name is 'groups_members'
        sql = "INSERT INTO groups_members (user_id, group_id) VALUES (%s, %s)"
        cursor.execute(sql, (user_id, group_id))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success", 
            "message": "Joined group successfully"
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)