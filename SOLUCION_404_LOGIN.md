# 🔧 Solución: Error 404 en /login

## Problema
El frontend está intentando llamar a `bustracksv-backend.onrender.com/login` pero recibe un 404.

## Posibles Causas:

### 1. El Backend No Está Corriendo
- Ve a Render → `bustracksv-backend`
- Verifica que el estado sea **"Active"** (verde)
- Si está en "Suspended" o "Build failed", hay que reactivarlo

### 2. La URL del API Está Mal Configurada
- El frontend necesita saber la URL correcta del backend
- Verifica la variable `VITE_API_URL` en el frontend

### 3. El Backend No Tiene el Endpoint /login
- Necesitas verificar los logs del backend

---

## ✅ Solución Paso a Paso:

### Paso 1: Verificar que el Backend Está Activo

1. Ve a Render → Dashboard
2. Busca tu servicio `bustracksv-backend`
3. Verifica que el estado sea **"Active"** (no "Suspended" o "Build failed")
4. Si no está activo, haz click en **"Manual Deploy"** o reactívalo

### Paso 2: Verificar la URL del Backend

1. Ve a `bustracksv-backend` → **"Settings"**
2. Busca la **"URL"** del servicio (algo como: `https://bustracksv-backend.onrender.com`)
3. Anota esta URL

### Paso 3: Configurar VITE_API_URL en el Frontend

1. Ve a tu servicio `bustracksv-frontend` en Render
2. Click en **"Environment"**
3. Verifica que existe:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://bustracksv-backend.onrender.com` (la URL de tu backend)
4. Si no existe, agrégala
5. **IMPORTANTE:** Después de agregar, haz un **"Manual Deploy"** del frontend

### Paso 4: Probar el Endpoint Directamente

Abre en tu navegador:
```
https://bustracksv-backend.onrender.com/health
```

Debe responder con algo como `{"status":"ok"}` o similar.

Si no responde, el backend tiene problemas.

---

## Verificar Logs del Backend

1. Ve a `bustracksv-backend` → **"Logs"**
2. Busca errores (texto en rojo)
3. Verifica que el servidor arrancó correctamente
4. Busca mensajes como:
   - ✅ `Server running on port 4000`
   - ✅ `☁️ Modo Cloud: Usando PostgreSQL`
   - ❌ Si ves errores, cópialos aquí

---

## Verificar que el Usuario Existe (Después de arreglar el 404)

Una vez que el 404 esté resuelto, verifica que el usuario existe:

En DBeaver:
```sql
SELECT usuario, email, rol, activo FROM usuarios WHERE usuario = 'admin_celeste';
```

Debe mostrar:
- `rol` = `'admin'`
- `activo` = `true`



