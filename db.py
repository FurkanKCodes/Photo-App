import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration settings from .env file
db_config = {
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME')
}

def get_db_connection():
    """Establishes and returns a connection to the MySQL database."""
    return mysql.connector.connect(**db_config)