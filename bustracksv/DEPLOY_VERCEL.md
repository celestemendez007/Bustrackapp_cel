# 🚀 Desplegar BusTrackSV a Vercel (Acceso Global)

## ¿Por qué Vercel?

- ✅ **Gratis** para proyectos personales
- ✅ **Accesible desde cualquier parte del mundo**
- ✅ **SSL automático** (HTTPS)
- ✅ **Auto-scaling** automático
- ✅ **Deploy en 2 minutos**

## Pasos Rápidos

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login en Vercel

```bash
vercel login
```

### 3. Deploy del Backend

```bash
cd bustracksv/server
vercel
```

Sigue las instrucciones:
- ¿Set up and deploy? **Y**
- ¿Which scope? (elige tu cuenta)
- ¿Link to existing project? **N**
- ¿Project name? **bustracksv-api** (o el que quieras)
- ¿Directory? **./**
- ¿Override settings? **N**

### 4. Configurar Variables de Entorno

Después del primer deploy, ve a:
- https://vercel.com/dashboard
- Selecciona tu proyecto
- Settings → Environment Variables

Agrega estas variables:

```env
# Base de datos (si usas Supabase)
DATABASE_URL=postgresql://...

# O si usas SQLite local, no necesitas nada (pero mejor usa Supabase)

# JWT Secret
JWT_SECRET=tu_secret_super_seguro_minimo_32_caracteres

# Google Maps API Key
GOOGLE_MAPS_API_KEY=tu_key

# CORS - URL de tu frontend
ALLOWED_ORIGINS=https://tu-frontend.vercel.app

# Redis (opcional)
REDIS_URL=redis://...
```

### 5. Redeploy

```bash
vercel --prod
```

### 6. Obtener URL de tu API

Después del deploy, Vercel te dará una URL como:
```
https://bustracksv-api.vercel.app
```

**¡Copia esta URL!**

### 7. Configurar Frontend

```bash
cd bustracksv/client
```

Crea o edita `.env.production`:
```env
VITE_API_URL=https://bustracksv-api.vercel.app
```

### 8. Deploy del Frontend

```bash
cd bustracksv/client
vercel
```

Sigue las mismas instrucciones, pero el nombre del proyecto puede ser `bustracksv` o `bustracksv-web`.

### 9. ¡Listo!

Tu aplicación estará disponible en:
- **Frontend**: `https://bustracksv.vercel.app`
- **Backend**: `https://bustracksv-api.vercel.app`

Y será accesible desde **cualquier parte del mundo** 🌍

## Alternativa Rápida: ngrok (Solo para pruebas)

Si solo quieres probar rápido sin deploy:

### 1. Instalar ngrok
- Descarga de: https://ngrok.com/download
- O con: `choco install ngrok` (si tienes Chocolatey)

### 2. Iniciar servidor con ngrok
```bash
cd bustracksv/server
# En una terminal:
node src/index.js

# En otra terminal:
ngrok http 4000
```

### 3. Copiar URL pública
ngrok te dará una URL como: `https://xxxx.ngrok.io`

### 4. Actualizar frontend
En `client/.env.local`:
```env
VITE_API_URL=https://xxxx.ngrok.io
```

⚠️ **Nota**: La URL de ngrok cambia cada vez que lo reinicias (a menos que tengas cuenta paga).

## Recomendación

Para producción, usa **Vercel**. Es gratis, estable y profesional.

Para pruebas rápidas, usa **ngrok**.




