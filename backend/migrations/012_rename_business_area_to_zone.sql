
-- Migration: Rename business_area to zone
-- Created: 2026-02-04
-- Description: Renames business_area to zone in farmer_details and instructor_details tables

-- Update instructor_details table
ALTER TABLE `instructor_details` 
CHANGE COLUMN `business_area` `zone` VARCHAR(100) NULL;

-- Update farmer_details table
ALTER TABLE `farmer_details` 
CHANGE COLUMN `business_area` `zone` VARCHAR(100) NULL;

-- Recreate indexes if they were using the old column name
-- (Note: MySQL usually handles this, but explicitly renaming indexes is safer if they had the column name in them)
-- In our case, the index names were idx_farmer_location and idx_instructor_area.
-- They point to the column, so they should be fine after column rename.
