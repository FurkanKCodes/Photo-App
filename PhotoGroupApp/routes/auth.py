from flask import Blueprint, request, jsonify
from db import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash  # Import hashing function

# Define the Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    # Ensure the request Content-Type is application/json
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.json
    
    # Extract new fields
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    phone_number = data.get('phone_number') # Optional now, or keep if DB requires it

    # Validate required fields
    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Check if email or username already exists
        cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({"message": "User with this email or username already exists"}), 409 # 409 Conflict

        # 2. Hash the password (SECURITY CRITICAL STEP)
        # We never save plain text passwords in the database
        hashed_password = generate_password_hash(password)

        # 3. Create a new user
        # Note: We are inserting into the new columns we added via ALTER TABLE
        sql = """
            INSERT INTO users (username, email, password_hash, phone_number) 
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(sql, (username, email, hashed_password, phone_number))
        conn.commit()
        
        new_user_id = cursor.lastrowid
        
        cursor.close()
        conn.close()

        return jsonify({
            "message": "User registered successfully", 
            "user_id": new_user_id
        }), 201

    except Exception as e:
        print(f"Error: {e}") # Print error to console for debugging
        return jsonify({"error": "Internal Server Error"}), 500



@auth_bp.route('/login', methods=['POST'])
def login():
    # Gelen veri JSON mu kontrol et
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.json
    email = data.get('email')
    password = data.get('password')

    # Email ve şifre girilmiş mi?
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) # dictionary=True ile verileri {key: value} olarak çekeriz
        
        # Kullanıcıyı emaile göre bul
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()

        # Kullanıcı var mı VE şifre eşleşiyor mu?
        if user and check_password_hash(user['password_hash'], password):
            # Giriş Başarılı!
            # Normalde burada bir "Token" oluşturup döndürürüz ama şimdilik ID yeterli.
            return jsonify({
                "message": "Login successful",
                "user_id": user['id'],
                "username": user['username']
            }), 200
        else:
            # Hatalı giriş
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500