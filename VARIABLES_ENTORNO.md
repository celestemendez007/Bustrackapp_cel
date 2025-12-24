# 🔐 Variables de Entorno - BusTrackSV

Esta guía lista todas las variables de entorno necesarias para desplegar BusTrackSV.

## 📋 Variables por Servicio

### 🔴 Backend (Servidor)

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `NODE_ENV` | No | Entorno de ejecución | `production` |
| `PORT` | No | Puerto del servidor | `4000` |
| `DATABASE_URL` | **Sí** | URL completa de PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `DB_HOST` | Sí* | Host de PostgreSQL | `postgres` o `localhost` |
| `DB_PORT` | No | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Sí* | Nombre de la base de datos | `bustracksv` |
| `DB_USER` | Sí* | Usuario de PostgreSQL | `bustracksv` |
| `DB_PASSWORD` | Sí* | Contraseña de PostgreSQL | `contraseña_segura` |
| `JWT_SECRET` | **Sí** | Secreto para firmar JWT | Genera uno aleatorio |
| `GOOGLE_MAPS_API_KEY` | **Sí** | Clave API de Google Maps | `AIza...` |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Ruta al archivo Firebase | `/app/config/firebase-key.json` |
| `FIREBASE_PROJECT_ID` | No | ID del proyecto Firebase | `tu-proyecto-id` |
| `ALLOWED_ORIGINS` | No | URLs permitidas para CORS | `https://app.com,https://www.app.com` |

*Requeridas solo si no usas `DATABASE_URL`

### 🔵 Frontend (Cliente)

| Variable | Requerida | Descripción | Cuándo Configurarla |
|----------|-----------|-------------|---------------------|
| `VITE_API_URL` | **Sí** | URL del backend API | **En tiempo de BUILD** (Docker) |

⚠️ **IMPORTANTE:** `VITE_API_URL` debe configurarse **antes del build** de la imagen Docker porque Vite embebe las variables de entorno en tiempo de compilación.

### 🟢 Base de Datos (PostgreSQL)

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `POSTGRES_DB` | No | Nombre de la base de datos | `bustracksv` |
| `POSTGRES_USER` | No | Usuario de PostgreSQL | `bustracksv` |
| `POSTGRES_PASSWORD` | **Sí** | Contraseña de PostgreSQL | `contraseña_segura` |

## 🎯 Configuración por Plataforma

### Render.com

```yaml
# Backend
NODE_ENV: production
PORT: 4000
DATABASE_URL: (automático desde la base de datos)
JWT_SECRET: (genera uno)
GOOGLE_MAPS_API_KEY: (tu clave)
ALLOWED_ORIGINS: https://tu-frontend.onrender.com

# Frontend (Build Command)
VITE_API_URL: https://tu-backend.onrender.com
```

### Railway.app

```bash
# Backend
DATABASE_URL: (automático desde Railway)
JWT_SECRET: (genera uno)
GOOGLE_MAPS_API_KEY: (tu clave)
ALLOWED_ORIGINS: https://tu-frontend.up.railway.app

# Frontend (como Build Arg o Env)
VITE_API_URL: https://tu-backend.up.railway.app
```

### Docker Compose Local

Crea un archivo `.env` en la raíz:

```env
# Base de datos
DB_NAME=bustracksv
DB_USER=bustracksv
DB_PASSWORD=change_me_in_production
DB_PORT=5432

# Backend
JWT_SECRET=change_me_generate_random_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:4000
```

## 🔑 Generar Valores Seguros

### JWT_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### DB_PASSWORD

```bash
# Linux/Mac
openssl rand -base64 24

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
```

## ✅ Checklist de Configuración

Antes de desplegar, verifica que tienes:

- [ ] `JWT_SECRET` generado (aleatorio y seguro)
- [ ] `DB_PASSWORD` generado (aleatorio y seguro)
- [ ] `GOOGLE_MAPS_API_KEY` configurada
- [ ] `DATABASE_URL` o variables `DB_*` configuradas
- [ ] `VITE_API_URL` apuntando a tu backend (para build del frontend)
- [ ] `ALLOWED_ORIGINS` con las URLs correctas del frontend

## 🚨 Errores Comunes

### "Cannot connect to database"
- Verifica que `DATABASE_URL` o las variables `DB_*` estén correctas
- Verifica que el servicio de base de datos esté corriendo
- En algunos proveedores (Render, Railway), la URL se proporciona automáticamente

### "CORS policy error"
- Agrega la URL del frontend a `ALLOWED_ORIGINS`
- Usa HTTPS en producción
- Separa múltiples URLs con comas

### "VITE_API_URL is undefined"
- `VITE_API_URL` debe configurarse **antes del build**
- En Docker, usa `--build-arg VITE_API_URL=...`
- En plataformas cloud, configúralo antes del build o como build arg

### "JWT_SECRET is not set"
- Genera un secreto aleatorio y seguro
- No uses el valor por defecto en producción
- Guárdalo de forma segura (no en Git)

---

**Recuerda:** Nunca subas archivos `.env` con valores reales a Git. Usa las variables de entorno de tu proveedor de nube.

