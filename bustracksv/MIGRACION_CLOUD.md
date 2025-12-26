# 🚀 Guía de Migración a la Nube - BusTrackSV

## 📋 Resumen de Cambios

Esta guía te ayudará a migrar BusTrackSV de un entorno local a una infraestructura cloud escalable capaz de soportar **+1,000,000 de usuarios**.

## 🏗️ Arquitectura Propuesta

```
┌─────────────────┐
│   Frontend      │  Vercel / Netlify
│   (React/Vite)  │  CDN Global
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   API Gateway   │  Vercel Functions / AWS Lambda
│   (Serverless)  │  Auto-scaling
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│PostgreSQL│ │ Redis  │
│(Supabase)│ │(Upstash)│
│         │ │ Cache  │
└────────┘ └────────┘
```

## 📦 Servicios Cloud Recomendados

### 1. Base de Datos: **Supabase** (Recomendado)
- ✅ PostgreSQL gestionado
- ✅ PostGIS incluido (para funciones geoespaciales)
- ✅ Connection pooling automático
- ✅ Backups automáticos
- ✅ Plan gratuito generoso
- ✅ Alternativa: AWS RDS PostgreSQL

### 2. Caché: **Upstash Redis** (Recomendado)
- ✅ Redis serverless
- ✅ Plan gratuito generoso
- ✅ Auto-scaling
- ✅ Alternativa: AWS ElastiCache, Redis Cloud

### 3. Backend: **Vercel** (Recomendado)
- ✅ Serverless Functions
- ✅ Auto-scaling automático
- ✅ CDN global
- ✅ SSL automático
- ✅ Alternativa: AWS Lambda, Netlify Functions

### 4. Frontend: **Vercel** (Recomendado)
- ✅ Deploy automático desde Git
- ✅ CDN global
- ✅ SSL automático
- ✅ Alternativa: Netlify, AWS CloudFront + S3

## 🔧 Pasos de Migración

### Paso 1: Configurar Supabase (Base de Datos)

1. **Crear cuenta en Supabase**: https://supabase.com
2. **Crear nuevo proyecto**
3. **Obtener credenciales**:
   - Ve a Settings → Database
   - Copia la "Connection string" (URI)
   - O usa: Host, Port, Database, User, Password

4. **Ejecutar script de inicialización**:
   ```bash
   # Conecta a tu base de datos Supabase usando psql o el SQL Editor
   psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   
   # O usa el SQL Editor en Supabase Dashboard
   # Ejecuta el contenido de: server/database/init.sql
   ```

