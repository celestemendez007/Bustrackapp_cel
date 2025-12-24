# Configuración de Google Maps API Key

## Pasos para Configurar la API Key

1. **Crear o editar el archivo `.env` en el directorio `server/`**

   El archivo debe estar ubicado en: `server/.env`

2. **Agregar la siguiente línea al archivo `.env`:**

   ```env
   GOOGLE_MAPS_API_KEY=tu_clave_api_aqui
   ```

3. **Obtener una API Key de Google Maps:**

   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita las siguientes APIs:
     - **Maps JavaScript API** (para el frontend)
     - **Directions API** (para calcular rutas)
     - **Geocoding API** (para convertir direcciones a coordenadas)
   - Crea credenciales (API Key)
   - Restringe la API Key por dominio/IP si es necesario para seguridad

4. **Verificar que la API Key esté cargada:**

   Al iniciar el servidor, deberías ver en la consola:
   ```
   ✅ GOOGLE_MAPS_API_KEY loaded successfully
   ```

   Si ves una advertencia, verifica que:
   - El archivo `.env` existe en `server/`
   - La variable `GOOGLE_MAPS_API_KEY` está definida
   - El valor no es `YOUR_GOOGLE_MAPS_API_KEY_HERE` (valor placeholder)

## Estructura del archivo .env

```env
# Google Maps API Key (Required for Route Generation)
GOOGLE_MAPS_API_KEY=tu_clave_api_real_aqui

# Otras variables de entorno...
PORT=4000
JWT_SECRET=tu_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/bustracksv
```

## Solución de Problemas

### Error: "La clave API de Google Maps no está configurada en el servidor"

1. Verifica que el archivo `.env` existe en `server/`
2. Verifica que la variable `GOOGLE_MAPS_API_KEY` está definida
3. Verifica que el valor no está vacío ni es el placeholder
4. Reinicia el servidor después de modificar `.env`

### Error: "GOOGLE_MAPS_API_KEY not found in environment variables"

- El archivo `.env` no se está cargando correctamente
- Verifica que el archivo está en `server/.env` (no en la raíz del proyecto)
- Verifica que no hay espacios alrededor del `=` en el archivo `.env`

## Notas Importantes

- **NUNCA** subas el archivo `.env` a Git (debe estar en `.gitignore`)
- La API Key debe tener habilitadas las APIs necesarias (Directions, Geocoding)
- Si usas restricciones de API Key, asegúrate de incluir tu dominio/IP












