-- Add original_email field to users table (guarded)
-- Created: 2026-02-24
-- Description: Add original_email field for demo account support

-- Add original_email if it doesn't exist
SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'original_email'
);
SET @sql := IF(@col_exists = 0, 
    'ALTER TABLE `users` ADD COLUMN `original_email` VARCHAR(255) NULL COMMENT ''Original email for demo accounts (stores actual email before timestamp modification)''',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
