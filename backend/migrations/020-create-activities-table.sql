-- Create activities table
CREATE TABLE IF NOT EXISTS `activities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `type` ENUM('planting','irrigation','fertilizing','pest_control','harvesting','other') NOT NULL,
    `crop` VARCHAR(100) NOT NULL,
    `date` DATE NOT NULL,
    `notes` TEXT NULL,
    `location` VARCHAR(255) NULL,
    `instructor_division` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_activities_user` (`user_id`),
    INDEX `idx_activities_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
