# 🚀 Despliegue Rápido - BusTrackSV

Esta carpeta ahora contiene todos los archivos necesarios para desplegar BusTrackSV en la nube y obtener un link público como `bustracksv.com`.

## ✅ Archivos Creados

### Docker
- `docker-compose.yml` - Configuración completa para desplegar toda la aplicación
- `bustracksv/server/Dockerfile` - Imagen Docker del backend
- `bustracksv/client/Dockerfile` - Imagen Docker del frontend
- `bustracksv/client/nginx.conf` - Configuración de nginx para servir el frontend
- `.dockerignore` - Archivos a ignorar en el build
- `bustracksv/server/.dockerignore` - Ignore para el servidor
- `bustracksv/client/.dockerignore` - Ignore para el cliente

### Configuración de Plataformas
- `render.yaml` - Configuración para Render.com
- `railway.json` - Configuración para Railway.app
- `railway.toml` - Configuración alternativa para Railway

### Documentación
- `GUIA_DEPLOY.md` - Guía completa paso a paso para desplegar

## 🎯 Opciones de Despliegue

### 1. Render.com (Recomendado para empezar)
- ✅ Plan gratuito disponible
- ✅ Fácil de usar
- ✅ SSL automático
- 📖 Ver `GUIA_DEPLOY.md` sección "Opción 1"

### 2. Railway.app (Recomendado)
- ✅ Muy fácil de usar
- ✅ Docker Compose nativo
- ✅ $5 crédito gratis al mes
- 📖 Ver `GUIA_DEPLOY.md` sección "Opción 2"

### 3. AWS
- ⚠️ Más complejo
- 💰 Costos variables
- 📖 Ver `GUIA_DEPLOY.md` sección "Opción 3"

## 🚀 Inicio Rápido con Railway (5 minutos)

1. **Sube tu código a GitHub**

2. **Ve a Railway.app y conecta tu repositorio**

3. **Railway detectará automáticamente el `docker-compose.yml`**

4. **Configura las variables de entorno:**
   ```
   JWT_SECRET=<genera_un_secreto_aleatorio>
   GOOGLE_MAPS_API_KEY=<tu_clave_de_google_maps>
   DB_PASSWORD=<genera_una_contraseña_segura>
   VITE_API_URL=https://tu-backend.up.railway.app
   ```

5. **Railway desplegará automáticamente los servicios**

6. **Obtén tus URLs públicas y ¡listo!**

## 📋 Variables de Entorno Necesarias

### Backend
- `JWT_SECRET` - Secreto para JWT (genera uno aleatorio)
- `GOOGLE_MAPS_API_KEY` - Tu clave de API de Google Maps
- `DATABASE_URL` - URL de PostgreSQL (la proporciona el proveedor)
- `ALLOWED_ORIGINS` - URLs permitidas para CORS (separadas por comas)

### Frontend
- `VITE_API_URL` - URL del backend (ej: https://backend.onrender.com)

### Base de Datos (si usas docker-compose)
- `DB_NAME` - Nombre de la base de datos (default: bustracksv)
- `DB_USER` - Usuario de la base de datos
- `DB_PASSWORD` - Contraseña de la base de datos

## 🔧 Comandos Útiles

### Probar localmente con Docker
```bash
# Crear archivo .env en la raíz con las variables necesarias
cp .env.example .env  # Si existe, sino créalo manualmente

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Build manual de imágenes
```bash
# Backend
cd bustracksv/server
docker build -t bustracksv-backend .

# Frontend
cd bustracksv/client
docker build --build-arg VITE_API_URL=http://localhost:4000 -t bustracksv-frontend .
```

## ⚠️ Importante

1. **NUNCA subas archivos `.env` a Git**
2. **Cambia todos los valores por defecto en producción**
3. **Genera un `JWT_SECRET` seguro y aleatorio**
4. **Configura `ALLOWED_ORIGINS` con las URLs reales de tu frontend**
5. **En producción siempre usa PostgreSQL (no SQLite)**

## 📚 Documentación Completa

Para instrucciones detalladas, consulta `GUIA_DEPLOY.md`

## 🎉 ¡Listo!

Tu aplicación ahora está preparada para desplegarse en la nube. Sigue la guía de tu plataforma elegida y tendrás tu link público funcionando.

---

**¿Necesitas ayuda?** Revisa `GUIA_DEPLOY.md` para solución de problemas comunes.



