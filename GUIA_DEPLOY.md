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

## 🔍 Verificación Post-Despliegue

1. **Verifica que el backend funciona:**
   ```
   https://tu-backend.com/health
   ```

2. **Verifica que el frontend carga:**
   ```
   https://tu-frontend.com
   ```

3. **Verifica la conexión:**
   - Abre la consola del navegador
   - Debe conectarse al backend sin errores CORS

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté correctamente configurada
- Verifica que el servicio de base de datos esté corriendo
- Verifica los Security Groups/Firewall

### Error: "CORS policy"
- Agrega la URL del frontend a `ALLOWED_ORIGINS` en el backend
- Verifica que ambos servicios estén en HTTPS (si es producción)

### Error: "404 Not Found" en rutas del frontend
- Verifica que nginx esté configurado correctamente
- El `nginx.conf` debe tener `try_files $uri $uri/ /index.html;`

### Error: "VITE_API_URL not defined"
- Asegúrate de pasar `VITE_API_URL` como build arg al construir el Docker
- O configura la variable antes del build en el proveedor

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

