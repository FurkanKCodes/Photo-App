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

            # Verify group existence
            cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (group_code,))
            group_row = cursor.fetchone()
            if not group_row:
                return jsonify({"error": "Group not found"}), 404
            group_id = group_row[0]

            # Secure the filename and save the file
            filename = secure_filename(file.filename)
            # Use current_app.config to access the upload folder path
            save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)

            # Insert metadata into the database
            sql = "INSERT INTO photos (file_name, user_id, group_id) VALUES (%s, %s, %s)"
            cursor.execute(sql, (filename, user_id, group_id))
            conn.commit()
            
            cursor.close()
            conn.close()

            return jsonify({
                "message": "File uploaded successfully", 
                "filename": filename
            }), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

@photos_bp.route('/group-photos', methods=['GET'])
def get_group_photos():
    group_code = request.args.get('group_code')
    if not group_code:
        return jsonify({"error": "group_code is required"}), 400

    try:
        conn = get_db_connection()
        # dictionary=True ensures results are returned as JSON-like objects
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM groups_table WHERE group_code = %s", (group_code,))
        group_row = cursor.fetchone()

        if not group_row:
            return jsonify({"error": "Group not found"}), 404
        
        group_id = group_row['id']
        
        # Join query to get photos along with user info
        sql = """
            SELECT photos.id, photos.file_name, photos.upload_date, users.phone_number 
            FROM photos 
            JOIN users ON photos.user_id = users.id 
            WHERE photos.group_id = %s
            ORDER BY photos.upload_date DESC
        """
        cursor.execute(sql, (group_id,))
        photos = cursor.fetchall()

        photo_list = []
        for photo in photos:
            # Generate the full URL for the image
            # 'photos.uploaded_file' refers to the function below within this blueprint
            photo_url = url_for('photos.uploaded_file', filename=photo['file_name'], _external=True)
            
            photo_list.append({
                "id": photo['id'],
                "url": photo_url,
                "uploaded_by": photo['phone_number'],
                "date": photo['upload_date']
            })

        cursor.close()
        conn.close()
        return jsonify(photo_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@photos_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serves the uploaded file to the client."""
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)