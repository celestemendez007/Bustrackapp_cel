-- ============================================================================
-- VERIFICAR USUARIO EN BASE DE DATOS
-- Ejecuta estos comandos en DBeaver para diagnosticar
-- ============================================================================

-- 1. Ver todos los usuarios
SELECT id, usuario, email, rol, activo FROM usuarios;

-- 2. Buscar tu usuario específico (prueba variaciones)
SELECT * FROM usuarios WHERE usuario = 'admin_celeste';
SELECT * FROM usuarios WHERE usuario LIKE '%celeste%';
SELECT * FROM usuarios WHERE email = 'celeste.mendez007@gmail.com';

-- 3. Verificar que el password es un hash (debe empezar con $2b$10$)
SELECT usuario, 
       LEFT(password, 20) as password_preview,
       rol,
       activo
FROM usuarios 
WHERE usuario = 'admin_celeste';

-- 4. Si el password NO es un hash, necesitas actualizarlo
-- El password debe empezar con: $2b$10$

