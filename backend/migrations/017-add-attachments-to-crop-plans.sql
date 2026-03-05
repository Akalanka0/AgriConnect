-- Migration to add attachments and review timestamp to crop_plans table (guarded)

-- Check table exists
SET @tbl_exists := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'crop_plans'
);

-- Add farmer_attachments if table/column missing
SET @col_fa := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'crop_plans' AND COLUMN_NAME = 'farmer_attachments'
);
SET @sql_fa := IF(@tbl_exists = 1 AND @col_fa = 0, 
  'ALTER TABLE `crop_plans` ADD COLUMN `farmer_attachments` JSON DEFAULT NULL', 
  'SELECT 1'
);
PREPARE stmt_fa FROM @sql_fa; EXECUTE stmt_fa; DEALLOCATE PREPARE stmt_fa;

-- Add instructor_attachments if missing
SET @col_ia := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'crop_plans' AND COLUMN_NAME = 'instructor_attachments'
);
SET @sql_ia := IF(@tbl_exists = 1 AND @col_ia = 0, 
  'ALTER TABLE `crop_plans` ADD COLUMN `instructor_attachments` JSON DEFAULT NULL', 
  'SELECT 1'
);
PREPARE stmt_ia FROM @sql_ia; EXECUTE stmt_ia; DEALLOCATE PREPARE stmt_ia;

-- Add reviewed_at if missing
SET @col_ra := (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'crop_plans' AND COLUMN_NAME = 'reviewed_at'
);
SET @sql_ra := IF(@tbl_exists = 1 AND @col_ra = 0, 
  'ALTER TABLE `crop_plans` ADD COLUMN `reviewed_at` DATETIME DEFAULT NULL', 
  'SELECT 1'
);
PREPARE stmt_ra FROM @sql_ra; EXECUTE stmt_ra; DEALLOCATE PREPARE stmt_ra;
