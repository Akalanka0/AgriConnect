-- Migration: Update pest_reports attachment fields to JSON type
-- Created: 2026-02-24
-- Description: Convert pest_reports attachment fields from TEXT to JSON for better data handling

-- Convert farmer_attachments from TEXT to JSON
ALTER TABLE `pest_reports` 
MODIFY COLUMN `farmer_attachments` JSON NULL DEFAULT (JSON_ARRAY());

-- Convert instructor_attachments from TEXT to JSON
ALTER TABLE `pest_reports` 
MODIFY COLUMN `instructor_attachments` JSON NULL DEFAULT (JSON_ARRAY());
