-- Migration: Create pests table
-- Created: 2026-02-24
-- Description: Core table for storing pest information

CREATE TABLE IF NOT EXISTS `pests` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `scientific_name` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `symptoms` TEXT NULL,
    `treatment` TEXT NULL,
    `prevention` TEXT NULL,
    `image_url` VARCHAR(500) NULL,
    `category` VARCHAR(100) NULL,
    `severity_level` ENUM('low', 'medium', 'high', 'severe') DEFAULT 'medium',
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX `idx_pests_name` (`name`),
    INDEX `idx_pests_category` (`category`),
    INDEX `idx_pests_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
