# 🚀 Guía de Despliegue a la Nube - BusTrackSV

Esta guía te ayudará a desplegar BusTrackSV en proveedores de nube como Render, Railway o AWS para obtener un link público como `bustracksv.com`.

## 📋 Requisitos Previos

1. **Cuenta en un proveedor de nube:**
   - [Render.com](https://render.com) (Recomendado - gratuito con limitaciones)
   - [Railway.app](https://railway.app) (Recomendado - fácil de usar)
   - [AWS](https://aws.amazon.com) (Más complejo, pero más potente)

2. **Variables de entorno necesarias:**
   - `JWT_SECRET`: Secreto para JWT (genera uno aleatorio y seguro)
   - `GOOGLE_MAPS_API_KEY`: Tu clave de API de Google Maps
   - `DATABASE_URL`: URL de conexión a PostgreSQL (la proporciona el proveedor)
   - `FIREBASE_PROJECT_ID`: ID de tu proyecto Firebase (opcional)

## 🔑 Cómo Obtener las Claves Requeridas

### 1. GOOGLE_MAPS_API_KEY (Clave de API de Google Cloud)

**Pasos para obtenerla:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto o selecciona uno existente:
   - Click en el selector de proyectos (arriba a la izquierda)
   - Click en "New Project"
   - Ingresa un nombre (ej: "BusTrackSV")
   - Click en "Create"
4. Habilita las APIs necesarias:
   - Ve a "APIs & Services" > "Library"
   - Busca y habilita estas APIs:
     - **Maps JavaScript API** (para mostrar mapas en el frontend)
     - **Directions API** (para calcular rutas)
     - **Geocoding API** (para convertir direcciones a coordenadas)
5. Crea la API Key:
   - Ve a "APIs & Services" > "Credentials"
   - Click en "+ Create Credentials" > "API Key"
   - Se mostrará tu clave (formato: `AIzaSy...`)
   - **IMPORTANTE:** Guarda esta clave de forma segura
6. (Opcional) Restringe la API Key:
   - Click en "Restrict Key" para mayor seguridad
   - Restringe por aplicación web y por APIs
   
**Valor a usar:**
```
GOOGLE_MAPS_API_KEY=AIzaSy...tu_clave_aqui...
```

---

### 2. FIREBASE_PROJECT_ID (ID de Proyecto de Firebase)

**Pasos para obtenerlo:**

**Opción A: Si ya tienes un proyecto Firebase:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a "Project Settings" (ícono de engranaje)
4. En la sección "General", encontrarás "Project ID"
5. Copia este ID

**Opción B: Crear un nuevo proyecto Firebase:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Add project" o "Create a project"
3. Ingresa un nombre para el proyecto (ej: "bustracksv")
4. (Opcional) Desactiva Google Analytics si no lo necesitas
5. Click en "Create project"
6. Una vez creado, ve a "Project Settings" (ícono de engranaje)
7. En la sección "General", encontrarás "Project ID"
8. Copia este ID

**Nota:** Si usas Firebase, también necesitarás las credenciales:
- Descarga el archivo JSON de credenciales desde:
  - Google Cloud Console > IAM & Admin > Service Accounts
  - Crea una cuenta de servicio > Keys > Create Key > JSON
- Guarda el archivo como `firebase-key.json` en `server/config/`

**Valor a usar:**
```
FIREBASE_PROJECT_ID=tu-proyecto-id
```

Ejemplo:
```
FIREBASE_PROJECT_ID=bustracksv-12345
```

---

## 🎯 Opción 1: Despliegue en Render.com

### Pasos:

1. **Crear cuenta en Render:**
   - Ve a https://render.com
   - Conecta tu repositorio de GitHub/GitLab

2. **Crear Base de Datos PostgreSQL:**
   - En el dashboard de Render, click en "New +"
   - Selecciona "PostgreSQL"
   - Configura:
     - Name: `bustracksv-db`
     - Database: `bustracksv`
     - User: `bustracksv`
     - Plan: Starter (gratis) o superior
   - Guarda las credenciales que Render te proporciona

3. **Desplegar Backend:**
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio
   - Configura:
     - Name: `bustracksv-backend`
     - Root Directory: `bustracksv/server`
     - Environment: `Docker`
     - Dockerfile Path: `bustracksv/server/Dockerfile`
     - Docker Context: `bustracksv/server`
   - Variables de entorno:
     ```
     NODE_ENV=production
     PORT=4000
     DATABASE_URL=<URL_DE_TU_BASE_DE_DATOS>
     JWT_SECRET=<GENERA_UN_SECRETO_ALEATORIO>
     GOOGLE_MAPS_API_KEY=<TU_CLAVE_DE_GOOGLE_MAPS>
     GOOGLE_APPLICATION_CREDENTIALS=/app/config/firebase-key.json
     FIREBASE_PROJECT_ID=<TU_PROJECT_ID>
     ALLOWED_ORIGINS=https://bustracksv-frontend.onrender.com
     ```
   - Guarda y despliega

4. **Desplegar Frontend:**
   - Click en "New +" → "Web Service"
   - Conecta tu repositorio
   - Configura:
     - Name: `bustracksv-frontend`
     - Root Directory: `bustracksv/client`
     - Environment: `Docker`
     - Dockerfile Path: `bustracksv/client/Dockerfile`
     - Docker Context: `bustracksv/client`
   - En "Advanced" → "Build Command", agrega:
     ```
     docker build --build-arg VITE_API_URL=https://bustracksv-backend.onrender.com -t bustracksv-frontend .
     ```
   - O mejor, configura una variable de entorno `VITE_API_URL` antes del build
   - Guarda y despliega

5. **Configurar Dominio Personalizado (Opcional):**
   - En cada servicio, ve a "Settings" → "Custom Domain"
   - Agrega tu dominio (ej: `bustracksv.com`)
   - Configura los DNS según las instrucciones de Render

---

## 🚂 Opción 2: Despliegue en Railway

### Pasos:

1. **Crear cuenta en Railway:**
   - Ve a https://railway.app
   - Conecta tu repositorio de GitHub

2. **Desplegar con Docker Compose:**
   - En Railway, click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Railway detectará automáticamente tu `docker-compose.yml`
   - O manualmente:
     - Click en "New" → "GitHub Repo"
     - Selecciona tu repositorio
     - Railway detectará el docker-compose.yml automáticamente

3. **Configurar Variables de Entorno:**
   - En Railway, ve a tu proyecto
   - Click en "Variables"
   - Agrega todas las variables necesarias:
     ```
     DB_NAME=bustracksv
     DB_USER=bustracksv
     DB_PASSWORD=<GENERA_UNA_CONTRASEÑA_SEGURA>
     JWT_SECRET=<GENERA_UN_SECRETO_ALEATORIO>
     GOOGLE_MAPS_API_KEY=<TU_CLAVE_DE_GOOGLE_MAPS>
     VITE_API_URL=https://tu-backend.up.railway.app
     ```
   - Railway creará automáticamente la base de datos PostgreSQL

4. **Configurar Dominio:**
   - Ve a cada servicio → "Settings" → "Generate Domain"
   - O configura un dominio personalizado en "Custom Domain"

---

## ☁️ Opción 3: Despliegue en AWS

### Usando AWS Elastic Beanstalk o ECS:

1. **Preparar la aplicación:**
   ```bash
   # Construir las imágenes Docker localmente
   docker-compose build
   ```

2. **Subir a AWS:**
   - Opción A: AWS Elastic Beanstalk (más fácil)
     - Instala EB CLI
     - Ejecuta `eb init` y sigue las instrucciones
   
   - Opción B: AWS ECS con Fargate (más flexible)
     - Crea un cluster ECS
     - Crea servicios para backend, frontend y base de datos
     - Configura las variables de entorno

3. **Configurar RDS (Base de datos):**
   - Crea una instancia RDS PostgreSQL
   - Configura seguridad (Security Groups)
   - Actualiza `DATABASE_URL` en tus servicios

---

## 🔧 Configuración Post-Despliegue

### 1. Crear Usuario Administrador:

Una vez desplegado, necesitas crear un usuario administrador. Puedes hacerlo de dos formas:

**Opción A: Script en el servidor**
```bash
# Si tienes acceso SSH al servidor
cd bustracksv/server
node create-admin-user.js
```

**Opción B: Desde la base de datos**
```sql
-- Conectarte a la base de datos y ejecutar:
INSERT INTO usuarios (usuario, password, email, rol) 
VALUES (
  'admin',
  '$2b$10$...', -- Hash bcrypt de tu contraseña
  'admin@bustracksv.com',
  'admin'
);
```

### 2. Verificar CORS:

Asegúrate de que `ALLOWED_ORIGINS` en el backend incluya la URL de tu frontend:
```
ALLOWED_ORIGINS=https://tu-frontend.com,https://www.tu-frontend.com
```

### 3. Configurar Firebase (si lo usas):

Sube tu archivo `firebase-key.json` a Render/Railway:
- Render: Usa "Environment Files" o un volumen
- Railway: Úsalo como variable de entorno o sube el archivo

---

## 🌐 Configurar Dominio Personalizado

### Para Render:

1. Ve a tu servicio → "Settings" → "Custom Domain"
2. Agrega tu dominio (ej: `bustracksv.com`)
3. Render te dará instrucciones para configurar DNS
4. Agrega registros CNAME o A según lo indicado

### Para Railway:

1. Ve a tu servicio → "Settings" → "Custom Domain"
2. Agrega tu dominio
3. Configura los DNS según las instrucciones

### Configuración DNS típica:

```
Tipo: CNAME
Nombre: @ (o www)
Valor: tu-servicio.onrender.com (o railway.app)
```

---

## ✅ PASOS DESPUÉS DEL DESPLIEGUE (¡Haz esto ahora!)

Si ya tienes tus servicios desplegados en Render (como en la imagen), sigue estos pasos:

### Paso 1: Crear Base de Datos PostgreSQL

1. En Render, ve a tu dashboard
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name:** `bustracksv-db`
   - **Database:** `bustracksv`
   - **User:** `bustracksv`
   - **Plan:** Starter (gratis) o superior
4. **IMPORTANTE:** Guarda la `DATABASE_URL` que Render te muestra (algo como: `postgresql://user:pass@host:5432/bustracksv`)

### Paso 2: Configurar Variables de Entorno en el Backend

**📍 Ubicación exacta en Render:**

1. **Abre el Dashboard de Render:**
   - Ve a: https://dashboard.render.com
   - Inicia sesión con tu cuenta

2. **Selecciona tu servicio:**
   - En la lista de servicios, busca y haz clic en tu servicio backend
   - (Probablemente se llama `bustrackapp-cel` o similar)

3. **Abre la sección "Environment":**
   - En el **menú lateral izquierdo**, busca y haz clic en **"Environment"**
   - (También puede aparecer como "Environment Variables" o "Env")

4. **Agrega las variables de entorno:**
   - Haz clic en el botón **"+ Add Environment Variable"** o **"Add"**
   - Agrega cada variable una por una:
     - **Key:** `GOOGLE_MAPS_API_KEY`
     - **Value:** `tu_clave_de_google_maps_aqui` (ej: `AIzaSy...`)
     - Haz clic en **"Save Changes"** o **"Add"**
   
   Repite este proceso para todas las variables necesarias:

   ```
   DATABASE_URL=<la_URL_que_te_dio_Render_en_el_paso_1>
   NODE_ENV=production
   PORT=4000
   JWT_SECRET=<genera_un_secreto_aleatorio_seguro>
   GOOGLE_MAPS_API_KEY=<tu_clave_de_google_maps>
   ALLOWED_ORIGINS=https://bustracksv-frontend.onrender.com
   ```

5. **Render reiniciará automáticamente:**
   - Después de guardar, Render detectará los cambios y reiniciará tu servicio automáticamente
   - Puedes ver el progreso en la pestaña "Events" o "Logs"

4. **Para generar JWT_SECRET:** Puedes usar cualquier generador online o ejecutar en PowerShell:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

5. Click en **"Save Changes"** - esto reiniciará tu backend

### Paso 3: Inicializar el Esquema de la Base de Datos

Necesitas ejecutar el script SQL de inicialización en tu base de datos PostgreSQL:

**Opción A: Usar Render PostgreSQL Shell (Más fácil)**

1. En Render, ve a tu base de datos PostgreSQL `bustracksv-db`
2. Click en **"Info"** para ver las credenciales de conexión
3. Anota estos valores:
   - Host
   - Database
   - User
   - Password
   - Port (generalmente 5432)
4. Descarga y lee el archivo `bustracksv/server/database/init.sql` desde tu código
5. Ve a **"Connect"** → **"External Connection"** en Render
6. Copia el comando de conexión que Render te da
7. Usa un cliente PostgreSQL para conectarte:
   - **pgAdmin** (GUI): https://www.pgadmin.org/download/
   - **DBeaver** (GUI): https://dbeaver.io/download/
   - **psql** (terminal): `psql "postgresql://user:pass@host:5432/bustracksv"`
8. Una vez conectado, ejecuta todo el contenido del archivo `init.sql`

**Opción B: Usar Render Shell (Alternativa)**

1. Ve a tu servicio `bustracksv-backend` en Render
2. Click en **"Shell"**
3. Ejecuta:
   ```bash
   # Instalar psql si no está disponible
   # Luego conéctate usando la DATABASE_URL
   psql $DATABASE_URL < /opt/render/project/src/server/database/init.sql
   ```
   O si tienes acceso directo:
   ```bash
   psql "tu_DATABASE_URL_aqui" < /path/to/init.sql
   ```

**Nota:** Si Render no tiene `psql` instalado en el shell, usa la Opción A con un cliente externo.

### Paso 4: Crear Usuario Administrador

**Opción A: Desde Render Shell (Recomendado)**

1. Ve a tu servicio `bustracksv-backend` en Render
2. Click en **"Shell"** (en el menú lateral o en la parte superior)
3. Ejecuta:
   ```bash
   cd /opt/render/project/src/bustracksv/server
   node create-admin-user.js
   ```
   O si está en la raíz:
   ```bash
   cd /opt/render/project/src/server
   node create-admin-user.js
   ```

**Opción B: Desde la Base de Datos directamente**

Conéctate a PostgreSQL y ejecuta:
```sql
INSERT INTO usuarios (usuario, password, email, nombre_completo, rol) 
VALUES (
  'admin',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Hash de 'admin123'
  'admin@bustracksv.com',
  'Administrador Sistema',
  'admin'
);
```

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`
- ⚠️ **Cambia la contraseña después del primer acceso**

### Paso 5: Configurar Variables de Entorno en el Frontend

1. Ve a tu servicio **`bustracksv-frontend`** en Render
2. Click en **"Environment"**
3. Agrega:
   ```
   VITE_API_URL=https://bustracksv-backend.onrender.com
   ```
   (Reemplaza con la URL real de tu backend)
4. **IMPORTANTE:** Después de agregar esta variable, necesitas hacer un **redeploy** del frontend para que se aplique

### Paso 6: Verificar que Todo Funciona

1. **Verifica el backend:**
   - Abre en tu navegador: `https://bustracksv-backend.onrender.com/health`
   - Debe responder con `{"status":"ok"}` o similar

2. **Verifica el frontend:**
   - Abre en tu navegador: `https://bustracksv-frontend.onrender.com`
   - Debe cargar la aplicación

3. **Verifica el login de administrador:**
   - Ve a: `https://bustracksv-frontend.onrender.com/admin/login`
   - Inicia sesión con: `admin` / `admin123`

### Paso 7: Agregar a tu iPhone

1. Abre Safari en tu iPhone
2. Ve a la URL de tu frontend: `https://bustracksv-frontend.onrender.com`
3. Toca el botón de compartir (cuadrado con flecha)
4. Toca **"Agregar a pantalla de inicio"**
5. Personaliza el nombre si quieres
6. Toca **"Agregar"**
7. ¡Listo! Ahora tienes un ícono en tu iPhone que abre tu app

---

## 🔍 Verificación Post-Despliegue (Checklist)

1. ✅ **Base de datos PostgreSQL creada y conectada**
2. ✅ **Variables de entorno configuradas en backend**
3. ✅ **Variables de entorno configuradas en frontend**
4. ✅ **Backend responde en:** `https://tu-backend.onrender.com/health`
5. ✅ **Frontend carga en:** `https://tu-frontend.onrender.com`
6. ✅ **Usuario administrador creado**
7. ✅ **Login de administrador funciona**
8. ✅ **CORS configurado correctamente** (ALLOWED_ORIGINS incluye la URL del frontend)
9. ✅ **App agregada a iPhone/móvil**

### Verificar la conexión:
- Abre la consola del navegador (F12)
- Debe conectarse al backend sin errores CORS
- Si ves errores CORS, verifica que `ALLOWED_ORIGINS` en el backend incluya la URL exacta de tu frontend

---

## 🐛 Solución de Problemas

### Cómo Ver los Logs en Render

Si algo no funciona, revisa los logs:

1. Ve a tu servicio en Render
2. Click en **"Logs"** (en el menú lateral)
3. Verás los logs en tiempo real
4. Busca errores en rojo (especialmente errores de conexión a base de datos)

### Error: "Cannot connect to database"
- ✅ Verifica que `DATABASE_URL` esté correctamente configurada en las variables de entorno
- ✅ Verifica que el servicio de base de datos esté corriendo (debe decir "Active")
- ✅ Asegúrate de que la URL no tenga espacios adicionales
- ✅ Verifica en los logs del backend si hay errores de conexión

### Error: "CORS policy"
- ✅ Agrega la URL exacta del frontend a `ALLOWED_ORIGINS` en el backend (incluye `https://` y sin barra final)
- ✅ Ejemplo: `ALLOWED_ORIGINS=https://bustracksv-frontend.onrender.com`
- ✅ Verifica que ambos servicios estén en HTTPS (si es producción)
- ✅ Después de cambiar, haz un redeploy del backend

### Error: "404 Not Found" en rutas del frontend
- ✅ Verifica que nginx esté configurado correctamente
- ✅ El `nginx.conf` debe tener `try_files $uri $uri/ /index.html;`
- ✅ Verifica que el build del frontend se completó exitosamente

### Error: "VITE_API_URL not defined"
- ✅ Agrega `VITE_API_URL` como variable de entorno en el frontend
- ✅ **IMPORTANTE:** Después de agregar, necesitas hacer un **redeploy** del frontend
- ✅ Verifica que la URL sea correcta (debe ser la URL de tu backend)

### Error: "Base de datos no tiene tablas" o "relation does not exist"
- ✅ Ejecuta el script `init.sql` en tu base de datos PostgreSQL
- ✅ O verifica que el backend esté usando `db-cloud.js` (debe aparecer en los logs "☁️ Modo Cloud: Usando PostgreSQL")
- ✅ Si no aparece ese mensaje, verifica que `DATABASE_URL` esté configurada

### Backend no inicia o se crashea
- ✅ Revisa los logs para ver el error exacto
- ✅ Verifica que todas las variables de entorno estén configuradas
- ✅ Verifica que `JWT_SECRET` esté configurado
- ✅ Verifica que `GOOGLE_MAPS_API_KEY` esté configurado (si lo usas)

---

## 📝 Notas Importantes

1. **Costos:**
   - Render: Gratis con limitaciones, luego desde $7/mes
   - Railway: $5/mes crédito gratis, luego pay-as-you-go
   - AWS: Varía según uso (puede ser desde $15/mes)

2. **Base de Datos:**
   - En producción, siempre usa PostgreSQL
   - SQLite solo es para desarrollo local

3. **Archivos Estáticos:**
   - El frontend se construye como archivos estáticos
   - Se sirven con nginx en el contenedor

4. **Variables Sensibles:**
   - **NUNCA** subas `.env` a Git
   - Usa las variables de entorno del proveedor
   - `JWT_SECRET` debe ser aleatorio y seguro

---

## ✅ Checklist Final

- [ ] Base de datos PostgreSQL creada y configurada
- [ ] Backend desplegado y accesible
- [ ] Frontend desplegado y accesible
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] Usuario administrador creado
- [ ] Dominio personalizado configurado (opcional)
- [ ] SSL/HTTPS funcionando
- [ ] Pruebas de funcionalidad completadas

---

¡Tu aplicación ahora está disponible públicamente en la nube! 🎉

---

## ❓ Preguntas Frecuentes (FAQ)

### ¿Cómo hago para que funcione con todos los internets?

**Respuesta:** Sigue los pasos en esta guía para subir el código a **Render** o **Railway**. Ellos ponen tu app en internet y te dan un link público que funciona desde cualquier lugar del mundo.

**Pasos rápidos:**
1. Crea una cuenta en [Render.com](https://render.com) o [Railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Sigue las instrucciones de la sección "Opción 1: Despliegue en Render.com" o "Opción 2: Despliegue en Railway" de esta guía
4. Una vez desplegado, tendrás un link como `https://bustracksv.onrender.com` que funciona desde cualquier dispositivo con internet

---

### ¿Que la base de datos sea para 6 millones de personas?

**Respuesta:** He programado la app (`db.js`) para que se conecte automáticamente a **PostgreSQL** cuando la subas a la nube. Esa es la base de datos "gigante" que puede manejar millones de usuarios.

**Cómo crearla con 1 clic:**

**En Render:**
1. En el dashboard, click en "New +"
2. Selecciona "PostgreSQL"
3. Elige un plan (Starter es gratis, pero para 6 millones de personas necesitarás un plan superior)
4. Render te dará automáticamente la `DATABASE_URL` que debes usar en las variables de entorno

**En Railway:**
1. Railway crea automáticamente PostgreSQL cuando despliegas
2. O puedes agregar manualmente: "New" → "Database" → "PostgreSQL"
3. Railway te proporciona la `DATABASE_URL` automáticamente

**Importante:** El código ya está listo. Solo necesitas crear la base de datos en el proveedor y configurar la variable `DATABASE_URL` en las variables de entorno de tu backend.

---

### ¿Poder verla en mi iPhone?

**Respuesta:** ¡Sí! Al terminar el despliegue, tendrás un link (por ejemplo: `https://bustracksv.onrender.com`). Solo ábrelo en Safari en tu iPhone y agrégalo a inicio.

**Pasos para agregarlo a inicio en iPhone:**
1. Abre el link de tu app en Safari
2. Toca el botón de compartir (cuadrado con flecha hacia arriba) en la parte inferior
3. Desplázate hacia abajo y toca "Agregar a pantalla de inicio"
4. Personaliza el nombre si quieres (ej: "BusTrackSV")
5. Toca "Agregar"
6. Ahora tendrás un ícono en tu pantalla de inicio que abre tu app como si fuera nativa

**Nota:** La app funcionará como una Progressive Web App (PWA) en tu iPhone, con acceso rápido desde el ícono de inicio.

---

## 📌 Resumen Rápido

✅ **El código YA está listo.** Solo falta que lo subas a la nube siguiendo esta guía.

**Lo que necesitas hacer:**
1. Crear cuenta en Render o Railway
2. Subir tu código (conectar repositorio)
3. Crear base de datos PostgreSQL (1 clic en el proveedor)
4. Configurar variables de entorno
5. ¡Listo! Tendrás tu link público

**El código ya incluye:**
- ✅ Conexión automática a PostgreSQL en la nube (`db.js`)
- ✅ Configuración para producción
- ✅ Soporte para millones de usuarios
- ✅ Funciona en móviles (iPhone, Android, etc.)

