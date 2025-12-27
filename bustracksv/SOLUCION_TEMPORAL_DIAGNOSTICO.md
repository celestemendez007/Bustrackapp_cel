# 🔧 Solución Temporal: Diagnosticar Sin Endpoints de Debug

Mientras Render despliega los nuevos endpoints, puedes usar estos métodos:

## 📋 Método 1: Usar Endpoints Existentes

### Ver todas las rutas activas:
```
https://bustrackapp-cel.onrender.com/api/rutas
```

Esto te mostrará todas las rutas que están activas. Verifica que tu ruta aparezca aquí.

### Ver puntos de una ruta específica:
```
https://bustrackapp-cel.onrender.com/api/admin/rutas/:id/puntos
```

**Nota:** Este endpoint requiere autenticación. Necesitas estar logueado como admin.

---

## 📋 Método 2: Verificar en Render Dashboard

### Paso 1: Verificar que el despliegue esté completo
1. Ve a [render.com](https://render.com)
2. Selecciona tu servicio **Backend**
3. Ve a la pestaña **"Events"** o **"Deploys"**
4. Verifica que el último deploy esté completo (debería decir "Live" o "Success")

### Paso 2: Forzar un nuevo despliegue (si es necesario)
1. En el dashboard de tu servicio Backend
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera a que termine el despliegue (puede tomar 2-5 minutos)

---

## 📋 Método 3: Verificar Base de Datos Directamente

### Usar Query Editor de Render:
1. Render Dashboard → PostgreSQL
2. Busca "Query Editor" o "Connect"
3. Ejecuta estas consultas:

```sql
-- Ver todas las rutas y su estado
SELECT id, numero_ruta, nombre, activa 
FROM rutas 
ORDER BY id;

-- Ver puntos de una ruta específica (reemplaza 1 con el ID de tu ruta)
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE tipo = 'ida') as ida,
       COUNT(*) FILTER (WHERE tipo = 'regreso') as regreso
FROM puntos_ruta 
WHERE ruta_id = 1;

-- Ver si una ruta específica está activa
SELECT id, numero_ruta, nombre, activa 
FROM rutas 
WHERE id = 1;
```

---

## ✅ Checklist Rápido

- [ ] **Ruta existe?** → Usa `/api/rutas` y busca tu ruta
- [ ] **Ruta activa?** → Verifica `activa = 1` en la base de datos
- [ ] **Tiene puntos?** → Consulta `puntos_ruta` en la base de datos
- [ ] **Despliegue completo?** → Verifica en Render Dashboard que el último deploy esté "Live"

---

## 🚀 Después del Despliegue

Una vez que Render despliegue los cambios (generalmente toma 2-5 minutos después del push a GitHub), podrás usar:

```
https://bustrackapp-cel.onrender.com/api/debug/ruta/1
https://bustrackapp-cel.onrender.com/api/debug/grafo
```

Estos endpoints te darán toda la información de diagnóstico de forma automática.

