-- Migration: Create generated_ids table
-- Created: 2026
-- Description: Store generated IDs for farmers and instructors

CREATE TABLE IF NOT EXISTS `generated_ids` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `type` ENUM('farmer', 'instructor') NOT NULL,
    `year` INT NOT NULL,
    `status` ENUM('active', 'used') DEFAULT 'active' NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_generated_ids_type_status` (`type`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
