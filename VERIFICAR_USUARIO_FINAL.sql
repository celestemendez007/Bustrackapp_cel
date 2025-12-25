-- ============================================================================
-- VERIFICACIÓN FINAL DEL USUARIO
-- Ejecuta esto en DBeaver para verificar que todo esté correcto
-- ============================================================================

-- 1. Ver el usuario completo
SELECT 
    id,
    usuario, 
    email, 
    rol, 
    activo,
    LEFT(password, 30) as password_preview,
    CASE 
        WHEN password LIKE '$2b$10$%' THEN '✅ Hash correcto'
        ELSE '❌ Hash incorrecto o texto plano'
    END as estado_password
FROM usuarios 
WHERE usuario = 'admin_celeste';

-- 2. Si el usuario NO existe o el rol está mal, ejecuta esto:

-- Agregar columna rol si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Actualizar o crear el usuario
INSERT INTO usuarios (usuario, email, password, nombre_completo, activo, rol) 
VALUES (
  'admin_celeste', 
  'celeste.mendez007@gmail.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Celeste Mendez', 
  true,
  'admin'
)
ON CONFLICT (usuario) DO UPDATE
SET 
    rol = 'admin',
    activo = true,
    password = EXCLUDED.password;

-- 3. Verificar de nuevo
SELECT usuario, email, rol, activo FROM usuarios WHERE usuario = 'admin_celeste';

