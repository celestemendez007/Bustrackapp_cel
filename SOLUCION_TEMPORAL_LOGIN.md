# 🔧 Solución Temporal: Forzar URL Correcta del Backend

El frontend está usando una URL incorrecta del backend. Mientras se arregla el despliegue, puedes forzar la URL correcta desde la consola del navegador.

## ⚡ Solución Rápida (Desde la Consola)

1. **Abre la consola del navegador** (F12 → Console)

2. **Ejecuta este código** para forzar la URL correcta:

```javascript
// Guardar la función original de fetch
const originalFetch = window.fetch;

// Interceptar fetch para cambiar la URL del backend
window.fetch = function(...args) {
  if (args[0] && typeof args[0] === 'string') {
    // Si la URL contiene bustracksv-backend, cambiarla a bustrackapp-cel
    args[0] = args[0].replace('bustracksv-backend.onrender.com', 'bustrackapp-cel.onrender.com');
  }
  return originalFetch.apply(this, args);
};

console.log('✅ URL del backend corregida temporalmente');
```

3. **Ahora intenta iniciar sesión nuevamente** con:
   - Usuario: `admin_celeste`
   - Contraseña: `Gobierno2025!`

4. **Si funciona**, deberías poder acceder al panel de administración.

## 🔄 Solución Permanente

Para una solución permanente, necesitas:

1. **Verificar si hay una variable `VITE_API_URL` en Render:**
   - Ve a tu servicio del frontend en Render
   - Ve a "Environment"
   - Busca `VITE_API_URL`
   - Si existe y tiene `bustracksv-backend.onrender.com`, cámbiala a `https://bustrackapp-cel.onrender.com`
   - O elimínala para que use la detección automática

2. **Forzar un redeploy del frontend:**
   - En Render, ve a tu servicio del frontend
   - Click en "Manual Deploy" → "Deploy latest commit"

## ⚠️ Nota

La solución temporal solo funciona mientras la pestaña del navegador está abierta. Si recargas la página, necesitarás ejecutar el código nuevamente.

