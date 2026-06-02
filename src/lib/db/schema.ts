import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').default('SELLER').notNull(), // 'SUPER_ADMIN', 'ADMIN', 'SELLER'
  adminLimit: integer('admin_limit').default(0), 
  createdBy: text('created_by'), 
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text('seller_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // 'VIRTUAL', 'IN_PERSON'
  date: integer('date', { mode: 'timestamp' }).notNull(),
  prospectName: text('prospect_name').notNull(),
  prospectEmail: text('prospect_email'),
  prospectPhone: text('prospect_phone'),
  status: text('status').default('SCHEDULED').notNull(), // 'SCHEDULED', 'COMPLETED', 'CANCELLED'
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const floors = sqliteTable('floors', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  type: text('type').default('Piso').notNull(), // 'Planta Baja', 'Piso', 'Terraza', 'Sótano', 'Azotea'
  imagePath: text('image_path'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const units = sqliteTable('units', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  floorId: text('floor_id').references(() => floors.id).notNull(),
  identifier: text('identifier').notNull(),
  type: text('type'),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  areaSqm: integer('area_sqm'),
  coordinates: text('coordinates', { mode: 'json' }), 
  state: text('state').default('AVAILABLE').notNull(), // 'AVAILABLE', 'RESERVED', 'SOLD', 'COMMON_AREA'
  buyerName: text('buyer_name'), 
  gallery: text('gallery', { mode: 'json' }), 
  renders: text('renders', { mode: 'json' }), 
  photosFurnished: text('photos_furnished', { mode: 'json' }),
  photosUnfurnished: text('photos_unfurnished', { mode: 'json' }),
  photosPlans: text('photos_plans', { mode: 'json' }),
  photosBalcony: text('photos_balcony', { mode: 'json' }),
  tourUrl: text('tour_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const globalSettings = sqliteTable('global_settings', {
  id: text('id').primaryKey(), 
  config: text('config').notNull(), 
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const media = sqliteTable('media', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  url: text('url').notNull(),
  type: text('type'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const brochures = sqliteTable('brochures', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  url: text('url').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const constructionProgress = sqliteTable('construction_progress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  mediaUrl: text('media_url').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const logs = sqliteTable('logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE'
  entityType: text('entity_type').notNull(), // 'floor', 'unit'
  entityId: text('entity_id').notNull(),
  details: text('details'), // JSON string with details of the change
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
