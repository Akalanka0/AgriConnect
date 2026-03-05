ALTER TABLE `farmer_details`
DROP FOREIGN KEY `farmer_details_ibfk_1`;

ALTER TABLE `farmer_details`
MODIFY COLUMN `user_id` INT NULL;

ALTER TABLE `farmer_details`
ADD CONSTRAINT `fk_farmer_details_user_id`
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;
