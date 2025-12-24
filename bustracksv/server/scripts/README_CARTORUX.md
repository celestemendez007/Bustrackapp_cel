# Script de Scraping de Cartorux.com

Este directorio contiene la implementación de la **Fase 1 y Fase 2** del informe técnico para extraer datos de transporte público de cartorux.com.

## Archivos

- `cartorux_schema.sql`: Esquema de base de datos PostgreSQL basado en el informe técnico
- `scrape_cartorux.py`: Script principal de Python para scraping ético
- `requirements_scraping.txt`: Dependencias de Python necesarias

## Instalación

### 1. Instalar dependencias de Python

```bash
pip install -r requirements_scraping.txt
```

### 2. Crear el esquema de base de datos

```bash
# Conectarse a PostgreSQL
psql -U postgres -d bustracksv

# Ejecutar el esquema
\i database/cartorux_schema.sql
```

O desde la línea de comandos:

```bash
psql -U postgres -d bustracksv -f database/cartorux_schema.sql
```

## Uso

### Ejecutar el scraper

```bash
# Uso básico (genera cartorux_data.json)
python scripts/scrape_cartorux.py

# Especificar archivo de salida
python scripts/scrape_cartorux.py -o mi_datos.json

# Ajustar tiempo de espera entre peticiones (más rápido, menos ético)
python scripts/scrape_cartorux.py --delay 1
```

### Parámetros

- `--output, -o`: Archivo JSON de salida (default: `cartorux_data.json`)
- `--delay, -d`: Tiempo de espera entre peticiones en segundos (default: 2)

## Estructura de Datos de Salida

El script genera un archivo JSON con la siguiente estructura:

```json
{
  "metadata": {
    "scraping_date": "2024-01-15T10:30:00",
    "base_url": "https://cartorux.com",
    "total_routes": 150,
    "total_destinations": 45
  },
  "routes": [
    {
      "public_id": "102",
      "department_slug": "san-salvador",
      "origin_text": "Parque Simón Bolívar",
      "destination_text": "Playa El Tunco",
      "base_fare": 1.5,
      "currency": "USD",
      "schedule_start": "06:00",
      "schedule_end": "19:00",
      "frequency_min": 20,
      "vehicle_type": "Bus",
      "raw_content": "...",
      "source_url": "https://cartorux.com/...",
      "content_quality_score": 8,
      "is_validated": true
    }
  ],
  "destinations": [
    {
      "name": "Playa El Tunco",
      "slug": "playa-el-tunco",
      "category": "Playa",
      "department_slug": "la-libertad",
      "description": "...",
      "source_url": "https://cartorux.com/...",
      "content_quality_score": 8,
      "is_validated": true
    }
  ]
}
```

## Características Implementadas

### ✅ Fase 1: Rastreo (Crawling)
- Navegación por los 14 departamentos de El Salvador
- Extracción de enlaces a rutas individuales
- Manejo robusto de errores de conexión
- Tiempos de espera configurables entre peticiones

### ✅ Fase 2: Procesamiento de Lenguaje Natural (NLP) Ligero
- **Extracción de precios**: Regex `/\$(\d+\.?\d*)/`
- **Extracción de horarios**: Regex `/(\d{1,2}:\d{2})\s?(am|pm)/`
- **Extracción de IDs de ruta**: Regex `/(Ruta|Route)\s*(\d+[A-Z]?)/`
- **Extracción de frecuencia**: Regex `/cada\s+(\d+)\s+minutos?/`

### ✅ Validación de Calidad (Sección 3.3)
- Detección de páginas "cascarón" (stubs)
- Validación de contenido mínimo (100 caracteres)
- Detección de frases de error
- Scoring de calidad de contenido (1-10)

## Importar Datos a PostgreSQL

Una vez generado el JSON, puedes importarlo a la base de datos usando un script de importación:

```python
# Ejemplo de script de importación (crear según necesidad)
import json
import psycopg2
from psycopg2.extras import execute_values

# Cargar datos
with open('cartorux_data.json', 'r') as f:
    data = json.load(f)

# Conectar a PostgreSQL
conn = psycopg2.connect("dbname=bustracksv user=postgres")
cur = conn.cursor()

# Insertar rutas
for route in data['routes']:
    # Obtener department_id
    cur.execute("SELECT department_id FROM departments WHERE slug = %s", 
                (route['department_slug'],))
    dept_result = cur.fetchone()
    if dept_result:
        dept_id = dept_result[0]
        # Insertar ruta...
        # (Implementar lógica completa según necesidad)

conn.commit()
cur.close()
conn.close()
```

## Consideraciones Éticas y Legales

1. **Respeto a tiempos de espera**: El script incluye delays entre peticiones (default: 2 segundos)
2. **User-Agent identificable**: El script se identifica como bot
3. **Manejo de errores**: No satura el servidor con reintentos agresivos
4. **Propiedad intelectual**: El script extrae solo datos factuales (precios, horarios, rutas), no contenido creativo

## Logs

El script genera logs en:
- Consola (stdout)
- Archivo: `cartorux_scraping.log`

## Troubleshooting

### Error: "Connection timeout"
- Verificar conectividad a internet
- Aumentar `TIMEOUT` en el script
- Verificar que cartorux.com esté accesible

### Páginas vacías detectadas
- Esto es esperado según el informe técnico (Sección 3.3)
- Las páginas "cascarón" se marcan con `is_validated: false`
- Revisar `content_quality_score` para filtrar datos válidos

### No se encuentran rutas
- Verificar que la estructura HTML del sitio no haya cambiado
- Ajustar los selectores CSS en `find_route_links()`
- Considerar usar Playwright si el sitio es dinámico (JavaScript)

## Próximos Pasos (Fase 3)

- Enriquecimiento geográfico con APIs de geocoding
- Reconstrucción de geometrías de rutas usando Google Directions API
- Integración con sistema de reportes de usuarios (crowdsourcing)


