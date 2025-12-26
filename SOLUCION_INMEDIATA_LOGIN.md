# ⚡ Solución Inmediata para el Login

El frontend está usando una URL incorrecta. Ejecuta esto en la consola del navegador:

## 🔧 Paso 1: Ejecutar en la Consola (F12 → Console)

```javascript
// Interceptar axios para corregir la URL del backend
const axios = window.axios || (() => {
  // Si axios no está disponible globalmente, interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[0] && typeof args[0] === 'string') {
      args[0] = args[0].replace('bustracksv-backend.onrender.com', 'bustrackapp-cel.onrender.com');
    }
    return originalFetch.apply(this, args);
  };
  return null;
})();

// También interceptar fetch por si acaso
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0]) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    if (url && url.includes('bustracksv-backend.onrender.com')) {
      if (typeof args[0] === 'string') {
        args[0] = url.replace('bustracksv-backend.onrender.com', 'bustrackapp-cel.onrender.com');
      } else {
        args[0] = { ...args[0], url: url.replace('bustracksv-backend.onrender.com', 'bustrackapp-cel.onrender.com') };
      }
    }
  }
  return originalFetch.apply(this, args);
};

console.log('✅ Interceptores de red configurados - URL corregida a bustrackapp-cel.onrender.com');
```

## 🔧 Paso 2: Alternativa Más Simple

Si lo anterior no funciona, prueba esto:

```javascript
// Sobrescribir completamente fetch
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  let url = typeof input === 'string' ? input : input.url;
  url = url.replace(/bustracksv-backend\.onrender\.com/g, 'bustrackapp-cel.onrender.com');
  const newInput = typeof input === 'string' ? url : { ...input, url };
  return originalFetch.call(this, newInput, init);
};
console.log('✅ Fetch interceptado - URL corregida');
```

## 🔧 Paso 3: Verificar la URL Actual

Ejecuta esto para ver qué URL está usando:

```javascript
console.log('URL actual del backend:', window.location.origin);
fetch('https://bustrackapp-cel.onrender.com/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend correcto responde:', d))
  .catch(e => console.error('❌ Error:', e));
```

## 📝 Después de Ejecutar

1. **Recarga la página** (F5)
2. **Ejecuta el código del Paso 1 o 2 nuevamente**
3. **Intenta iniciar sesión** con:
   - Usuario: `admin_celeste`
   - Contraseña: `Gobierno2025!`

