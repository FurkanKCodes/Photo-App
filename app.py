import os
from flask import Flask
from dotenv import load_dotenv

# Import Blueprints
from routes.auth import auth_bp
from routes.groups import groups_bp
from routes.photos import photos_bp

# Load environment variables
load_dotenv()

app = Flask(__name__)

# --- CONFIGURATION ---
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create the upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- REGISTER BLUEPRINTS ---
# Register the modular routes with the main application
app.register_blueprint(auth_bp)
app.register_blueprint(groups_bp)
app.register_blueprint(photos_bp)

if __name__ == '__main__':
    app.run(debug=True)