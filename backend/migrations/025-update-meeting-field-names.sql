-- Migration: Update meeting table field names for consistency
-- Created: 2026-02-24
-- Description: Rename meeting table fields to use snake_case convention

-- Rename meetingTitle to meeting_title
ALTER TABLE `meetings` 
CHANGE COLUMN `meetingTitle` `meeting_title` VARCHAR(255) NOT NULL;

-- Rename meetingDate to meeting_date
ALTER TABLE `meetings` 
CHANGE COLUMN `meetingDate` `meeting_date` DATE NOT NULL;

-- Rename meetingTime to meeting_time
ALTER TABLE `meetings` 
CHANGE COLUMN `meetingTime` `meeting_time` VARCHAR(20) NOT NULL;

-- Rename meetingDuration to meeting_duration
ALTER TABLE `meetings` 
CHANGE COLUMN `meetingDuration` `meeting_duration` VARCHAR(20) DEFAULT '30';

-- Rename meetingNotes to meeting_notes
ALTER TABLE `meetings` 
CHANGE COLUMN `meetingNotes` `meeting_notes` TEXT NULL;

-- Rename instructorNote to instructor_note
ALTER TABLE `meetings` 
CHANGE COLUMN `instructorNote` `instructor_note` TEXT NULL;

-- Rename requestedBy to requested_by
ALTER TABLE `meetings` 
CHANGE COLUMN `requestedBy` `requested_by` ENUM('farmer', 'instructor') NOT NULL;

-- Rename suggestedDate to suggested_date
ALTER TABLE `meetings` 
CHANGE COLUMN `suggestedDate` `suggested_date` DATE NULL;

-- Rename suggestedTime to suggested_time
ALTER TABLE `meetings` 
CHANGE COLUMN `suggestedTime` `suggested_time` VARCHAR(20) NULL;

-- Rename zoomLink to zoom_link
ALTER TABLE `meetings` 
CHANGE COLUMN `zoomLink` `zoom_link` VARCHAR(255) NULL;

-- Rename cancelReason to cancel_reason
ALTER TABLE `meetings` 
CHANGE COLUMN `cancelReason` `cancel_reason` TEXT NULL;
