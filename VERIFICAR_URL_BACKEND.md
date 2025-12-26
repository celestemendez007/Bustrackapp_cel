# 🔍 Verificar qué URL está usando el Frontend

Ejecuta esto en la consola del navegador para diagnosticar:

```javascript
// Verificar qué URL está configurada en el código compilado
console.log('VITE_API_URL desde env:', import.meta.env.VITE_API_URL);

// Verificar qué URL está usando axios
if (window.apiClient) {
  console.log('URL de axios:', window.apiClient.defaults.baseURL);
}

// Probar directamente la URL correcta
fetch('https://bustrackapp-cel.onrender.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    usuario: 'admin_celeste',
    password: 'Gobierno2025!'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Login exitoso con URL directa:', data);
  // Si funciona, guarda el token
  if (data.token) {
    localStorage.setItem('bustracksv:token', data.token);
    localStorage.setItem('bustracksv:user', JSON.stringify({
      id: data.id,
      usuario: data.usuario,
      rol: data.rol
    }));
    console.log('✅ Token guardado. Redirigiendo...');
    window.location.href = '/admin/dashboard';
  }
})
.catch(error => {
  console.error('❌ Error con URL directa:', error);
});
```

Esto probará directamente la URL correcta y si funciona, guardará el token y te redirigirá.

