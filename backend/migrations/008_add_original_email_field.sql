-- Add original_email field to users table for demo account support
-- This field stores the original email address for demo accounts
-- when we append timestamps to make them unique in the database

ALTER TABLE `users`
ADD COLUMN `original_email` VARCHAR(255) NULL COMMENT 'Original email for demo accounts (stores actual email before timestamp modification)' AFTER `verification_token_expires`;
