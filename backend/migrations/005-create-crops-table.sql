-- Migration: Create crops table
-- Created: 2026-02-24
-- Description: Core table for storing crop information

CREATE TABLE IF NOT EXISTS `crops` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `scientific_name` VARCHAR(255) NULL,
    `variety` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `growing_season` VARCHAR(100) NULL,
    `harvest_time` INT NULL COMMENT 'Days to harvest',
    `water_requirements` TEXT NULL,
    `soil_type` VARCHAR(100) NULL,
    `climate_preference` VARCHAR(100) NULL,
    `image_url` VARCHAR(500) NULL,
    `category` VARCHAR(100) NULL,
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX `idx_crops_name` (`name`),
    INDEX `idx_crops_category` (`category`),
    INDEX `idx_crops_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
