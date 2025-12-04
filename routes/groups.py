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
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Ensure the generated code is unique
        while True:
            new_code = generate_group_code()
            cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (new_code,))
            if cursor.fetchone() is None:
                break 

        # Insert new group into database
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
        cursor = conn.cursor()

        # Find the group by code
        cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (code,))
        group_row = cursor.fetchone()

        if not group_row:
            return jsonify({"error": "Group not found"}), 404
        
        group_id = group_row[0]

        # Add user to the group
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