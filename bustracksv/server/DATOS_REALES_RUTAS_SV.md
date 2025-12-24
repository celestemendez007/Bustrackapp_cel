# 📍 Datos Reales de Rutas de Buses de San Salvador

Este documento explica cómo obtener e importar datos reales de rutas de buses del Área Metropolitana de San Salvador.

## 🌐 Fuente de Datos

Los datos provienen del **Viceministerio de Transporte de El Salvador** y están disponibles a través de [Alfa Geomatics](https://alfageomatics.com/2020/03/descarga-y-consulta-de-rutas-de-buses-en-san-salvador/).

## 📥 Opciones para Obtener los Datos

### Opción 1: Usar el Script de Importación Incluido (Recomendado)

Ya hemos preparado un script con datos reales de 27 rutas y 35 paradas del AMSS.

```bash
# Desde la carpeta server/
node import-real-data.js
```

Este script importará:
- ✅ **27 rutas** principales de buses y microbuses
- ✅ **35 paradas** estratégicas del área metropolitana
- ✅ **Relaciones completas** entre rutas y paradas con tiempos estimados

### Opción 2: Descargar el GeoPackage Original

Si deseas trabajar con los datos geográficos completos:

#### Paso 1: Descargar el Archivo GeoPackage

Visita el enlace y descarga el archivo GeoPackage:
- 🔗 **Enlace directo**: Los archivos están disponibles en el repositorio mencionado en el artículo
- 📦 **Formato**: GeoPackage (.gpkg)
- 📏 **Tamaño**: Ligero y optimizado

#### Paso 2: Visualizar los Datos

Puedes visualizar los datos con:
- **QGIS** (gratuito y open source): https://qgis.org/
- **Mapa Web de Alfa Geomatics**: Ver en el enlace original

#### Paso 3: Extraer Coordenadas

Si quieres extraer coordenadas específicas del GeoPackage:

```bash
# Instalar ogr2ogr (parte de GDAL)
# Windows: Descargar desde OSGeo4W
# Linux: sudo apt-get install gdal-bin
# Mac: brew install gdal

# Convertir a GeoJSON
ogr2ogr -f GeoJSON rutas.geojson rutas.gpkg

# Convertir a CSV con coordenadas
ogr2ogr -f CSV -lco GEOMETRY=AS_WKT paradas.csv paradas.gpkg
```

### Opción 3: Servidor WFS (Puede no estar disponible)

```javascript
// URL del servidor WFS de Alfa Geomatics
const WFS_URL = 'http://54.175.74.70:8080/geoserver/TP_AMSS/ows?version=2.0.0';

// Nota: Este servidor requiere costos de mantenimiento y puede no estar activo
```

### Opción 4: Conexión Directa a ESRI ArcGIS

```javascript
const ESRI_URL = 'https://services9.arcgis.com/4ZwMO9wShTnUDuWy/ArcGIS/rest/services/';
```

## 📊 Datos Incluidos en el Script

### Rutas Principales

| Número | Nombre | Tipo | Tarifa |
|--------|--------|------|--------|
| 1 | Terminal Centro - Soyapango | Bus | $0.25 |
| 2 | Terminal Centro - Santa Tecla | Bus | $0.25 |
| 7-B | Mejicanos - Santa Tecla | Bus | $0.25 |
| 9 | Terminal Oriente - Plaza Mundo | Bus | $0.25 |
| 11 | Centro - Zona Rosa - Multiplaza | Bus | $0.25 |
| 101-A/B/C/D | Terminal Occidente - UES (variantes) | Microbus | $0.30 |
| 30-A/B/C | Soyapango - Centro (variantes) | Bus | $0.25-$0.30 |
| 44 | Apopa - Centro | Bus | $0.30 |
| 52 | Terminal Oriente - Hospital Rosales | Bus | $0.25 |
| 16 | Ciudad Delgado - Centro | Microbus | $0.30 |
| 4 | Ilopango - Centro | Bus | $0.30 |
| 29 | Santa Tecla - Soyapango | Bus | $0.35 |
| Y más... | Total: 27 rutas | - | - |

### Paradas Principales

- **Terminales**: Centro, Occidente, Oriente, Soyapango, Santa Tecla
- **Hospitales**: Rosales, Bloom, Militar
- **Universidades**: UES, UCA, Don Bosco
- **Centros Comerciales**: Metrocentro, Plaza Mundo, Multiplaza, Galerías, Zona Rosa
- **Municipios**: Mejicanos, Apopa, Ilopango, Ciudad Delgado, Cuscatancingo, Santa Tecla, Antiguo Cuscatlán

## 🚀 Uso del Script

### Importar Datos

```bash
cd server
node import-real-data.js
```

### Verificar Importación

```bash
# Iniciar el servidor
npm start

# Luego probar los endpoints:
# GET http://localhost:4000/api/rutas
# GET http://localhost:4000/api/paradas
# GET http://localhost:4000/api/rutas/1/paradas
```

## 📱 Características de los Datos

### Información de Rutas

- ✅ Número de ruta oficial
- ✅ Nombre descriptivo
- ✅ Empresa operadora
- ✅ Tipo (Bus/Microbus)
- ✅ Tarifa actual
- ✅ Horarios de operación
- ✅ Frecuencia de paso
- ✅ Color identificativo

### Información de Paradas

- ✅ Código único
- ✅ Nombre de la parada
- ✅ Coordenadas GPS exactas (lat/lng)
- ✅ Dirección completa
- ✅ Zona/Municipio
- ✅ Tipo (Regular/Terminal/TransferHub)
- ✅ Infraestructura (techo, asientos, accesibilidad)

### Conexiones Ruta-Parada

- ✅ Orden de paradas en la ruta
- ✅ Tiempo estimado entre paradas
- ✅ Dirección (ida/vuelta)

## 🗺️ Cobertura Geográfica

Los datos cubren el **Área Metropolitana de San Salvador (AMSS)**:

- San Salvador
- Soyapango
- Mejicanos
- Santa Tecla
- Apopa
- Ciudad Delgado
- Cuscatancingo
- Ilopango
- Antiguo Cuscatlán

## 📚 Referencias

- **Fuente Original**: [Alfa Geomatics - Rutas de Buses San Salvador](https://alfageomatics.com/2020/03/descarga-y-consulta-de-rutas-de-buses-en-san-salvador/)
- **Datos del Gobierno**: Viceministerio de Transporte de El Salvador
- **Formato**: GeoPackage (interoperable y open source)
- **Proyección**: WGS84 (EPSG:4326)

## 🔄 Actualizar Datos

Para actualizar los datos en el futuro:

1. Visitar el geoportal del Viceministerio de Transporte
2. Descargar la última versión del GeoPackage
3. Actualizar los arrays en `import-real-data.js`
4. Ejecutar el script de importación

## ⚠️ Notas Importantes

- Los datos están basados en información oficial pero pueden variar
- Las rutas pueden cambiar recorridos según necesidades operativas
- Las tarifas pueden actualizarse por el gobierno
- Los horarios son aproximados y pueden variar según la empresa

## 🤝 Contribuir

Si tienes información actualizada sobre rutas, paradas o correcciones:

1. Verifica la fuente oficial
2. Actualiza los datos en `import-real-data.js`
3. Documenta los cambios
4. Ejecuta el script para validar

## 📞 Contacto

Para más información sobre las rutas oficiales:
- **VMT**: Viceministerio de Transporte de El Salvador
- **AMSS**: Área Metropolitana de San Salvador

---

**Última actualización**: Octubre 2024
**Datos basados en**: Viceministerio de Transporte - AMSS

