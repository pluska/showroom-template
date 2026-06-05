CREATE TABLE `tours` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`thumbnail_url` text NOT NULL,
	`type` text DEFAULT 'building' NOT NULL,
	`target_url` text NOT NULL,
	`unit_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tours_unit_id_unique` ON `tours` (`unit_id`);