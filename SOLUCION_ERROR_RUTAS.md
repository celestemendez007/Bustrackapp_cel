# 🔧 Solución para Error al Crear Rutas

## Paso 1: Verificar/Crear el Esquema

Ejecuta esto en la consola del navegador (F12) para asegurar que las tablas existan:

```javascript
fetch('https://bustrackapp-cel.onrender.com/setup/ensure-schema', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Respuesta:', data);
  if (data.success) {
    alert('✅ Tablas creadas/verificadas. Intenta crear la ruta nuevamente.');
  } else {
    alert('⚠️ Error: ' + data.message);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

## Paso 2: Verificar los Logs del Servidor

1. Ve a: https://dashboard.render.com
2. Selecciona el servicio `bustracksv-backend`
3. Ve a la pestaña **"Logs"**
4. Busca el error más reciente cuando intentaste crear la ruta
5. Copia el mensaje de error completo

## Paso 3: Verificar que las Tablas Existan

Ejecuta esto para verificar si las tablas existen:

```javascript
fetch('https://bustrackapp-cel.onrender.com/setup/list-admins')
  .then(response => response.json())
  .then(data => console.log('Tablas de usuarios funcionan:', data))
  .catch(err => console.error('Error:', err));
```

Si esto funciona, las tablas básicas existen. El problema puede ser específico de la tabla `rutas`.

## Posibles Causas del Error 500

1. **Tabla `rutas` no existe** - Solución: Ejecutar `/setup/ensure-schema`
2. **Error en la consulta SQL** - Puede haber un problema con los tipos de datos
3. **Columnas faltantes** - Alguna columna requerida no existe

## Si el Error Persiste

Comparte el mensaje de error exacto de los logs de Render para poder diagnosticar mejor el problema.

