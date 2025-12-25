-- ============================================================================
-- CORREGIR USUARIO ADMINISTRADOR
-- Ejecuta estos comandos en DBeaver para corregir tu usuario admin
-- ============================================================================

-- Paso 1: Agregar columna 'rol' si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Paso 2: Actualizar el usuario con contraseña hasheada y rol admin
-- NOTA: Este hash es para la contraseña '123456'
-- Si quieres usar otra contraseña, necesitas generarla con bcrypt primero

UPDATE usuarios 
SET 
    password = '$2b$10$8K1p/a0dL1J6PJvJ8YzZx.7VQq5j1Q3KQx9XJ2YzZx.7VQq5j1Q3K',
    rol = 'admin'
WHERE usuario = 'admin_celeste';

-- ============================================================================
-- ALTERNATIVA: Si prefieres usar el script Node.js (MÁS RECOMENDADO)
-- ============================================================================
-- El script create-admin-user.js genera el hash correctamente
-- Ejecútalo desde Render Shell o localmente con Node.js

