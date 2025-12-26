# 🔧 Solución Rápida: Corregir Usuario Admin

## Problema
Creaste el usuario pero:
1. La contraseña está en texto plano (debe ser hash bcrypt)
2. Falta la columna `rol` (necesaria para que sea admin)

## Solución: 2 Opciones

### Opción 1: Usar Script Node.js (MÁS FÁCIL) ⭐

1. **Desde Render Shell:**
   - Ve a tu servicio `bustracksv-backend` en Render
   - Click en **"Shell"**
   - Ejecuta:
     ```bash
     node fix-admin-user.js
     ```
   
   Si no encuentra el archivo, ajusta la ruta:
   ```bash
     cd server
     node fix-admin-user.js
   ```

2. **Desde tu computadora (si tienes acceso):**
   ```powershell
   cd bustracksv/server
   node fix-admin-user.js
   ```

---

### Opción 2: SQL Directo en DBeaver

Ejecuta estos comandos **en orden** en DBeaver:

```sql
-- Paso 1: Agregar columna 'rol' si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Paso 2: Actualizar usuario con hash de contraseña y rol admin
-- NOTA: Este hash es para la contraseña '123456'
UPDATE usuarios 
SET 
    password = '$2b$10$VqJXZ8X8X8X8X8X8X8X8.uX8X8X8X8X8X8X8X8X8X8X8X8X8X',
    rol = 'admin'
WHERE usuario = 'admin_celeste';
```

**⚠️ Problema:** El hash de arriba es solo un ejemplo. Necesitas generar el hash real con bcrypt.

**Para generar el hash correcto:**
- Usa el script `hash-password.js` que creé
- O usa un generador online de bcrypt: https://bcrypt-generator.com/

---

## ✅ Después de Corregir

1. Verifica que el usuario tenga:
   - `password` = hash bcrypt (empieza con `$2b$10$`)
   - `rol` = `'admin'`

2. Prueba el login:
   - Ve a: `https://tu-frontend.onrender.com/admin/login`
   - Usuario: `admin_celeste`
   - Contraseña: `123456`

3. Si funciona, ¡cambia la contraseña después del primer acceso!



