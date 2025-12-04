--We will be working on our own workbench. 
--First create a database named photo_app_db with MySQL
--Then these codes will be used to create tables

--Install Postman to your computer. Sign-in/Log-in to your account. After that click the import button(on the top left) and import the "MyCollection.postman_collection.json" file
--We are working with Postman to entegrate the data with our codes.

CREATE TABLE groups_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE groups_members(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups_table(id) ON DELETE CASCADE ON UPDATE CASCADE
);