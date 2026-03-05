-- Migration: Create system_settings table
-- Created: 2026-02-05
-- Description: Store system-wide configurations like maintenance mode

CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT,
    `description` TEXT,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial maintenance mode setting
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) 
VALUES ('maintenance_mode', 'false', 'Enable/Disable system maintenance mode. When enabled, only admins can access the system.')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