5. **Configurar variables de entorno**:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
   # O individualmente:
   DB_HOST=db.xxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=tu_password
   DB_SSL=true
   ```

### Paso 2: Configurar Upstash Redis (Caché)

1. **Crear cuenta en Upstash**: https://upstash.com
2. **Crear nueva base de datos Redis**
3. **Obtener credenciales**:
   - Copia la "REST URL" o "Redis URL"

4. **Configurar variables de entorno**:
   ```env
   REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
   # O individualmente:
   REDIS_HOST=xxxxx.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=tu_password
   ```

### Paso 3: Migrar Datos de SQLite a PostgreSQL

1. **Instalar dependencias**:
   ```bash
   cd server
   npm install
   ```

2. **Configurar .env con credenciales de Supabase**

3. **Ejecutar script de migración**:
   ```bash
   node scripts/migrate-sqlite-to-postgres.js
   ```

4. **Verificar migración**:
   - Revisa las tablas en Supabase Dashboard
   - Verifica que los datos se migraron correctamente

### Paso 4: Actualizar Código del Backend

1. **Cambiar db.js a db-cloud.js**:
   ```bash
   # En server/src/index.js, cambia:
   # import { pool } from './db.js';
   # Por:
   import { pool } from './db-cloud.js';
   ```

2. **Agregar middleware de seguridad**:
   ```javascript
   // En server/src/index.js
   import { corsConfig, helmetConfig, rateLimiters } from './middleware/security.js';
   import { initRedis } from './cache/redis.js';
   
   // Reemplazar app.use(cors()) con:
   app.use(corsConfig);
   app.use(helmetConfig);
   app.use(rateLimiters.general);
   ```

3. **Integrar caché Redis**:
   ```javascript
   // Inicializar Redis al inicio
   await initRedis();
   
   // Usar caché en endpoints de rutas
   import { routeCache } from './cache/redis.js';
   
   app.get('/api/rutas', async (req, res) => {
     // Intentar obtener del caché
     const cached = await routeCache.getRoutes();
     if (cached) {
       return res.json(cached);
     }
     
     // Si no está en caché, obtener de DB
     const result = await pool.query('SELECT * FROM rutas WHERE activa = TRUE');
     const routes = result.rows;
     
     // Guardar en caché
     await routeCache.setRoutes(routes);
     
     res.json(routes);
   });
   ```

### Paso 5: Configurar Vercel para Backend

1. **Instalar Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Inicializar proyecto**:
   ```bash
   cd server
   vercel
   ```

3. **Configurar variables de entorno en Vercel**:
   - Ve a tu proyecto en Vercel Dashboard
   - Settings → Environment Variables
   - Agrega todas las variables de `.env.production.example`

4. **Actualizar vercel.json** si es necesario

5. **Deploy**:
   ```bash
   vercel --prod
   ```

### Paso 6: Configurar Frontend

1. **Actualizar API URL en cliente**:
   ```bash
   cd client
   # Crear .env.production
   echo "VITE_API_URL=https://tu-api.vercel.app" > .env.production
   ```

2. **Deploy frontend a Vercel**:
   ```bash
   cd client
   vercel
   ```

3. **Configurar variables de entorno en Vercel**:
   - `VITE_API_URL`: URL de tu backend en Vercel

## 📝 Archivos a Modificar/Crear

### Archivos Nuevos Creados:
- ✅ `server/src/db-cloud.js` - Conexión PostgreSQL optimizada
- ✅ `server/src/cache/redis.js` - Capa de caché Redis
- ✅ `server/src/middleware/security.js` - CORS, seguridad, rate limiting
- ✅ `server/vercel.json` - Configuración Vercel
- ✅ `server/api/index.js` - Entry point para Vercel
- ✅ `server/scripts/migrate-sqlite-to-postgres.js` - Script de migración
- ✅ `server/.env.production.example` - Template de variables de entorno

### Archivos a Modificar:
- ⚠️ `server/src/index.js` - Cambiar import de db.js a db-cloud.js
- ⚠️ `server/src/index.js` - Agregar middleware de seguridad
- ⚠️ `server/src/index.js` - Integrar caché Redis en endpoints
- ⚠️ `server/package.json` - Agregar dependencias: `redis`, `helmet`, `express-rate-limit`

## 📦 Dependencias a Instalar

```bash
cd server
npm install redis helmet express-rate-limit
```

## 🔒 Seguridad

### Variables de Entorno Críticas:
- ✅ `JWT_SECRET` - Debe ser mínimo 32 caracteres aleatorios
- ✅ `DATABASE_URL` - Credenciales de base de datos
- ✅ `REDIS_URL` - Credenciales de Redis
- ✅ `ALLOWED_ORIGINS` - Orígenes permitidos para CORS

### Generar JWT Secret:
```bash
openssl rand -base64 32
```

## 🚀 Optimizaciones Implementadas

### 1. Base de Datos:
- ✅ Connection pooling (máx 20 conexiones)
- ✅ Índices geoespaciales (GIST) para búsquedas rápidas
- ✅ Índices en columnas frecuentemente consultadas
- ✅ PostGIS para funciones geoespaciales nativas

### 2. Caché:
- ✅ Rutas activas: TTL 1 hora
- ✅ Paradas cercanas: TTL 15 minutos
- ✅ Búsquedas: TTL 30 minutos
- ✅ Invalidación automática al actualizar datos

### 3. API:
- ✅ Rate limiting por tipo de endpoint
- ✅ CORS configurado para acceso global
- ✅ Headers de seguridad (Helmet)
- ✅ Request ID para debugging
- ✅ Logging estructurado

## 📊 Monitoreo y Escalabilidad

### Métricas a Monitorear:
- Conexiones a base de datos
- Uso de caché (hit rate)
- Tiempo de respuesta de endpoints
- Errores y excepciones
- Uso de recursos (CPU, memoria)

### Escalabilidad:
- **Backend**: Auto-scaling con Vercel Functions
- **Base de Datos**: Supabase escala automáticamente
- **Caché**: Upstash escala según demanda
- **CDN**: Vercel CDN global para frontend

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verifica `DATABASE_URL` o credenciales individuales
- Verifica que Supabase permita conexiones desde tu IP
- Verifica SSL mode

### Error: "Redis connection failed"
- Verifica `REDIS_URL` o credenciales
- La app funcionará sin Redis (solo será más lenta)

### Error: "CORS policy"
- Verifica `ALLOWED_ORIGINS` en variables de entorno
- Asegúrate de incluir el dominio de tu frontend

## 📚 Recursos Adicionales

- [Supabase Docs](https://supabase.com/docs)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Vercel Docs](https://vercel.com/docs)
- [PostGIS Docs](https://postgis.net/documentation/)

## ✅ Checklist de Migración

- [ ] Crear cuenta en Supabase y configurar base de datos
- [ ] Crear cuenta en Upstash y configurar Redis
- [ ] Ejecutar script de migración de datos
- [ ] Actualizar código del backend
- [ ] Instalar dependencias nuevas
- [ ] Configurar variables de entorno
- [ ] Deploy backend a Vercel
- [ ] Deploy frontend a Vercel
- [ ] Probar endpoints críticos
- [ ] Configurar monitoreo (opcional)
- [ ] Documentar URLs de producción

---

**¿Necesitas ayuda?** Revisa los logs en Vercel Dashboard o Supabase Dashboard para más detalles.




