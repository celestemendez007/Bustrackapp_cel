# 🔐 Crear Usuario Admin usando Endpoint

Como no tienes acceso al Shell en Render (plan gratuito), puedes crear el usuario admin usando un endpoint HTTP.

## 🚀 Opción 1: Usar la Consola del Navegador (Más Fácil)

1. Abre tu navegador y ve a: https://bustrackapp-cel.onrender.com
2. Presiona `F12` para abrir las herramientas de desarrollador
3. Ve a la pestaña **Console**
4. Pega y ejecuta este código:

```javascript
fetch('https://bustrackapp-cel.onrender.com/setup/admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Respuesta:', data);
  if (data.success) {
    console.log('Usuario creado:');
    console.log('Usuario:', data.usuario);
    console.log('Contraseña:', data.password);
    console.log('Rol:', data.rol);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

---

## 🚀 Opción 2: Usar curl (Desde Terminal)

### En Windows (PowerShell):

```powershell
Invoke-RestMethod -Uri "https://bustrackapp-cel.onrender.com/setup/admin" -Method Post -ContentType "application/json"
```

### En Linux/Mac:

```bash
curl -X POST https://bustrackapp-cel.onrender.com/setup/admin \
  -H "Content-Type: application/json"
```

---

## 🚀 Opción 3: Usar Postman

1. Abre Postman
2. Método: **POST**
3. URL: `https://bustrackapp-cel.onrender.com/setup/admin`
4. Headers: `Content-Type: application/json`
5. Body: (dejar vacío)
6. Click en **Send**

---

## 📋 Credenciales que se Crearán

- **Usuario**: `admin_gobierno`
- **Contraseña**: `Gobierno2025!`
- **Rol**: `admin`
- **Email**: `admin@gobierno.sv`

---

## ⚠️ Seguridad

Este endpoint solo funciona **una vez**:
- ✅ Solo funciona si **NO** hay usuarios admin en la base de datos
- ✅ Una vez que existe un admin, este endpoint se desactiva automáticamente
- ✅ Es seguro para el setup inicial

---

## ✅ Después de Crear el Usuario

Una vez creado el usuario, puedes:

1. Ir a: https://bustrackapp-cel.onrender.com/admin/login
2. Iniciar sesión con:
   - Usuario: `admin_gobierno`
   - Contraseña: `Gobierno2025!`

---

## 🔄 Si Ya Existe un Admin

Si ya existe un usuario admin y quieres crear más, debes:
1. Iniciar sesión como admin
2. Ir al panel de administración
3. Usar la sección "Usuarios de Gobierno" para crear más usuarios

