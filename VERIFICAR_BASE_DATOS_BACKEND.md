# 🔍 Verificar Qué Base de Datos Está Usando el Backend

## Paso 1: Buscar en los Logs del Backend

En Render → `bustracksv-backend` → **"Logs"**

**Busca específicamente estas líneas** (pueden estar al inicio cuando arrancó el servidor):

✅ **Bien:**
```
☁️ Modo Cloud: Usando PostgreSQL
✅ Conexión a PostgreSQL exitosa
```

❌ **Mal:**
```
💾 Modo Local: Usando SQLite
Base de datos SQLite cargada desde: ...
```

---

## Paso 2: Si Está Usando SQLite (MAL)

Si ves que está usando SQLite, necesitas:

1. **Verificar Variables de Entorno:**
   - Ve a Render → `bustracksv-backend` → **"Environment"**
   - Verifica que existe `DATABASE_URL` con un valor que empiece con `postgresql://`
   
2. **Si NO existe DATABASE_URL:**
   - Ve a tu base de datos PostgreSQL en Render
   - Copia la **"Internal Database URL"**
   - Agréga la como variable de entorno `DATABASE_URL` en el backend
   
3. **Hacer Redeploy:**
   - Después de agregar/verificar `DATABASE_URL`
   - Haz un **"Manual Deploy"** del backend
   - Espera a que termine

---

## Paso 3: Verificar que Ahora Usa PostgreSQL

Después del redeploy, verifica los logs de nuevo. Debe decir:
```
☁️ Modo Cloud: Usando PostgreSQL
```

---

## Paso 4: Probar Login de Nuevo

Una vez que uses PostgreSQL, el login debería funcionar con:
- Usuario: `admin_celeste`
- Contraseña: `123456`

