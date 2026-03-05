-- Create harvest_records table
CREATE TABLE IF NOT EXISTS `harvest_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `crop` VARCHAR(100) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `quantity` VARCHAR(100) NOT NULL,
    `quality` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `instructor_division` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_harvest_user` (`user_id`),
    INDEX `idx_harvest_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
