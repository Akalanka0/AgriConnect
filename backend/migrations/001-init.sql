-- ============================================================
-- AgriConnect Clean Schema — 001-init.sql
-- District: Anuradhapura only (single-district system)
-- MySQL 8.0+ required (JSON_ARRAY() default expression)
-- ============================================================

-- 1. users
CREATE TABLE `users` (
    `id`                         INT             NOT NULL AUTO_INCREMENT,
    `full_name`                  VARCHAR(255)    NOT NULL,
    `email`                      VARCHAR(255)    NOT NULL,
    `password`                   VARCHAR(255)    NOT NULL,
    `role`                       ENUM('admin','Super Admin','farmer','instructor') NOT NULL,
    `nic`                        VARCHAR(20)     NOT NULL,
    `phone`                      VARCHAR(20)     NOT NULL,
    `status`                     ENUM('active','blocked','suspended') NOT NULL DEFAULT 'active',
    `profile_picture`            VARCHAR(500)    DEFAULT NULL,
    `email_verified`             TINYINT(1)      NOT NULL DEFAULT 0,
    `verification_token`         VARCHAR(255)    DEFAULT NULL,
    `verification_token_expires` DATETIME        DEFAULT NULL,
    `original_email`             VARCHAR(255)    DEFAULT NULL,
    `created_at`                 TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    `updated_at`                 TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`),
    UNIQUE KEY `uq_users_nic`   (`nic`),
    INDEX `idx_users_role`   (`role`),
    INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. farmer_details
CREATE TABLE `farmer_details` (
    `id`                  INT          NOT NULL AUTO_INCREMENT,
    `user_id`             INT          DEFAULT NULL,
    `farmer_id`           VARCHAR(50)  NOT NULL,
    `district`            VARCHAR(50)  NOT NULL DEFAULT 'Anuradhapura',
    `locations`           JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `created_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_farmer_user_id`  (`user_id`),
    UNIQUE KEY `uq_farmer_id`       (`farmer_id`),
    CONSTRAINT `fk_farmer_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. instructor_details
CREATE TABLE `instructor_details` (
    `id`                 INT          NOT NULL AUTO_INCREMENT,
    `user_id`            INT          DEFAULT NULL,
    `instructor_id`      VARCHAR(50)  NOT NULL,
    `district`           VARCHAR(50)  NOT NULL DEFAULT 'Anuradhapura',
    `zone`               VARCHAR(100) DEFAULT NULL,
    `assigned_divisions` JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `specialization`     VARCHAR(255) DEFAULT NULL,
    `experience`         INT          DEFAULT 0,
    `qualifications`     TEXT         DEFAULT NULL,
    `average_rating`     FLOAT        DEFAULT 0.0,
    `created_at`         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_instructor_user_id` (`user_id`),
    UNIQUE KEY `uq_instructor_id`      (`instructor_id`),
    INDEX `idx_instructor_zone`        (`zone`),
    CONSTRAINT `fk_instructor_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. generated_ids
CREATE TABLE `generated_ids` (
    `id`         INT         NOT NULL AUTO_INCREMENT,
    `code`       VARCHAR(50) NOT NULL,
    `type`       ENUM('farmer','instructor') NOT NULL,
    `year`       INT         NOT NULL,
    `status`     ENUM('active','used') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_code` (`code`),
    INDEX `idx_type_status` (`type`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. system_settings
CREATE TABLE `system_settings` (
    `id`            INT          NOT NULL AUTO_INCREMENT,
    `setting_key`   VARCHAR(100) NOT NULL,
    `setting_value` TEXT         DEFAULT NULL,
    `description`   TEXT         DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
  ('maintenance_mode', 'false', 'Set to true to enable maintenance mode.');

-- 6. crops
CREATE TABLE `crops` (
    `id`              INT          NOT NULL AUTO_INCREMENT,
    `name`            VARCHAR(255) NOT NULL,
    `image_url`       VARCHAR(500) DEFAULT NULL,
    `image_public_id` VARCHAR(255) DEFAULT NULL,
    `is_active`       TINYINT(1)   DEFAULT 1,
    `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_crop_name` (`name`),
    INDEX `idx_crops_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. activities
CREATE TABLE `activities` (
    `id`                  INT          NOT NULL AUTO_INCREMENT,
    `user_id`             INT          NOT NULL,
    `type`                ENUM('planting','irrigation','fertilizing','pest_control','harvesting','other') NOT NULL,
    `crop`                VARCHAR(100) NOT NULL,
    `date`                DATE         NOT NULL,
    `notes`               TEXT         DEFAULT NULL,
    `location`            VARCHAR(255) DEFAULT NULL,
    `instructor_division` VARCHAR(255) DEFAULT NULL,
    `created_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_activities_user_id` (`user_id`),
    INDEX `idx_activities_date`    (`date`),
    CONSTRAINT `fk_activities_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. harvest_records
CREATE TABLE `harvest_records` (
    `id`                  INT          NOT NULL AUTO_INCREMENT,
    `user_id`             INT          NOT NULL,
    `crop`                VARCHAR(100) NOT NULL,
    `location`            VARCHAR(255) NOT NULL,
    `date`                DATE         NOT NULL,
    `quantity`            VARCHAR(100) NOT NULL,
    `quality`             VARCHAR(100) DEFAULT NULL,
    `notes`               TEXT         DEFAULT NULL,
    `instructor_division` VARCHAR(255) DEFAULT NULL,
    `created_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_harvest_records_user_id` (`user_id`),
    INDEX `idx_harvest_records_date`    (`date`),
    CONSTRAINT `fk_harvest_records_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. crop_plans
CREATE TABLE `crop_plans` (
    `id`                     INT          NOT NULL AUTO_INCREMENT,
    `user_id`                INT          NOT NULL,
    `crop_name`              VARCHAR(100) NOT NULL,
    `field_location`         VARCHAR(255) NOT NULL,
    `plant_date`             DATE         NOT NULL,
    `harvest_date`           DATE         NOT NULL,
    `notes`                  TEXT         DEFAULT NULL,
    `instructor_feedback`    TEXT         DEFAULT NULL,
    `status`                 ENUM('pending','approved','rejected','correction') NOT NULL DEFAULT 'pending',
    `instructor_id`          INT          DEFAULT NULL,
    `instructor_division`    VARCHAR(255) DEFAULT NULL,
    `farmer_attachments`          JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `instructor_attachments`      JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `farmer_attachment_names`     JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `instructor_attachment_names` JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `reviewed_at`            DATETIME     DEFAULT NULL,
    `created_at`             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_crop_plans_user_id`       (`user_id`),
    INDEX `idx_crop_plans_status`        (`status`),
    INDEX `idx_crop_plans_instructor_id` (`instructor_id`),
    CONSTRAINT `fk_crop_plans_user`       FOREIGN KEY (`user_id`)       REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_crop_plans_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. pest_reports
CREATE TABLE `pest_reports` (
    `id`                     INT          NOT NULL AUTO_INCREMENT,
    `user_id`                INT          NOT NULL,
    `type`                   ENUM('pest','disease','other') NOT NULL,
    `name`                   VARCHAR(255) NOT NULL,
    `crop`                   VARCHAR(255) NOT NULL,
    `severity`               ENUM('low','medium','high') NOT NULL,
    `notes`                  TEXT         DEFAULT NULL,
    `resolution`             TEXT         DEFAULT NULL,
    `instructor_division`    VARCHAR(255) DEFAULT NULL,
    `instructor_id`          INT          DEFAULT NULL,
    `status`                 ENUM('pending','in_progress','resolved') NOT NULL DEFAULT 'pending',
    `farmer_attachments`          JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `instructor_attachments`      JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `farmer_attachment_names`     JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `instructor_attachment_names` JSON         NOT NULL DEFAULT (JSON_ARRAY()),
    `created_at`             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_pest_reports_user_id`       (`user_id`),
    INDEX `idx_pest_reports_status`        (`status`),
    INDEX `idx_pest_reports_instructor_id` (`instructor_id`),
    CONSTRAINT `fk_pest_reports_user`       FOREIGN KEY (`user_id`)       REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pest_reports_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. meetings
CREATE TABLE `meetings` (
    `id`               INT          NOT NULL AUTO_INCREMENT,
    `meeting_title`    VARCHAR(255) NOT NULL,
    `meeting_date`     DATE         NOT NULL,
    `meeting_time`     VARCHAR(20)  NOT NULL,
    `meeting_duration` VARCHAR(20)  DEFAULT '30',
    `meeting_notes`    TEXT         DEFAULT NULL,
    `instructor_note`  TEXT         DEFAULT NULL,
    `status`           ENUM('pending','accepted','rejected','declined','reschedule','cancelled') DEFAULT 'pending',
    `requested_by`     ENUM('farmer','instructor') NOT NULL,
    `farmer_id`        INT          NOT NULL,
    `instructor_id`    INT          DEFAULT NULL,
    `division`         VARCHAR(100) DEFAULT NULL,
    `suggested_date`   DATE         DEFAULT NULL,
    `suggested_time`   VARCHAR(20)  DEFAULT NULL,
    `zoom_link`        VARCHAR(255) DEFAULT NULL,
    `cancel_reason`    TEXT         DEFAULT NULL,
    `created_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_meetings_farmer_id`     (`farmer_id`),
    INDEX `idx_meetings_instructor_id` (`instructor_id`),
    INDEX `idx_meetings_status`        (`status`),
    CONSTRAINT `fk_meetings_farmer`     FOREIGN KEY (`farmer_id`)     REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_meetings_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. messages
CREATE TABLE `messages` (
    `id`                   INT          NOT NULL AUTO_INCREMENT,
    `subject`              VARCHAR(255) NOT NULL,
    `content`              TEXT         NOT NULL,
    `recipient_type`       ENUM('all','farmers','instructors','select','admin') NOT NULL,
    `recipient_id`         INT          DEFAULT NULL,
    `sender_id`            INT          NOT NULL,
    `attachment_url`       VARCHAR(255) DEFAULT NULL,
    `attachment_public_id` VARCHAR(100) DEFAULT NULL,
    `attachment_name`      VARCHAR(255) DEFAULT NULL,
    `message_type`         ENUM('text','file') NOT NULL DEFAULT 'text',
    `is_read`              TINYINT(1)   DEFAULT 0,
    `read_at`              DATETIME     DEFAULT NULL,
    `created_at`           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_messages_recipient_type` (`recipient_type`),
    INDEX `idx_messages_recipient_id`   (`recipient_id`),
    INDEX `idx_messages_sender_id`      (`sender_id`),
    INDEX `idx_messages_created_at`     (`created_at`),
    INDEX `idx_messages_is_read`        (`is_read`),
    CONSTRAINT `fk_messages_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_sender`    FOREIGN KEY (`sender_id`)    REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. instructor_ratings
CREATE TABLE `instructor_ratings` (
    `id`            INT         NOT NULL AUTO_INCREMENT,
    `instructor_id` VARCHAR(50) NOT NULL,
    `farmer_id`     VARCHAR(50) NOT NULL,
    `farmer_name`   VARCHAR(255)         DEFAULT NULL,
    `rating`        INT         NOT NULL,
    `comments`      TEXT        DEFAULT NULL,
    `status`        ENUM('pending','approved','rejected') DEFAULT 'approved',
    `created_at`    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_farmer_instructor`  (`farmer_id`, `instructor_id`),
    INDEX `idx_ratings_instructor`     (`instructor_id`),
    INDEX `idx_ratings_farmer`         (`farmer_id`),
    INDEX `idx_ratings_status`         (`status`),
    CONSTRAINT `chk_rating_range`      CHECK (`rating` >= 1 AND `rating` <= 5),
    CONSTRAINT `fk_ratings_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `instructor_details`(`instructor_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ratings_farmer`     FOREIGN KEY (`farmer_id`)     REFERENCES `farmer_details`(`farmer_id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. regions (canonical Anuradhapura hierarchy reference)
CREATE TABLE `regions` (
    `id`       INT          NOT NULL AUTO_INCREMENT,
    `district` VARCHAR(100) NOT NULL,
    `zone`     VARCHAR(100) NOT NULL,
    `division` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_region`           (`district`, `zone`, `division`),
    INDEX `idx_regions_zone`         (`zone`),
    INDEX `idx_regions_district`     (`district`),
    INDEX `idx_regions_division`     (`division`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10 DS Divisions of Anuradhapura district
INSERT INTO `regions` (`district`, `zone`, `division`) VALUES
  ('Anuradhapura', 'Anuradhapura town',  'Anuradhapura town'),
  ('Anuradhapura', 'Thalawa',            'Thalawa'),
  ('Anuradhapura', 'Tambuttegama',       'Tambuttegama'),
  ('Anuradhapura', 'Medawachchiya',      'Medawachchiya'),
  ('Anuradhapura', 'Eppawala',           'Eppawala'),
  ('Anuradhapura', 'Kekirawa',           'Kekirawa'),
  ('Anuradhapura', 'Mihintale',          'Mihintale'),
  ('Anuradhapura', 'Galenbindunuwewa',   'Galenbindunuwewa'),
  ('Anuradhapura', 'Padaviya',           'Padaviya'),
  ('Anuradhapura', 'Nochchiyagama',      'Nochchiyagama');

-- 17. migrations (internal — tracks which SQL files have been applied)
CREATE TABLE IF NOT EXISTS `migrations` (
    `id`         INT          NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
