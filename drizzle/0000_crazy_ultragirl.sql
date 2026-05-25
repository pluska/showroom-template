CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`seller_id` text NOT NULL,
	`type` text NOT NULL,
	`date` integer NOT NULL,
	`prospect_name` text NOT NULL,
	`prospect_email` text,
	`prospect_phone` text,
	`status` text DEFAULT 'SCHEDULED' NOT NULL,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `brochures` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `construction_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` integer NOT NULL,
	`media_url` text NOT NULL,
	`description` text,
	`created_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `floors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`image_path` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `global_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`type` text,
	`created_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_id` text NOT NULL,
	`identifier` text NOT NULL,
	`type` text,
	`bedrooms` integer,
	`bathrooms` integer,
	`area_sqm` integer,
	`coordinates` text,
	`state` text DEFAULT 'AVAILABLE' NOT NULL,
	`buyer_name` text,
	`gallery` text,
	`renders` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`floor_id`) REFERENCES `floors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'SELLER' NOT NULL,
	`admin_limit` integer DEFAULT 0,
	`created_by` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);