-- ============================================================================
-- CREAR USUARIO ADMIN - COPIAR Y PEGAR EN DBEAVER
-- ============================================================================

-- Agregar columna 'rol' si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Eliminar usuario admin si ya existe (para evitar duplicados)
DELETE FROM usuarios WHERE usuario = 'admin';

-- Crear usuario admin
-- Contraseña: admin123
INSERT INTO usuarios (usuario, email, password, nombre_completo, activo, rol) 
VALUES (
  'admin', 
  'admin@bustracksv.com', 
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Administrador Sistema', 
  true,
  'admin'
);

-- Verificar que se creó
SELECT usuario, email, rol, activo FROM usuarios WHERE usuario = 'admin';





