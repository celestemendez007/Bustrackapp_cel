-- ============================================================================
-- CREAR USUARIO ADMINISTRADOR - EJECUTAR EN DBEAVER
-- Copia y pega esto en DBeaver, selecciónalo todo y presiona Alt+X
-- ============================================================================

-- Paso 1: Agregar columna 'rol' si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Paso 2: Eliminar usuario anterior si existe (para evitar duplicados)
DELETE FROM usuarios WHERE usuario = 'admin_celeste';

-- Paso 3: Crear usuario admin_celeste con hash de contraseña correcto
-- Contraseña: 123456
INSERT INTO usuarios (usuario, email, password, nombre_completo, activo, rol) 
VALUES (
  'admin_celeste', 
  'celeste.mendez007@gmail.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Celeste Mendez', 
  true,
  'admin'
);

-- Paso 4: Verificar que se creó correctamente
SELECT usuario, email, rol, activo FROM usuarios WHERE usuario = 'admin_celeste';



