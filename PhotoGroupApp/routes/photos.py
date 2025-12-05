import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app, url_for
from werkzeug.utils import secure_filename
from db import get_db_connection

# Define the Blueprint for photo operations
photos_bp = Blueprint('photos', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """Checks if the file has a valid extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_group_member(user_id, group_id):
    """Helper function to check if a user is a member of a group."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", 
        (user_id, group_id)
    )
    member = cursor.fetchone()
    cursor.close()
    conn.close()
    return member is not None

@photos_bp.route('/upload-photo', methods=['POST'])
def upload_photo():
    # Check if the file part is in the request
    if 'photo' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['photo']
    user_id = request.form.get('user_id')
    group_code = request.form.get('group_code')

    if file.filename == '' or not user_id or not group_code:
        return jsonify({"error": "Missing data"}), 400

    if file and allowed_file(file.filename):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # 1. Verify group existence
            cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (group_code,))
            group_row = cursor.fetchone()
            if not group_row:
                cursor.close()
                conn.close()
                return jsonify({"error": "Group not found"}), 404
            
            group_id = group_row[0]

            # 2. SECURITY CHECK: Verify if the user is a MEMBER
            # We check manually here (or use the helper function)
            cursor.execute(
                "SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", 
                (user_id, group_id)
            )
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": "You are not a member of this group"}), 403

            # 3. Secure the filename and save
            filename = secure_filename(file.filename)
            save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)

            # 4. Insert metadata
            sql = "INSERT INTO photos (file_name, user_id, group_id) VALUES (%s, %s, %s)"
            cursor.execute(sql, (filename, user_id, group_id))
            conn.commit()
            
            cursor.close()
            conn.close()

            return jsonify({
                "message": "File uploaded successfully", 
                "filename": filename,
                "group_id": group_id
            }), 201

        except Exception as e:
            print(f"Error: {e}")
            return jsonify({"error": "Internal Server Error"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

@photos_bp.route('/group-photos', methods=['GET'])
def get_group_photos():
    # Now we require BOTH group_code AND user_id for security
    group_code = request.args.get('group_code')
    user_id = request.args.get('user_id')

    if not group_code or not user_id:
        return jsonify({"error": "group_code and user_id are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Get Group ID
        cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (group_code,))
        group_row = cursor.fetchone()

        if not group_row:
            cursor.close()
            conn.close()
            return jsonify({"error": "Group not found"}), 404
        
        group_id = group_row['id']
        
        # 2. SECURITY CHECK: Is the user requesting this list a member?
        cursor.execute(
            "SELECT id FROM groups_members WHERE user_id = %s AND group_id = %s", 
            (user_id, group_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            # 403 Forbidden: You can't see these photos!
            return jsonify({"error": "You are not authorized to view this group's photos"}), 403

        # 3. Fetch Photos (Only if authorized)
        sql = """
            SELECT photos.id, photos.file_name, photos.upload_date, 
                   users.username, users.profile_image
            FROM photos 
            JOIN users ON photos.user_id = users.id 
            WHERE photos.group_id = %s
            ORDER BY photos.upload_date DESC
        """
        cursor.execute(sql, (group_id,))
        photos = cursor.fetchall()

        photo_list = []
        for photo in photos:
            photo_url = url_for('photos.uploaded_file', filename=photo['file_name'], _external=True)
            
            photo_list.append({
                "id": photo['id'],
                "url": photo_url,
                "uploaded_by": photo['username'],
                "user_avatar": photo['profile_image'],
                "date": photo['upload_date']
            })

        cursor.close()
        conn.close()
        return jsonify(photo_list), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@photos_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serves the uploaded file to the client."""
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)