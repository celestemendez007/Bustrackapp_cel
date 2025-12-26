# 🔍 Verificar Conexión del Backend

## Paso 1: Verificar que el Backend Está Activo

1. Ve a Render → Dashboard
2. Busca `bustracksv-backend`
3. Verifica el estado:
   - ✅ **"Active"** (verde) = Está corriendo
   - ❌ **"Suspended"** = Está suspendido
   - ❌ **"Build failed"** = Error al construir

**Si está suspendido o con error:**
- Click en el servicio
- Click en **"Manual Deploy"** o **"Restart"**

---

## Paso 2: Probar el Endpoint Directamente

Abre en tu navegador:

```
https://bustracksv-backend.onrender.com/health
```

**Debe responder:**
```json
{"status":"OK","uptime":...,"timestamp":"..."}
```

**Si NO responde o da error:**
- El backend no está corriendo correctamente
- Necesitas revisar el estado en Render

---

## Paso 3: Probar el Endpoint /login (POST)

Puedes usar una herramienta como Postman, o desde la consola del navegador:

```javascript
fetch('https://bustracksv-backend.onrender.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    usuario: 'admin_celeste',
    password: '123456'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

Esto te dirá si el endpoint responde o no.

---

## Paso 4: Verificar el Campo 'usuario' en la Base de Datos

En DBeaver, ejecuta:

```sql
SELECT usuario, email, rol, activo 
FROM usuarios 
WHERE email = 'celeste.mendez007@gmail.com';
```

**Confirma que el campo `usuario` tiene un valor** (probablemente `'admin_celeste'`).

---

## Paso 5: Verificar Variables de Entorno del Backend

1. Ve a Render → `bustracksv-backend` → **"Environment"**
2. Verifica que existe:
   - ✅ `DATABASE_URL` = `postgresql://...`
   - ✅ `NODE_ENV` = `production`
   - ✅ `PORT` = `4000`
   - ✅ `JWT_SECRET` = (debe tener un valor)

---

## Paso 6: Ver los Logs Recientes

1. Ve a Render → `bustracksv-backend` → **"Logs"**
2. Cambia el filtro de tiempo a **"Last 24 hours"** o **"All time"**
3. Intenta hacer login desde el frontend
4. Busca cualquier error que aparezca




