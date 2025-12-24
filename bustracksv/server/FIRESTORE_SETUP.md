# 🔥 Google Cloud Firestore Setup Guide

Esta guía te ayudará a configurar Google Cloud Firestore para almacenar las coordenadas geográficas de las rutas de autobuses.

## 📦 Instalación de Dependencias

```bash
npm install firebase-admin
npm install --save-dev typescript @types/node tsx
```

## 🔐 Configuración de Credenciales

### Opción 1: Archivo de Credenciales (Recomendado para desarrollo local)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **IAM & Admin** > **Service Accounts**
4. Crea una nueva cuenta de servicio o usa una existente
5. Haz clic en la cuenta de servicio y ve a **Keys**
6. Crea una nueva clave JSON
7. Descarga el archivo JSON
8. Colócalo en una ubicación segura (ej: `server/config/firebase-key.json`)
9. Agrega la ruta al archivo `.env`:

```env
GOOGLE_APPLICATION_CREDENTIALS=./config/firebase-key.json
FIREBASE_PROJECT_ID=tu-proyecto-id
```

**⚠️ IMPORTANTE:** Agrega `firebase-key.json` a `.gitignore` para no subir las credenciales al repositorio.

### Opción 2: Variable de Entorno JSON (Recomendado para producción)

1. Obtén el contenido del archivo JSON de credenciales
2. Conviértelo a una sola línea (sin saltos de línea)
3. Agrega al archivo `.env`:

```env
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
FIREBASE_PROJECT_ID=tu-proyecto-id
```

## 🗄️ Estructura de Datos en Firestore

### Colección: `routes`

Cada documento representa una ruta de autobús:

```typescript
{
  routeId: "ruta-26",
  name: "Ruta 26 - San Marcos a Miralvalle",
  coordinates: [
    { lat: 13.6500, lng: -89.1833 },
    { lat: 13.6520, lng: -89.1850 },
    // ... más coordenadas
  ],
  coordinateCount: 25,
  bounds: {
    north: 13.7040,
    south: 13.6500,
    east: -89.1833,
    west: -89.2320
  },
  metadata: {
    description: "Descripción de la ruta...",
    company: "Transporte Colectivo",
    routeNumber: "26",
    type: "Microbus",
    active: true,
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
}
```

## 🚀 Uso

### Ejecutar el Script de Prueba

```bash
npm run test:firestore
```

Este script:
1. Inicializa Firebase Admin
2. Prueba la conexión a Firestore
3. Sube los datos de la Ruta 26
4. Verifica que se guardó correctamente

### Usar en el Código

```typescript
import { saveBusRoute, getBusRoute } from './src/services/routeService.js';
import { initializeFirebase } from './src/config/firebase.js';

// Inicializar Firebase (solo una vez al inicio de la app)
initializeFirebase();

// Guardar una ruta
const routeData = {
  routeId: 'ruta-26',
  name: 'Ruta 26',
  coordinates: [
    { lat: 13.6500, lng: -89.1833 },
    // ... más coordenadas
  ],
  metadata: {
    description: 'Descripción...',
    company: 'Transporte Colectivo',
    routeNumber: '26',
    type: 'Microbus',
    active: true
  }
};

await saveBusRoute(routeData);

// Obtener una ruta
const route = await getBusRoute('ruta-26');
console.log(route);
```

## 📊 Consideraciones de Rendimiento

### Para Alta Demanda:

1. **Batch Writes**: Usa `saveMultipleBusRoutes()` para guardar múltiples rutas eficientemente
2. **Índices**: Firestore crea índices automáticamente, pero puedes crear índices compuestos para búsquedas complejas
3. **Límites**:
   - Máximo 500 operaciones por batch
   - Máximo 1MB por documento
   - Máximo 20,000 coordenadas por documento (recomendado: < 10,000)

### Optimizaciones Implementadas:

- ✅ Todas las coordenadas en un solo documento (lectura eficiente)
- ✅ Bounds calculados para búsquedas geográficas rápidas
- ✅ Contador de coordenadas para validaciones rápidas
- ✅ Batch writes para operaciones masivas
- ✅ Validación de datos antes de escribir

## 🔍 Búsquedas Geográficas

Puedes usar los `bounds` para búsquedas eficientes:

```typescript
// Buscar rutas que pasen por un área específica
const db = getFirestoreInstance();
const routes = await db.collection('routes')
  .where('bounds.north', '>=', targetLat)
  .where('bounds.south', '<=', targetLat)
  .where('bounds.east', '>=', targetLng)
  .where('bounds.west', '<=', targetLng)
  .get();
```

## 🛡️ Seguridad

1. **Nunca subas credenciales al repositorio**
2. Usa variables de entorno para todas las configuraciones sensibles
3. Restringe los permisos de la cuenta de servicio solo a Firestore
4. Usa reglas de seguridad de Firestore para proteger los datos

## 📝 Notas Adicionales

- El proyecto usa TypeScript pero puede compilarse a JavaScript
- Los archivos TypeScript se pueden ejecutar directamente con `tsx`
- Para producción, compila con `npm run build:ts`

