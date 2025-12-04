from flask import Blueprint, request, jsonify
from db import get_db_connection

# Define the Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    # Ensure the request Content-Type is application/json
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.json
    phone = data.get('phone_number')

    if not phone:
        return jsonify({"error": "phone_number is required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the user already exists in the database
        cursor.execute("SELECT id FROM users WHERE phone_number = %s", (phone,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            result = {
                "message": "User already exists", 
                "user_id": existing_user[0]
            }
            status_code = 200
        else:
            # Create a new user
            sql = "INSERT INTO users (phone_number) VALUES (%s)"
            cursor.execute(sql, (phone,))
            conn.commit()
            
            result = {
                "message": "User registered successfully", 
                "user_id": cursor.lastrowid
            }
            status_code = 201
        
        cursor.close()
        conn.close()
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500