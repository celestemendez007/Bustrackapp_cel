# 🤖 Sistema de IA para Procesamiento de Rutas

## 📋 Descripción

Sistema de inteligencia artificial que procesa descripciones detalladas de rutas en lenguaje natural y las convierte en coordenadas geográficas, aprendiendo y mejorando con cada uso.

## 🎯 Características

### ✅ **Procesamiento de Lenguaje Natural**

El sistema puede entender descripciones como:

```
Zona Sur: El Origen (San Marcos)
El microbús inicia su recorrido en las zonas populares de San Marcos.
Colonia 10 de Octubre: Punto de despacho habitual.
Colonia El Tránsito: Recorre las calles principales de San Marcos.
Terminal del Sur: Pasa justo enfrente o por el costado.
```

### ✅ **Extracción Inteligente de Lugares**

- Reconoce lugares conocidos (base de conocimiento inicial)
- Extrae lugares de contexto ("las zonas populares de San Marcos")
- Identifica calles, avenidas, colonias, barrios
- Entiende relaciones espaciales ("cerca de", "frente a", "pasa por")

### ✅ **Sistema de Entrenamiento**

- **Aprende de cada uso**: Guarda lugares encontrados exitosamente
- **Mejora con el tiempo**: Lugares más usados tienen mayor prioridad
- **Guarda ejemplos**: Almacena descripciones exitosas para aprendizaje futuro
- **Base de conocimiento creciente**: Se expande automáticamente

## 🏗️ Arquitectura

### **Backend (Node.js)**

1. **RouteParser Service** (`server/src/services/routeParser.js`):
   - Procesa texto descriptivo
   - Extrae lugares usando patrones y conocimiento aprendido
   - Se entrena guardando ejemplos exitosos

2. **Endpoints**:
   - `POST /admin/route-from-text`: Procesamiento simple
   - `POST /admin/route-from-description`: Procesamiento avanzado con IA

3. **Base de Datos**:
   - `lugares_aprendidos`: Lugares que el sistema ha aprendido
   - `ejemplos_entrenamiento`: Ejemplos de descripciones procesadas

### **Frontend (React)**

- Componente `RouteGeometryEditor.jsx`:
  - Campo de texto para descripciones
  - Modo simple y modo avanzado (IA)
  - Visualización en mapa
  - Muestra lugares encontrados

## 📊 Base de Conocimiento

### **Lugares Conocidos Inicialmente**

El sistema incluye conocimiento inicial sobre:
- Zonas y colonias de San Salvador
- Calles y avenidas principales
- Hospitales, terminales, parques
- Puntos de referencia importantes

### **Lugares Aprendidos**

Cada vez que el sistema encuentra un lugar exitosamente:
- Se guarda en `lugares_aprendidos`
- Se incrementa su contador de uso
- Se mejora su precisión
- Se carga automáticamente en futuras búsquedas

## 🔄 Proceso de Entrenamiento

### **1. Procesamiento Inicial**

```
Usuario escribe descripción
    ↓
Sistema extrae lugares
    ↓
Geocoding (buscar coordenadas)
    ↓
Routing (calcular ruta)
    ↓
Resultado exitoso
```

### **2. Aprendizaje**

```
Resultado exitoso
    ↓
Guardar lugares encontrados
    ↓
Guardar ejemplo de entrenamiento
    ↓
Incrementar contador de uso
    ↓
Mejorar precisión
```

### **3. Mejora Continua**

- Lugares más usados tienen mayor prioridad
- El sistema reconoce mejor patrones comunes
- Se adapta a descripciones similares

## 💡 Cómo Usar

### **Modo Simple**

Para descripciones simples:
```
"Metrocentro, Boulevard de los Héroes, Soyapango"
```

### **Modo Avanzado (IA)**

Para descripciones detalladas:
```
"Zona Sur: El Origen (San Marcos)
El microbús inicia su recorrido en las zonas populares de San Marcos.
Colonia 10 de Octubre: Punto de despacho habitual.
Colonia El Tránsito: Recorre las calles principales..."
```

## 🎓 Ejemplos de Entrenamiento

El sistema aprende de ejemplos como:

1. **Descripción detallada con secciones**
2. **Múltiples puntos de referencia**
3. **Contexto espacial** ("pasa por", "cerca de")
4. **Relaciones entre lugares**

## 📈 Mejoras Futuras

### **Fase 1 (Actual)**
- ✅ Extracción básica de lugares
- ✅ Base de conocimiento inicial
- ✅ Sistema de aprendizaje básico

### **Fase 2 (Próximamente)**
- 🔄 Análisis de patrones en ejemplos exitosos
- 🔄 Sugerencias automáticas de lugares
- 🔄 Corrección automática de errores comunes

### **Fase 3 (Futuro)**
- 🔄 Integración con LLM (OpenAI, etc.) para mejor comprensión
- 🔄 Aprendizaje de relaciones espaciales
- 🔄 Predicción de rutas basada en historial

## 🔧 Configuración

### **Base de Conocimiento Inicial**

Edita `server/src/services/routeParser.js` para agregar lugares conocidos:

```javascript
this.lugaresConocidos = {
  'nuevo lugar': {
    tipo: 'tipo',
    busqueda: 'Búsqueda para geocoding'
  }
}
```

### **Ver Lugares Aprendidos**

Los lugares aprendidos se guardan en la tabla `lugares_aprendidos` de la base de datos.

## 📝 Notas Técnicas

- **Geocoding**: Usa Nominatim (OpenStreetMap) - gratuito, requiere rate limiting
- **Routing**: Usa OSRM - gratuito, open source
- **Almacenamiento**: SQLite local
- **Procesamiento**: Todo en el backend para seguridad

## ✅ Estado Actual

- ✅ Sistema de extracción de lugares funcionando
- ✅ Base de conocimiento inicial con 30+ lugares
- ✅ Sistema de aprendizaje básico implementado
- ✅ Guardado de ejemplos de entrenamiento
- ✅ Mejora continua con cada uso

**El sistema se entrena automáticamente cada vez que procesas una ruta exitosamente.** 🚀





