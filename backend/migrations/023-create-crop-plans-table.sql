-- Create crop_plans table
CREATE TABLE IF NOT EXISTS `crop_plans` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `crop_name` VARCHAR(100) NOT NULL,
    `field_location` VARCHAR(255) NOT NULL,
    `plant_date` DATE NOT NULL,
    `harvest_date` DATE NOT NULL,
    `notes` TEXT NULL,
    `instructor_feedback` TEXT NULL,
    `status` ENUM('pending','approved','rejected','correction') NOT NULL DEFAULT 'pending',
    `instructor_id` INT NULL,
    `instructor_division` VARCHAR(255) NULL,
    `farmer_attachments` JSON DEFAULT NULL,
    `instructor_attachments` JSON DEFAULT NULL,
    `reviewed_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_crop_plans_user` (`user_id`),
    INDEX `idx_crop_plans_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
