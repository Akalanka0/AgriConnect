-- Migration: Create harvests table
-- Created: 2026-02-24
-- Description: Core table for storing harvest information

CREATE TABLE IF NOT EXISTS `harvests` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `crop_name` VARCHAR(255) NOT NULL,
    `variety` VARCHAR(255) NULL,
    `quantity` DECIMAL(10,2) NULL,
    `unit` VARCHAR(50) NULL COMMENT 'kg, tons, etc',
    `quality_grade` VARCHAR(50) NULL,
    `harvest_date` DATE NULL,
    `storage_method` VARCHAR(100) NULL,
    `market_price` DECIMAL(10,2) NULL,
    `notes` TEXT NULL,
    `image_url` VARCHAR(500) NULL,
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX `idx_harvests_crop_name` (`crop_name`),
    INDEX `idx_harvests_date` (`harvest_date`),
    INDEX `idx_harvests_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
