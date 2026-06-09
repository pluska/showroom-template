PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_brochures` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`type` text DEFAULT 'GENERAL' NOT NULL,
	`unit_id` text,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_brochures`("id", "title", "url", "type", "unit_id", "is_active", "created_at", "deleted_at") SELECT "id", "title", "url", "type", "unit_id", "is_active", "created_at", "deleted_at" FROM `brochures`;--> statement-breakpoint
DROP TABLE `brochures`;--> statement-breakpoint
ALTER TABLE `__new_brochures` RENAME TO `brochures`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `brochures_unit_id_unique` ON `brochures` (`unit_id`);