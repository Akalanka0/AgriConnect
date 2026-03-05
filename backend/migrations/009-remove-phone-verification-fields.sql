-- Remove phone verification related columns from users table
-- This migration removes all phone verification fields while keeping the phone number field

ALTER TABLE `users`
DROP COLUMN `phone_verified`,
DROP COLUMN `phone_verification_code`,
DROP COLUMN `phone_verification_code_expires`;
