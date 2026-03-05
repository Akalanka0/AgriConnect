-- Create instructor_ratings table
CREATE TABLE IF NOT EXISTS instructor_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id VARCHAR(50) NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    farmer_name VARCHAR(255),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (instructor_id) REFERENCES instructor_details(instructor_id) ON DELETE CASCADE,
    FOREIGN KEY (farmer_id) REFERENCES farmer_details(farmer_id) ON DELETE CASCADE,
    
    INDEX idx_instructor_ratings_instructor (instructor_id),
    INDEX idx_instructor_ratings_farmer (farmer_id),
    INDEX idx_instructor_ratings_status (status),
    
    UNIQUE KEY unique_farmer_instructor_rating (farmer_id, instructor_id)
);
