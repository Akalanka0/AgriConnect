
-- Migration: Rename business_area to zone
-- Created: 2026-02-04
-- Description: Renames business_area to zone in farmer_details and instructor_details tables

-- Guarded rename for instructor_details: only if business_area exists
SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'instructor_details' 
      AND COLUMN_NAME = 'business_area'
);
SET @sql := IF(@col_exists = 1, 
    'ALTER TABLE `instructor_details` CHANGE COLUMN `business_area` `zone` VARCHAR(100) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Guarded rename for farmer_details: only if business_area exists
SET @col_exists2 := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'farmer_details' 
      AND COLUMN_NAME = 'business_area'
);
SET @sql2 := IF(@col_exists2 = 1, 
    'ALTER TABLE `farmer_details` CHANGE COLUMN `business_area` `zone` VARCHAR(100) NULL',
    'SELECT 1'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Recreate indexes if they were using the old column name
-- (Note: MySQL usually handles this, but explicitly renaming indexes is safer if they had the column name in them)
-- In our case, the index names were idx_farmer_location and idx_instructor_area.
-- They point to the column, so they should be fine after column rename.
