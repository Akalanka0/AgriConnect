-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    recipient_type ENUM('all', 'farmers', 'instructors', 'select', 'admin') NOT NULL,
    recipient_id INT NULL,
    sender_id INT NOT NULL,
    attachment_url VARCHAR(255) NULL,
    attachment_public_id VARCHAR(100) NULL,
    attachment_name VARCHAR(255) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_recipient_type (recipient_type),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
);
