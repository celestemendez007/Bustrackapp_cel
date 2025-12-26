-- ============================================================================
-- VERIFICACIÓN COMPLETA - Ejecuta esto en DBeaver
-- ============================================================================

-- 1. Verificar que el usuario existe
SELECT 
    id,
    usuario, 
    email, 
    rol, 
    activo,
    LEFT(password, 30) as password_preview,
    LENGTH(password) as password_length
FROM usuarios 
WHERE usuario = 'admin';

-- 2. Verificar que el password es un hash bcrypt (debe empezar con $2b$10$)
-- Si password_preview NO empieza con '$2b$10$', entonces el hash está mal

-- 3. Ver todos los usuarios (por si hay duplicados)
SELECT usuario, email, rol, activo FROM usuarios ORDER BY usuario;

-- 4. Si el usuario NO existe o el password está mal, ejecuta esto:

-- Primero, eliminar usuario si existe
DELETE FROM usuarios WHERE usuario = 'admin';

-- Crear usuario correctamente
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

INSERT INTO usuarios (usuario, email, password, nombre_completo, activo, rol) 
VALUES (
  'admin', 
  'admin@bustracksv.com', 
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Administrador Sistema', 
  true,
  'admin'
);

-- Verificar de nuevo
SELECT usuario, email, rol, activo, LEFT(password, 30) as password_preview 
FROM usuarios WHERE usuario = 'admin';




