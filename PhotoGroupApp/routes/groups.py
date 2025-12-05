from flask import Blueprint, request, jsonify
from db import get_db_connection
import string
import random

# Define the Blueprint for group operations
groups_bp = Blueprint('groups', __name__)

def generate_group_code():
    """Generates a random 8-character alphanumeric code."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=8))

@groups_bp.route('/create-group', methods=['POST'])
def create_group():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.json
    user_id = data.get('user_id')

    # 'user_id' is mandatory
    if not user_id:
        return jsonify({"error": "user_id is required to create a group"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Generate a unique group code
        new_code = ""
        while True:
            new_code = generate_group_code()
            cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (new_code,))
            if cursor.fetchone() is None:
                break 

        # 1. Insert new group into database
        # We still keep 'created_by' in groups_table for historical record
        sql_group = "INSERT INTO groups_table (group_code, created_by) VALUES (%s, %s)"
        cursor.execute(sql_group, (new_code, user_id))
        group_id = cursor.lastrowid # Get the ID of the newly created group

        # 2. Add the creator as the first member AND set them as ADMIN
        # is_admin = 1 (True)
        sql_member = "INSERT INTO groups_members (user_id, group_id, is_admin) VALUES (%s, %s, %s)"
        cursor.execute(sql_member, (user_id, group_id, 1))

        conn.commit()
        
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Group created successfully",
            "group_code": new_code,
            "group_id": group_id,
            "is_admin": True
        }), 201

    except Exception as e:
        print(f"Error: {e}") # Debugging
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500

@groups_bp.route('/join-group', methods=['POST'])
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
        cursor = conn.cursor(dictionary=True)

        # 1. Find the group by code
        cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (code,))
        group_row = cursor.fetchone()

        if not group_row:
            cursor.close()
            conn.close()
            return jsonify({"error": "Group not found"}), 404
        
        group_id = group_row['id']

        # 2. Check if the user is already a member
        cursor.execute(
            "SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", 
            (user_id, group_id)
        )
        existing_member = cursor.fetchone()

        if existing_member:
            cursor.close()
            conn.close()
            return jsonify({"message": "You are already a member of this group"}), 409

        # 3. Add user to the group (Default is_admin = 0, so we don't need to specify it)
        sql = "INSERT INTO groups_members (user_id, group_id) VALUES (%s, %s)"
        cursor.execute(sql, (user_id, group_id))
        conn.commit()
        
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success", 
            "message": "Joined group successfully",
            "group_id": group_id,
            "is_admin": False
        }), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500