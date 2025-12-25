# 🔍 Verificar Usuario en Base de Datos

## Paso 1: Verificar que el Usuario Existe

En DBeaver, ejecuta:

```sql
SELECT * FROM usuarios WHERE usuario = 'admin_celeste';
```

**Debe mostrar tu usuario con:**
- ✅ `usuario` = 'admin_celeste'
- ✅ `password` = un hash que empieza con `$2b$10$...`
- ✅ `rol` = 'admin'

Si NO aparece nada, el usuario no existe. Necesitas crearlo de nuevo.

---

## Paso 2: Verificar el Backend Está Usando PostgreSQL

El problema puede ser que el backend aún está usando SQLite en lugar de PostgreSQL.

### Verificar en Render Logs:

1. Ve a tu servicio `bustracksv-backend` en Render
2. Click en **"Logs"**
3. Busca mensajes como:
   - ✅ `☁️ Modo Cloud: Usando PostgreSQL` ← Debe aparecer esto
   - ❌ `💾 Modo Local: Usando SQLite` ← Si aparece esto, hay un problema

### Verificar Variables de Entorno:

1. Ve a `bustracksv-backend` → **"Environment"**
2. Verifica que existe:
   - `DATABASE_URL` = `postgresql://...` (debe empezar con `postgresql://`)
   - `NODE_ENV` = `production`

Si `DATABASE_URL` no está o está vacía, el backend usará SQLite.

---

## Paso 3: Verificar Conexión a Base de Datos

Si el backend está usando SQLite, los usuarios están en SQLite (local), no en PostgreSQL.

**Solución:**
1. Asegúrate de que `DATABASE_URL` esté configurada correctamente
2. Haz un redeploy del backend (esto lo reiniciará con la nueva configuración)

---

## Paso 4: Si el Usuario NO Existe en PostgreSQL

Ejecuta este SQL completo en DBeaver:

```sql
-- Agregar columna rol si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Crear el usuario con hash correcto
INSERT INTO usuarios (usuario, email, password, nombre_completo, activo, rol) 
VALUES (
  'admin_celeste', 
  'celeste.mendez007@gmail.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- Hash de '123456'
  'Celeste Mendez', 
  true,
  'admin'
);
```

---

## Paso 5: Verificar desde el Backend

Puedes probar conectarte desde Render Shell:

1. Ve a `bustracksv-backend` → **"Shell"**
2. Ejecuta:
   ```bash
   node -e "
   import('./src/db-cloud.js').then(async (db) => {
     const result = await db.pool.query('SELECT * FROM usuarios WHERE usuario = \$1', ['admin_celeste']);
     console.log('Usuario encontrado:', result.rows);
   });
   "
   ```

---

## Resumen del Problema

Si dice "usuario no encontrado", es porque:
1. El usuario no existe en PostgreSQL (está en SQLite, o nunca se creó)
2. El backend está usando SQLite en lugar de PostgreSQL
3. La consulta está buscando en la base de datos incorrecta

**La solución más común:** Verifica que `DATABASE_URL` esté configurada y haz redeploy del backend.

