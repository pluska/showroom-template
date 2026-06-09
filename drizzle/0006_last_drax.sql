ALTER TABLE `brochures` ADD `type` text DEFAULT 'GENERAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `brochures` ADD `unit_id` text REFERENCES units(id);--> statement-breakpoint
CREATE UNIQUE INDEX `brochures_unit_id_unique` ON `brochures` (`unit_id`);