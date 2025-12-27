-- ============================================================================
-- VERIFICAR EL CAMPO 'usuario' (IMPORTANTE PARA LOGIN)
-- ============================================================================

-- El login busca por el campo 'usuario', NO por email
-- Verifica que el campo 'usuario' tenga el valor correcto

SELECT 
    id,
    usuario,  -- ← ESTE es el campo que usa el login
    email, 
    rol, 
    activo
FROM usuarios 
WHERE email = 'celeste.mendez007@gmail.com';

-- Si el campo 'usuario' está vacío o es NULL, actualízalo:

UPDATE usuarios 
SET usuario = 'admin_celeste'
WHERE email = 'celeste.mendez007@gmail.com' 
  AND (usuario IS NULL OR usuario = '');

-- Verificar de nuevo
SELECT usuario, email, rol, activo 
FROM usuarios 
WHERE usuario = 'admin_celeste';





