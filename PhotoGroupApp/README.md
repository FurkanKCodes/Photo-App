# 📸 Photo Grouping API

**"Can you send me the photos?" - No more!**

This is a backend API service designed to solve the common problem of sharing photos after events, trips, or gatherings. Instead of sending photos individually to everyone, users can join a **Group Shared Gallery** using a unique code. Any photo uploaded to the group is instantly accessible to all members.

Currently, this repository hosts the **Backend RESTful API** that powers this logic, featuring a modular architecture and database integration.

## 🚀 Key Features (Completed)
* **📂 Group-Based Sharing:** Users can create groups or join existing ones via unique 8-character codes.
* **📸 Photo Upload System:** Support for uploading actual image files (`.jpg`, `.png`, etc.) directly to the server.
* **👀 Shared Gallery Access:** Endpoint to list and view all photos uploaded to a specific group.
* **🗄️ Database Integration:** Robust **MySQL** integration to store user, group, and photo metadata persistently.
* **🏗️ Modular Architecture:** The project is refactored into a scalable structure using Flask Blueprints (`routes/`, `db.py`, `app.py`) for better maintainability.
* **🛡️ Security:** Basic file validation and secure filename handling.

## 🛠️ Tech Stack
* **Language:** Python 3.x
* **Framework:** Flask (Microframework)
* **Database:** MySQL
* **Libraries:** `mysql-connector-python`, `python-dotenv`, `Werkzeug`
* **Tools:**
    * **Postman:** API Testing
    * **Git & GitHub:** Version Control

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/FurkanKCodes/Photo-App.git](https://github.com/FurkanKCodes/Photo-App.git)
cd Photo-App
```

### 2. Create a Virtual Environment
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables (.env)
Create a file named `.env` in the root directory and add your database configuration:
```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=photo_app_db
```

### 5. Run the Application
```bash
python app.py
```
*The server will start at `http://127.0.0.1:5000/`*

## 🔌 API Usage Examples

### ➤ 1. Upload a Photo
**Endpoint:** `POST /upload-photo`
**Type:** `multipart/form-data`

| Key | Type | Value |
| :--- | :--- | :--- |
| `photo` | File | *(Select an image file)* |
| `user_id` | Text | `1` |
| `group_code` | Text | `WBH2FW37` |

**Success Response:**
```json
{
  "filename": "holiday_pic.jpg",
  "message": "File uploaded successfully"
}
```

### ➤ 2. Get Group Photos
**Endpoint:** `GET /group-photos?group_code=WBH2FW37`

**Response:**
```json
[
    {
        "id": 1,
        "uploaded_by": "5551234567",
        "date": "2025-12-05 14:30:00",
        "url": "[http://127.0.0.1:5000/uploads/holiday_pic.jpg](http://127.0.0.1:5000/uploads/holiday_pic.jpg)"
    }
]
```

## 🗺️ Roadmap & Future Improvements

We are building this project with a **Micro-SaaS** mindset. The next steps include:

* **📱 Mobile Application (Frontend):** Developing a cross-platform mobile app using **React Native** or **Flutter** to consume this API.
* **👤 Enhanced User Profile:** Adding username, profile picture, and email fields to the User table.
* **🔐 Authentication:** Implementing **JWT (JSON Web Tokens)** for secure login and session management.
* **⚡ Optimization:** Implementing image compression (using **Pillow** or **C++** bindings) to reduce storage usage and increase speed.
* **☁️ Cloud Deployment:** Deploying the backend to AWS/Render and using S3 for photo storage.

## 👤 Authors
**Furkan** - [GitHub Profile](https://github.com/FurkanKCodes)
**Berkay** - [GitHub Profile](https://github.com/berkaykosencode)
**Erdem** - [GitHub Profile](https://github.com/erdemoz7)

---
