# 🎯 Pasos Siguientes Después de Configurar DATABASE_URL

## ✅ Ya Tienes Hecho:
- [x] Base de datos PostgreSQL creada en Render
- [x] DATABASE_URL configurada en variables de entorno del backend

---

## 🔄 Paso 2 (Continuar): Configurar Otras Variables de Entorno

Ve a tu servicio `bustracksv-backend` en Render → **"Environment"** y asegúrate de tener estas variables:

### Variables Requeridas:

1. **DATABASE_URL** ✅ (ya la tienes)

2. **JWT_SECRET** ⚠️ (necesario para autenticación)
   - Genera uno aleatorio y seguro
   - Puedes usar PowerShell:
     ```powershell
     [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
     ```
   - O cualquier generador online de secrets

3. **NODE_ENV**
   - Valor: `production`

4. **PORT**
   - Valor: `4000`

5. **GOOGLE_MAPS_API_KEY** ⚠️ (si usas mapas)
   - Tu clave de API de Google Maps
   - Si no la tienes, puedes configurarla después

6. **ALLOWED_ORIGINS** ⚠️ (importante para CORS)
   - Valor: `https://bustracksv-frontend.onrender.com`
   - Reemplaza `bustracksv-frontend` con el nombre real de tu frontend

---

## 📊 Paso 3: Inicializar el Esquema de la Base de Datos

Necesitas crear las tablas en PostgreSQL. Tienes 2 opciones:

### Opción A: Usar un Cliente PostgreSQL (RECOMENDADO - Más Fácil)

1. **Descarga DBeaver** (gratis y fácil): https://dbeaver.io/download/
   - O usa pgAdmin: https://www.pgadmin.org/download/

2. **Obtén la conexión externa de Render:**
   - Ve a tu base de datos PostgreSQL en Render
   - Click en **"Info"** o **"Connect"**
   - Copia la **"External Connection String"** (o usa la DATABASE_URL que ya tienes)

3. **Conéctate desde DBeaver:**
   - Click en "New Database Connection"
   - Selecciona "PostgreSQL"
   - Pega la DATABASE_URL completa en "URL"
   - O configura manualmente: Host, Port, Database, User, Password
   - Click en "Test Connection" para verificar

4. **Ejecuta el script SQL:**
   - Abre el archivo `bustracksv/server/database/init.sql` en DBeaver
   - Selecciona todo el contenido (Ctrl+A)
   - Click en "Execute SQL Script" (F5)
   - Debe ejecutarse sin errores

### Opción B: Usar Render Shell (Alternativa)

1. Ve a tu servicio `bustracksv-backend` en Render
2. Click en **"Shell"**
3. Ejecuta (ajusta la ruta según tu estructura):
   ```bash
   cat database/init.sql | psql $DATABASE_URL
   ```
   
   **Nota:** Esto solo funciona si Render tiene `psql` instalado. Si no, usa la Opción A.

---

## 👤 Paso 4: Crear Usuario Administrador

Después de crear las tablas, crea el usuario admin.

### Opción A: Usar Render Shell (Recomendado)

1. Ve a tu servicio `bustracksv-backend` en Render
2. Click en **"Shell"**
3. Ejecuta:
   ```bash
   node create-admin-user.js
   ```
   
   Si no encuentra el archivo, prueba:
   ```bash
   cd server
   node create-admin-user.js
   ```
   
   O:
   ```bash
   cd bustracksv/server
   node create-admin-user.js
   ```

### Opción B: Desde DBeaver (SQL Directo)

Conéctate a la base de datos y ejecuta:

```sql
INSERT INTO usuarios (usuario, password, email, nombre_completo, rol) 
VALUES (
  'admin',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin@bustracksv.com',
  'Administrador Sistema',
  'admin'
);
```

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`
- ⚠️ **IMPORTANTE:** Cambia la contraseña después del primer acceso

---

## 🌐 Paso 5: Configurar Frontend

1. Ve a tu servicio `bustracksv-frontend` en Render
2. Click en **"Environment"**
3. Agrega:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://bustracksv-backend.onrender.com`
   - (Reemplaza con la URL real de tu backend)
4. **IMPORTANTE:** Después de agregar, haz un **"Manual Deploy"** o **"Redeploy"** del frontend para que se aplique

---

## ✅ Paso 6: Verificar que Todo Funciona

1. **Verifica el backend:**
   - Abre: `https://tu-backend.onrender.com/health`
   - Debe responder con `{"status":"ok"}` o similar

2. **Verifica el frontend:**
   - Abre: `https://tu-frontend.onrender.com`
   - Debe cargar la aplicación

3. **Verifica el login de admin:**
   - Ve a: `https://tu-frontend.onrender.com/admin/login`
   - Inicia sesión con: `admin` / `admin123`

4. **Revisa los logs si algo falla:**
   - Ve a tu servicio en Render → **"Logs"**
   - Busca errores (texto en rojo)

---

## 📱 Paso 7: Agregar a tu iPhone

1. Abre Safari en tu iPhone
2. Ve a la URL de tu frontend
3. Toca el botón de compartir (cuadrado con flecha)
4. Toca **"Agregar a pantalla de inicio"**
5. Personaliza el nombre
6. Toca **"Agregar"**

---

## 🆘 Si Algo No Funciona

### Backend no se conecta a la base de datos:
- Verifica que DATABASE_URL esté correcta en variables de entorno
- Revisa los logs del backend en Render
- Verifica que la base de datos esté "Active" en Render

### Error "relation does not exist":
- Las tablas no están creadas
- Ejecuta el script `init.sql` (Paso 3)

### Error CORS:
- Verifica que `ALLOWED_ORIGINS` tenga la URL exacta de tu frontend
- Asegúrate de que ambos servicios estén en HTTPS

### Frontend no se conecta al backend:
- Verifica que `VITE_API_URL` esté configurada correctamente
- Asegúrate de haber hecho redeploy del frontend después de agregar la variable

---

## 📋 Checklist Final

- [ ] DATABASE_URL configurada
- [ ] JWT_SECRET configurado
- [ ] NODE_ENV=production configurado
- [ ] ALLOWED_ORIGINS configurado
- [ ] Tablas creadas en PostgreSQL (init.sql ejecutado)
- [ ] Usuario administrador creado
- [ ] Frontend con VITE_API_URL configurado
- [ ] Frontend redeployado
- [ ] Backend responde en /health
- [ ] Frontend carga correctamente
- [ ] Login de admin funciona
- [ ] App agregada a iPhone





