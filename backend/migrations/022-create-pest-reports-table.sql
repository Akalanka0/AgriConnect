-- Create pest_reports table
CREATE TABLE IF NOT EXISTS `pest_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `type` ENUM('pest','disease','other') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `crop` VARCHAR(255) NOT NULL,
    `severity` ENUM('low','medium','high') NOT NULL,
    `notes` TEXT NULL,
    `resolution` TEXT NULL,
    `instructor_division` VARCHAR(255) NULL,
    `instructor_id` INT NULL,
    `status` ENUM('pending','in_progress','resolved') NOT NULL DEFAULT 'pending',
    `farmer_attachments` TEXT NULL,
    `instructor_attachments` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_pest_user` (`user_id`),
    INDEX `idx_pest_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
