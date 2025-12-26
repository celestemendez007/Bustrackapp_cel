# 📋 Resumen: Crear Usuario Admin de Gobierno

## ✅ Estado Actual

Ya existe un usuario admin en la base de datos:
- **Usuario**: `admin_celeste`
- **Email**: `celeste.mendez007@gmail.com`
- **Rol**: Admin

## 🔧 Solución Implementada

He creado un endpoint temporal para resetear la contraseña del usuario existente:

### Endpoint: `/setup/reset-admin-password`

Este endpoint permite resetear la contraseña del usuario `admin_celeste` a una contraseña conocida.

## 📝 Pasos para Resetear la Contraseña

### 1. Espera a que Render despliegue (2-3 minutos)

Verifica que el deployment haya terminado en el dashboard de Render.

### 2. Ejecuta este código en la consola del navegador (F12):

```javascript
fetch('https://bustrackapp-cel.onrender.com/setup/reset-admin-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    usuario: 'admin_celeste'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Respuesta:', data);
  if (data.success) {
    alert('✅ Contraseña reseteada!\nUsuario: ' + data.usuario + '\nNueva contraseña: ' + data.password);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

### 3. Después de resetear, inicia sesión con:

- **URL**: https://bustrackapp-cel.onrender.com/admin/login
- **Usuario**: `admin_celeste`
- **Contraseña**: `Gobierno2025!`

## 🔍 Si el endpoint aún no está disponible (Error 404)

Esto significa que Render aún está desplegando. Espera unos minutos más y vuelve a intentar.

Puedes verificar el estado del deployment en:
- Dashboard de Render: https://dashboard.render.com
- Busca el servicio `bustracksv-backend`
- Verifica que el último deployment esté en estado "Live"

## ⚠️ Notas de Seguridad

- Estos endpoints (`/setup/*`) son temporales y solo deben usarse durante el setup inicial
- Una vez que tengas acceso, considera eliminar o deshabilitar estos endpoints
- Cambia la contraseña después del primer acceso

## 🔑 Credenciales Finales

- **Usuario**: `admin_celeste`
- **Contraseña**: `Gobierno2025!` (después del reset)
- **Rol**: Admin
- **URL de acceso**: https://bustrackapp-cel.onrender.com/admin/login

