CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`user_name` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`details` text,
	`created_at` integer
);
--> statement-breakpoint
ALTER TABLE `floors` ADD `type` text DEFAULT 'Piso' NOT NULL;--> statement-breakpoint
ALTER TABLE `units` ADD `photos_furnished` text;--> statement-breakpoint
ALTER TABLE `units` ADD `photos_unfurnished` text;--> statement-breakpoint
ALTER TABLE `units` ADD `photos_plans` text;--> statement-breakpoint
ALTER TABLE `units` ADD `photos_balcony` text;--> statement-breakpoint
ALTER TABLE `units` ADD `tour_url` text;