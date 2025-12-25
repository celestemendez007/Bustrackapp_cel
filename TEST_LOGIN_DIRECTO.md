# 🧪 Probar Login Directamente desde el Backend

## Prueba 1: Verificar que el Backend Está Usando PostgreSQL

En Render → `bustracksv-backend` → **"Logs"**

Busca al inicio de los logs (cambia a "All time" o "Last 24 hours"):
- ✅ `☁️ Modo Cloud: Usando PostgreSQL`
- ❌ `💾 Modo Local: Usando SQLite`

**Si dice SQLite** → Ese es el problema. El backend no está conectado a PostgreSQL.

---

## Prueba 2: Probar el Login con curl o desde el navegador

Abre la consola del navegador (F12) y ejecuta:

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
.then(data => {
  console.log('Respuesta:', data);
  if (data.message === 'Usuario no encontrado') {
    console.error('❌ El usuario no se encuentra en la base de datos que el backend está usando');
  } else if (data.message === 'Contraseña incorrecta') {
    console.log('✅ El usuario SÍ existe, pero la contraseña está mal');
  } else if (data.token) {
    console.log('✅ Login exitoso!', data);
  }
})
.catch(err => {
  console.error('Error:', err);
});
```

Esto te dirá exactamente qué está pasando.

---

## Prueba 3: Verificar Variables de Entorno

En Render → `bustracksv-backend` → **"Environment"**

Verifica que `DATABASE_URL` esté configurada correctamente y empiece con `postgresql://`

---

## Posible Solución:

Si el backend está usando SQLite en lugar de PostgreSQL:

1. Verifica que `DATABASE_URL` esté configurada
2. Haz un **"Manual Deploy"** o **"Redeploy"** del backend
3. Espera a que termine el deploy
4. Verifica los logs de nuevo para confirmar que ahora dice "PostgreSQL"

