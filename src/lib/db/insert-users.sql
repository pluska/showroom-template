-- ============================================================================
-- Usuarios iniciales del panel — PLANTILLA, RELLENAR POR PROYECTO
-- ----------------------------------------------------------------------------
-- NUNCA commitear hashes de contraseñas reales. Este archivo va al repositorio;
-- una vez dentro, el hash queda en el historial para siempre aunque después se
-- borre. Si necesitas sembrar credenciales reales, hazlo con un archivo local
-- fuera del control de versiones:
--
--   1. Genera los hashes:      node scripts/hash-password.mjs 'la-contraseña'
--   2. Copia esta plantilla:   cp src/lib/db/insert-users.sql .users.local.sql
--      (.users.local.sql lo ignora .gitignore)
--   3. Rellena los valores y ejecútalo:
--      wrangler d1 execute PROJECT-db --local --file=./.users.local.sql
--
-- Roles disponibles: SUPER_ADMIN | ADMIN | SELLER
-- `admin_limit` es cuántos usuarios puede crear ese admin (0 = sin límite).
-- Los `id` son UUID v4: genera uno nuevo por usuario (`uuidgen`).
-- ============================================================================

-- 1. Super Admin
INSERT OR IGNORE INTO users (id, name, email, password, role, admin_limit, created_by, created_at, updated_at)
VALUES (
  '00000000-0000-4000-8000-000000000001', -- RELLENAR: uuidgen
  'RELLENAR Nombre',
  'RELLENAR@ejemplo.com',
  'RELLENAR-hash-bcrypt',                 -- node scripts/hash-password.mjs '...'
  'SUPER_ADMIN',
  0,
  NULL,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- 2. Admin del cliente (duplicar este bloque por cada admin)
INSERT OR IGNORE INTO users (id, name, email, password, role, admin_limit, created_by, created_at, updated_at)
VALUES (
  '00000000-0000-4000-8000-000000000002', -- RELLENAR: uuidgen
  'RELLENAR Nombre',
  'RELLENAR@ejemplo.com',
  'RELLENAR-hash-bcrypt',
  'ADMIN',
  5,
  '00000000-0000-4000-8000-000000000001', -- el id del Super Admin de arriba
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);
