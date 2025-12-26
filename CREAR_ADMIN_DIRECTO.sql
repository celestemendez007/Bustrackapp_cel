-- ============================================================================
-- CREAR USUARIO ADMINISTRADOR - EJECUTAR EN DBEAVER
-- Copia y pega esto en DBeaver, selecciónalo todo y presiona Alt+X
-- ============================================================================

-- Paso 1: Agregar columna 'rol' si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Paso 2: Eliminar usuario anterior si existe (por si acaso)
DELETE FROM usuarios WHERE usuario = 'admin';

-- Paso 3: Crear usuario admin con hash de contraseña correcto
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

-- Paso 4: Verificar que se creó
SELECT usuario, email, rol, activo FROM usuarios WHERE usuario = 'admin';



