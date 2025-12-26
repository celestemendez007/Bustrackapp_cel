-- ============================================================================
-- ARREGLAR USUARIO admin_celeste - EJECUTAR EN DBEAVER
-- ============================================================================

-- Paso 1: Agregar columna 'rol' si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Paso 2: Actualizar el usuario admin_celeste para que tenga rol 'admin'
UPDATE usuarios 
SET rol = 'admin'
WHERE usuario = 'admin_celeste';

-- Paso 3: Verificar que se actualizó correctamente
SELECT id, usuario, email, rol, activo, LEFT(password, 30) as password_preview
FROM usuarios 
WHERE usuario = 'admin_celeste';



