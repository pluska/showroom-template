CREATE TABLE `canvas_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`aspect_ratio` text NOT NULL,
	`layout` text NOT NULL,
	`created_by` text,
	`created_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `social_content` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`platform` text NOT NULL,
	`template_type` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`aspect_ratio` text NOT NULL,
	`prompt` text,
	`result_url` text,
	`reference_urls` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_by` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `social_content_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`social_content_id` text NOT NULL,
	`sender` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`social_content_id`) REFERENCES `social_content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `meet_link` text;--> statement-breakpoint
ALTER TABLE `page_views` ADD `duration` integer DEFAULT 0;