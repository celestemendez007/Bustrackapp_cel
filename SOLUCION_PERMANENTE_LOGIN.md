# 🔧 Solución Permanente para el Login

El problema es que el frontend está usando código antiguo compilado. Las variables de Vite (como `VITE_API_URL`) se embeben en el código durante el BUILD, no en runtime.

## 🚀 Solución Permanente

### Opción 1: Redesplegar el Frontend (Recomendado)

Si tienes un servicio de frontend en Render:

1. Ve a: https://dashboard.render.com
2. Selecciona el servicio del **frontend** (no el backend)
3. Click en **"Manual Deploy"** → **"Clear build cache & deploy"**
4. Espera 2-3 minutos a que termine el deployment

Esto reconstruirá el frontend con el código actualizado que detecta automáticamente la URL correcta del backend.

---

### Opción 2: Configurar Variable de Entorno en Render

Si el frontend está desplegado en Render:

1. Ve a tu servicio de frontend en Render
2. Ve a **"Environment"**
3. Busca o agrega la variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://bustrackapp-cel.onrender.com`
4. Guarda los cambios
5. Redesplega el frontend para que use la nueva variable

---

### Opción 3: Si el Frontend NO está desplegado

Si solo tienes el backend desplegado y estás accediendo al frontend de otra forma (localmente, etc.), entonces:

1. **Ejecuta el frontend localmente** desde tu máquina
2. O **despliega el frontend** usando el `render.yaml` que ya está configurado

---

## 🔍 Verificar si el Frontend está Desplegado

1. Ve a: https://dashboard.render.com
2. Busca si hay un servicio llamado `bustracksv-frontend` o similar
3. Si existe, usa la Opción 1 o 2
4. Si NO existe, necesitas desplegarlo primero

---

## ⚡ Solución Temporal (Mientras tanto)

Si necesitas acceso inmediato mientras despliegas el frontend, puedes usar esta solución temporal en la consola del navegador (F12):

```javascript
// Interceptar fetch y XMLHttpRequest
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  let url = typeof input === 'string' ? input : input?.url || input;
  if (url && url.includes('bustracksv-backend.onrender.com')) {
    url = url.replace(/bustracksv-backend\.onrender\.com/g, 'bustrackapp-cel.onrender.com');
    input = typeof input === 'string' ? url : { ...input, url };
  }
  return originalFetch.call(this, input, init);
};

const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  if (url && url.includes('bustracksv-backend.onrender.com')) {
    url = url.replace(/bustracksv-backend\.onrender\.com/g, 'bustrackapp-cel.onrender.com');
  }
  return originalXHROpen.call(this, method, url, ...rest);
};

console.log('✅ URLs corregidas temporalmente');
```

**Nota**: Esta solución solo funciona mientras la pestaña está abierta. Si recargas, necesitas ejecutarla nuevamente.

---

## ✅ Solución Definitiva

La solución permanente es redesplegar el frontend con el código actualizado. El código ya está en GitHub, solo necesitas que Render lo redespliegue.

