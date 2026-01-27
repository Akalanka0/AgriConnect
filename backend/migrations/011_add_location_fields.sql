
-- Migration: Add location and division fields to farmer and instructor details
-- Created: 2026-01-26
-- Description: Adds district, business_area, and division fields to support admin dashboard

-- Update farmer_details table
ALTER TABLE `farmer_details`
ADD COLUMN `district` VARCHAR(50) NULL,
ADD COLUMN `business_area` VARCHAR(100) NULL,
ADD COLUMN `instructor_division` VARCHAR(100) NULL;

-- Update instructor_details table
ALTER TABLE `instructor_details`
ADD COLUMN `district` VARCHAR(50) NULL,
ADD COLUMN `business_area` VARCHAR(100) NULL,
ADD COLUMN `assigned_divisions` JSON NULL;

-- Create indexes for performance on new fields
CREATE INDEX `idx_farmer_location` ON `farmer_details` (`business_area`);
CREATE INDEX `idx_instructor_area` ON `instructor_details` (`business_area`);
