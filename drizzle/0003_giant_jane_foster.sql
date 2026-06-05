ALTER TABLE `media` ADD `category` text DEFAULT 'EXTRA' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `is_active` integer DEFAULT false NOT NULL;