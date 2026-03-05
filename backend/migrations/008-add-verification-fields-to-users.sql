-- Add verification fields to users table (guarded)
-- Created: 2026-02-24
-- Description: Add email and phone verification fields

-- Add email_verified if it doesn't exist
SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'email_verified'
);
SET @sql := IF(@col_exists = 0, 
    'ALTER TABLE `users` ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT FALSE',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add phone_verified if it doesn't exist
SET @col_exists2 := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'phone_verified'
);
SET @sql2 := IF(@col_exists2 = 0, 
    'ALTER TABLE `users` ADD COLUMN `phone_verified` BOOLEAN NOT NULL DEFAULT FALSE',
    'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Add verification_token if it doesn't exist
SET @col_exists3 := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'verification_token'
);
SET @sql3 := IF(@col_exists3 = 0, 
    'ALTER TABLE `users` ADD COLUMN `verification_token` VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Add verification_token_expires if it doesn't exist
SET @col_exists4 := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'verification_token_expires'
);
SET @sql4 := IF(@col_exists4 = 0, 
    'ALTER TABLE `users` ADD COLUMN `verification_token_expires` TIMESTAMP NULL',
    'SELECT 1'
);
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Add phone_verification_code if it doesn't exist
SET @col_exists5 := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'phone_verification_code'
);
SET @sql5 := IF(@col_exists5 = 0, 
    'ALTER TABLE `users` ADD COLUMN `phone_verification_code` VARCHAR(10) NULL',
    'SELECT 1'
);
PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- Add phone_verification_code_expires if it doesn't exist
SET @col_exists6 := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'phone_verification_code_expires'
);
SET @sql6 := IF(@col_exists6 = 0, 
    'ALTER TABLE `users` ADD COLUMN `phone_verification_code_expires` TIMESTAMP NULL',
    'SELECT 1'
);
PREPARE stmt6 FROM @sql6;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;
