-- Seed file for showroom-db

-- Insert a Super Admin
INSERT INTO users (id, name, email, password, role, created_at, updated_at) 
VALUES ('user_1', 'Super Admin', 'admin@showroom.com', '$2a$10$YourHashedPasswordHere', 'SUPER_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert a Seller
INSERT INTO users (id, name, email, password, role, created_at, updated_at) 
VALUES ('user_2', 'Vendedor Test', 'seller@showroom.com', '$2a$10$YourHashedPasswordHere', 'SELLER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert a Floor
INSERT INTO floors (id, name, level, created_at, updated_at)
VALUES ('floor_1', 'Planta Baja', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert some Units
INSERT INTO units (id, floor_id, identifier, type, bedrooms, bathrooms, area_sqm, state, created_at, updated_at)
VALUES ('unit_101', 'floor_1', '101', 'DEPARTAMENTO', 2, 2, 85, 'AVAILABLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO units (id, floor_id, identifier, type, bedrooms, bathrooms, area_sqm, state, created_at, updated_at)
VALUES ('unit_102', 'floor_1', '102', 'DEPARTAMENTO', 3, 2, 110, 'RESERVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert an Appointment
INSERT INTO appointments (id, seller_id, type, date, prospect_name, status, created_at, updated_at)
VALUES ('appt_1', 'user_2', 'IN_PERSON', CURRENT_TIMESTAMP, 'Cliente Interesado', 'SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
