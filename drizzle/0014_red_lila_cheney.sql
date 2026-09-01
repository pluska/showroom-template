CREATE TABLE `image_generations` (
	`id` text PRIMARY KEY NOT NULL,
	`social_content_id` text,
	`engine` text NOT NULL,
	`created_by` text,
	`created_at` integer,
	FOREIGN KEY (`social_content_id`) REFERENCES `social_content`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
