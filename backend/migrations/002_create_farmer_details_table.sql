-- Migration: Create farmer_details table
-- Created: 2024
-- Description: Extended details for farmer role

CREATE TABLE IF NOT EXISTS `farmer_details` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL UNIQUE,
    `farmer_id` VARCHAR(50) NOT NULL UNIQUE,
    `address` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Indexes
    INDEX `idx_farmer_details_user_id` (`user_id`),
    INDEX `idx_farmer_details_farmer_id` (`farmer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
