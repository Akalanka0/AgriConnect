-- Migration: Remove redundant profile_picture field from users table
-- Created: 2026-02-24
-- Description: Remove duplicate profile_picture field, keep only avatar field

-- Drop the redundant profile_picture column
ALTER TABLE `users` 
DROP COLUMN `profile_picture`;
