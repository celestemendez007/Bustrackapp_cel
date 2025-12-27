# 🚀 Guía Rápida: Diagnosticar Por Qué No Se Recomienda una Ruta

## ⚡ Solución Rápida (2 minutos)

### Paso 1: Encuentra tu URL de Backend
1. Ve a [render.com](https://render.com) → Inicia sesión
2. Selecciona tu servicio **Backend** (el que tiene tu código Node.js)
3. Copia la URL (ejemplo: `bustracksv-backend.onrender.com`)

### Paso 2: Verifica tu ruta
Abre en tu navegador:
```
https://TU_BACKEND_URL.onrender.com/api/debug/ruta/1
```
(Reemplaza `TU_BACKEND_URL` y `1` con el ID de tu ruta)

### Paso 3: Lee la respuesta
La respuesta JSON te dirá:
- ✅ Si la ruta está activa
- ✅ Cuántos puntos tiene guardados
- ✅ Si está en el grafo
- ❌ Qué problemas tiene

---

## 📊 Ver Todas las Rutas en el Grafo

Abre en tu navegador:
```
https://TU_BACKEND_URL.onrender.com/api/debug/grafo
```

Esto te mostrará todas las rutas que pueden ser recomendadas.

---

## 📝 Ver Logs de la Aplicación (NO PostgreSQL)

### ❌ NO uses estos logs:
- Render → PostgreSQL → Logs (estos son solo conexiones)

### ✅ USA estos logs:
1. Render Dashboard
2. Selecciona tu servicio **Backend** (no PostgreSQL)
3. Pestaña **"Logs"**
4. Busca mensajes como:
   - `🔍 Búsqueda de ruta solicitada`
   - `🔨 Construyendo grafo de rutas...`
   - `📊 Rutas activas encontradas: X`

---

## 🗄️ Acceder a la Base de Datos

### Opción 1: Query Editor de Render (MÁS FÁCIL)
1. Render Dashboard → PostgreSQL
2. Busca "Query Editor" o "Connect"
3. Ejecuta estas consultas:

```sql
-- Ver todas las rutas y su estado
SELECT id, numero_ruta, nombre, activa 
FROM rutas 
ORDER BY id;

-- Ver puntos de una ruta específica
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE tipo = 'ida') as ida,
       COUNT(*) FILTER (WHERE tipo = 'regreso') as regreso
FROM puntos_ruta 
WHERE ruta_id = 1;  -- Cambia 1 por el ID de tu ruta
```

### Opción 2: Cliente SQL (pgAdmin, DBeaver)
1. Render Dashboard → PostgreSQL → "Info"
2. Copia la "External Database URL"
3. Conéctate con pgAdmin o DBeaver

---

## ✅ Checklist Rápido

Cuando una ruta no se recomienda:

- [ ] **Ruta activa?** → Usa `/api/debug/ruta/:id` o consulta SQL: `SELECT activa FROM rutas WHERE id = X;`
- [ ] **Tiene puntos?** → Usa `/api/debug/ruta/:id` o consulta SQL: `SELECT COUNT(*) FROM puntos_ruta WHERE ruta_id = X;`
- [ ] **Está en el grafo?** → Usa `/api/debug/grafo` y busca tu ruta
- [ ] **Logs sin errores?** → Ve a Backend → Logs (NO PostgreSQL Logs)

---

## 🐛 Problemas Comunes y Soluciones

### "No se encontraron rutas"
1. Verifica con `/api/debug/ruta/:id` que la ruta esté activa
2. Verifica que tenga puntos guardados
3. Espera 30 segundos (el grafo se reconstruye cada 30s)

### "Ruta no está en el grafo"
1. Verifica que tenga puntos: `SELECT COUNT(*) FROM puntos_ruta WHERE ruta_id = X;`
2. Si no tiene puntos, vuelve a guardar la ruta desde el admin
3. Fuerza reconstrucción: Accede a `/api/debug/grafo` (fuerza rebuild)

### "No veo los logs de la aplicación"
- ✅ Ve a: Backend → Logs
- ❌ NO vayas a: PostgreSQL → Logs (esos son solo conexiones)

---

## 📞 ¿Necesitas Ayuda?

Comparte:
1. La respuesta de `/api/debug/ruta/:id` (copia el JSON completo)
2. Los logs relevantes de Backend → Logs (cuando buscas una ruta)
3. El ID de la ruta que no se recomienda

