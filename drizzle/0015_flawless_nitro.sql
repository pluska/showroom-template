PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_units` (
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
	`photos_furnished` text,
	`photos_unfurnished` text,
	`photos_plans` text,
	`photos_balcony` text,
	`tour_url` text,
	`created_at` integer,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_units`("id", "floor_id", "identifier", "type", "bedrooms", "bathrooms", "area_sqm", "coordinates", "state", "buyer_name", "gallery", "renders", "photos_furnished", "photos_unfurnished", "photos_plans", "photos_balcony", "tour_url", "created_at", "updated_at", "deleted_at") SELECT "id", "floor_id", "identifier", "type", "bedrooms", "bathrooms", "area_sqm", "coordinates", "state", "buyer_name", "gallery", "renders", "photos_furnished", "photos_unfurnished", "photos_plans", "photos_balcony", "tour_url", "created_at", "updated_at", "deleted_at" FROM `units`;--> statement-breakpoint
DROP TABLE `units`;--> statement-breakpoint
ALTER TABLE `__new_units` RENAME TO `units`;--> statement-breakpoint
PRAGMA foreign_keys=ON;