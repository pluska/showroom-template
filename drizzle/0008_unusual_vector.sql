CREATE TABLE `gallery_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_image` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `locations_poi` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`image_path` text,
	`longitude` real NOT NULL,
	`latitude` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`deleted_at` integer
);
