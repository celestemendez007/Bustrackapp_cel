# 📋 Instrucciones para Diagnosticar Rutas

## 🔍 Cómo Verificar el Estado de una Ruta

### Opción 1: Usar el Endpoint de Diagnóstico (RECOMENDADO)

Accede a este endpoint en tu navegador o con Postman:

```
https://tu-backend-url.onrender.com/api/debug/ruta/:id
```

Reemplaza `:id` con el ID de tu ruta. Por ejemplo:
```
https://bustracksv-backend.onrender.com/api/debug/ruta/1
```

Este endpoint te mostrará:
- ✅ Si la ruta está activa
- ✅ Cuántos puntos tiene guardados en `puntos_ruta`
- ✅ Si está en el grafo (puede ser recomendada)
- ✅ Problemas encontrados

### Opción 2: Ver el Grafo Completo

Accede a:
```
https://tu-backend-url.onrender.com/api/debug/grafo
```

Esto te mostrará todas las rutas que están en el grafo y cuántos nodos tiene cada una.

---

## 🗄️ Cómo Acceder a la Base de Datos en Render

### Paso 1: Acceder a Render Dashboard
1. Ve a [render.com](https://render.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto

### Paso 2: Acceder a PostgreSQL
1. En el dashboard, busca tu servicio de **PostgreSQL**
2. Haz clic en él
3. Ve a la pestaña **"Info"** o **"Connections"**
4. Copia la **"Internal Database URL"** o **"External Database URL"**

### Paso 3: Conectarte a la Base de Datos

#### Opción A: Usar psql (línea de comandos)
```bash
psql "postgresql://usuario:password@host:puerto/database"
```

#### Opción B: Usar pgAdmin o DBeaver
- Usa la URL de conexión que copiaste
- Conecta usando las credenciales de Render

#### Opción C: Usar el Query Editor de Render
1. En el dashboard de PostgreSQL, busca **"Query Editor"** o **"Connect"**
2. Render tiene un editor SQL integrado

### Paso 4: Ejecutar Consultas

#### Verificar si una ruta está activa:
```sql
SELECT id, numero_ruta, nombre, activa 
FROM rutas 
WHERE id = 1;  -- Reemplaza 1 con el ID de tu ruta
```

#### Verificar puntos guardados:
```sql
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE tipo = 'ida') as ida,
       COUNT(*) FILTER (WHERE tipo = 'regreso') as regreso
FROM puntos_ruta 
WHERE ruta_id = 1;  -- Reemplaza 1 con el ID de tu ruta
```

#### Ver todas las rutas activas:
```sql
SELECT id, numero_ruta, nombre, activa 
FROM rutas 
WHERE activa = 1;
```

#### Ver todas las rutas con sus puntos:
```sql
SELECT r.id, r.numero_ruta, r.nombre, r.activa,
       COUNT(pr.id) as total_puntos
FROM rutas r
LEFT JOIN puntos_ruta pr ON r.id = pr.ruta_id
GROUP BY r.id, r.numero_ruta, r.nombre, r.activa
ORDER BY r.id;
```

---

## 📊 Cómo Ver los Logs de la Aplicación en Render

### Paso 1: Acceder a los Logs
1. Ve a [render.com](https://render.com)
2. Inicia sesión
3. Selecciona tu servicio **Backend** (no PostgreSQL)
4. Haz clic en la pestaña **"Logs"** (NO "PostgreSQL Logs")

### Paso 2: Buscar Logs Específicos

Cuando buscas una ruta, deberías ver logs como:

```
🔍 Búsqueda de ruta solicitada: { latA: ..., lngA: ..., latB: ..., lngB: ... }
🔨 Construyendo grafo de rutas...
📊 Rutas activas encontradas: X
📍 Puntos de ruta encontrados: X
✅ Grafo construido: X nodos
🔍 ========== INICIANDO BÚSQUEDA GRAFO ==========
📍 Origen: ...
📍 Destino: ...
📊 Estado del grafo: X nodos, Y rutas
```

### Paso 3: Filtrar Logs

En Render puedes:
- **Buscar** por texto (ej: "Construyendo grafo")
- **Filtrar** por nivel (INFO, ERROR, etc.)
- **Descargar** los logs

---

## ✅ Checklist de Verificación

Cuando una ruta no se recomienda, verifica:

- [ ] **Ruta activa**: `activa = 1` en la tabla `rutas`
- [ ] **Puntos guardados**: Hay registros en `puntos_ruta` para esa ruta
- [ ] **En el grafo**: La ruta aparece en `/api/debug/grafo`
- [ ] **Logs sin errores**: No hay errores en los logs cuando se busca

---

## 🐛 Problemas Comunes

### Problema: "No se encontraron rutas"

**Solución:**
1. Verifica que la ruta esté activa: `UPDATE rutas SET activa = 1 WHERE id = X;`
2. Verifica que tenga puntos: Usa `/api/debug/ruta/:id`
3. Espera 30 segundos (el grafo se reconstruye cada 30s)

### Problema: "Ruta no está en el grafo"

**Solución:**
1. Verifica que tenga puntos en `puntos_ruta`
2. Fuerza reconstrucción del grafo: Accede a `/api/debug/grafo` (fuerza rebuild)
3. Verifica que la ruta esté activa

### Problema: "No veo los logs"

**Solución:**
1. Asegúrate de estar en la pestaña **"Logs"** del servicio Backend
2. NO uses "PostgreSQL Logs" (esos son solo conexiones)
3. Los logs aparecen en tiempo real cuando haces una búsqueda

---

## 📞 Soporte

Si después de verificar todo sigue sin funcionar:
1. Comparte la respuesta de `/api/debug/ruta/:id`
2. Comparte los logs relevantes de la aplicación
3. Indica qué ruta estás buscando y entre qué puntos

