-- ============================================================================
-- SOLUCIÓN FINAL: Configurar usuario admin_celeste como administrador
-- Ejecuta esto en DBeaver
-- ============================================================================

-- Paso 1: Agregar columna 'rol' si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Paso 2: Actualizar admin_celeste para que sea administrador
UPDATE usuarios 
SET rol = 'admin'
WHERE usuario = 'admin_celeste';

-- Paso 3: Verificar que se actualizó correctamente
SELECT 
    id,
    usuario, 
    email, 
    rol, 
    activo,
    LEFT(password, 30) as password_preview
FROM usuarios 
WHERE usuario = 'admin_celeste';

-- Debe mostrar:
-- rol = 'admin'
-- activo = true
-- password_preview debe empezar con '$2b$10$' (hash bcrypt)

