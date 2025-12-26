-- ============================================================================
-- CREAR USUARIO ADMINISTRADOR COMPLETO
-- Ejecuta este SQL en DBeaver para crear/actualizar el usuario admin
-- ============================================================================

-- Paso 1: Verificar si el usuario existe
SELECT * FROM usuarios WHERE usuario = 'admin_celeste';

-- Paso 2: Agregar columna 'rol' si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Paso 3: Si el usuario NO existe, créalo completo
INSERT INTO usuarios (usuario, email, password, nombre_completo, activo, rol) 
VALUES (
  'admin_celeste', 
  'celeste.mendez007@gmail.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- Hash de '123456'
  'Celeste Mendez', 
  true,
  'admin'
)
ON CONFLICT (usuario) DO UPDATE
SET 
    password = EXCLUDED.password,
    rol = 'admin',
    activo = true;

-- Paso 4: Verificar que se creó correctamente
SELECT usuario, email, rol, activo FROM usuarios WHERE usuario = 'admin_celeste';




