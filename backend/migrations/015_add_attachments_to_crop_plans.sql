-- Migration to add attachments and review timestamp to crop_plans table
ALTER TABLE `crop_plans` ADD COLUMN `farmer_attachments` JSON DEFAULT NULL;
ALTER TABLE `crop_plans` ADD COLUMN `instructor_attachments` JSON DEFAULT NULL;
ALTER TABLE `crop_plans` ADD COLUMN `reviewed_at` DATETIME DEFAULT NULL;
