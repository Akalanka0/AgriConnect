-- Add original filename tracking to crop_plans and pest_reports
-- These parallel arrays store the original upload filenames matching each URL in *_attachments arrays

ALTER TABLE crop_plans
    ADD COLUMN farmer_attachment_names JSON NULL DEFAULT NULL AFTER farmer_attachments,
    ADD COLUMN instructor_attachment_names JSON NULL DEFAULT NULL AFTER instructor_attachments;

ALTER TABLE pest_reports
    ADD COLUMN farmer_attachment_names JSON NULL DEFAULT NULL AFTER farmer_attachments,
    ADD COLUMN instructor_attachment_names JSON NULL DEFAULT NULL AFTER instructor_attachments;
