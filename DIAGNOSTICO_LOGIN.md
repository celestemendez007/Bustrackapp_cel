# 🔍 Diagnóstico Completo del Problema de Login

## Paso 1: Verificar que el usuario existe en PostgreSQL

Ejecuta esto en DBeaver:

```sql
SELECT usuario, email, rol, activo, LEFT(password, 30) as password_preview 
FROM usuarios 
WHERE usuario = 'admin';
```

**Debe mostrar:**
- ✅ `usuario` = `'admin'`
- ✅ `rol` = `'admin'`
- ✅ `activo` = `true`
- ✅ `password_preview` = `'$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZ'` (empieza con $2b$10$)

**Si NO muestra nada** → El usuario no existe, créalo de nuevo.

**Si `password_preview` NO empieza con `$2b$10$`** → La contraseña no está hasheada, hay que actualizarla.

---

## Paso 2: Verificar qué base de datos usa el backend

En Render → `bustracksv-backend` → **"Logs"**

Busca al inicio de los logs:
- ✅ **Bien:** `☁️ Modo Cloud: Usando PostgreSQL`
- ❌ **Mal:** `💾 Modo Local: Usando SQLite`

**Si dice SQLite** → El backend NO está conectado a PostgreSQL.

---

## Paso 3: Verificar Variables de Entorno

En Render → `bustracksv-backend` → **"Environment"**

Verifica:
- ✅ `DATABASE_URL` existe y empieza con `postgresql://`
- ✅ `JWT_SECRET` existe (no vacío)

**Si DATABASE_URL no existe o está vacía** → Agrégala y haz redeploy.

---

## Paso 4: Ver los logs del login

Cuando intentas hacer login, ve a Render → `bustracksv-backend` → **"Logs"**

Busca errores que aparezcan cuando intentas loguearte. Copia los errores aquí.

---

## Paso 5: Probar directamente desde el backend

En Render → `bustracksv-backend` → **"Shell"**

Ejecuta:

```bash
node -e "
import('./src/db-cloud.js').then(async (db) => {
  try {
    const result = await db.pool.query('SELECT * FROM usuarios WHERE usuario = \$1', ['admin']);
    console.log('Usuario encontrado:', result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
});
"
```

Esto te dirá si el backend puede ver el usuario en PostgreSQL.




