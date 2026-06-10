CREATE TABLE `availabilities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`slot_duration` integer DEFAULT 30 NOT NULL,
	`meeting_type` text DEFAULT 'BOTH' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `calendar_transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`from_seller_id` text NOT NULL,
	`to_seller_id` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`from_seller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_seller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prospect_units` (
	`id` text PRIMARY KEY NOT NULL,
	`prospect_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`prospect_id`) REFERENCES `prospects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`address` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prospects_email_unique` ON `prospects` (`email`);--> statement-breakpoint
ALTER TABLE `appointments` ADD `prospect_address` text;--> statement-breakpoint
ALTER TABLE `appointments` ADD `prospect_id` text REFERENCES prospects(id);--> statement-breakpoint
ALTER TABLE `appointments` ADD `send_email` integer DEFAULT true NOT NULL;