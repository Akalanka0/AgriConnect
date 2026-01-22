ALTER TABLE `users`
ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN `phone_verified` BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN `verification_token` VARCHAR(255) NULL,
ADD COLUMN `verification_token_expires` TIMESTAMP NULL,
ADD COLUMN `phone_verification_code` VARCHAR(10) NULL,
ADD COLUMN `phone_verification_code_expires` TIMESTAMP NULL;
