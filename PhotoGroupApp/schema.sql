--We will be working on our own workbench. 
--First create a database named photo_app_db with MySQL
--Then these codes will be used to create tables

--Install Postman to your computer. Sign-in/Log-in to your account. After that click the import button(on the top left) and import the "MyCollection.postman_collection.json" file
--We are working with Postman to entegrate the data with our codes.

CREATE TABLE groups_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_code VARCHAR(10) UNIQUE NOT NULL,
    description VARCHAR(255) DEFAULT NUL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    group_name VARCHAR(255) NOT NULL DEFAULT 'Adsız Grup',
    picture VARCHAR(255) DEFAULT NULL,
    is_joining_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL AFTER email,
    profile_image VARCHAR(255) DEFAULT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    is_super_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    push_token VARCHAR(255) DEFAULT NULL;
);

CREATE TABLE groups_members(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    notifications TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE hidden_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    photo_id INT NOT NULL,
    hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hide (user_id, photo_id)
);

CREATE TABLE group_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE CASCADE,
    UNIQUE KEY unique_request (user_id, group_id)
);

CREATE TABLE content_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    photo_id INT NOT NULL,
    uploader_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('pending', 'reviewed', 'deleted') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE banned_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),
    username VARCHAR(50)
);

CREATE TABLE blocked_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blocker_id INT NOT NULL,
    blocked_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_block (blocker_id, blocked_id),
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);