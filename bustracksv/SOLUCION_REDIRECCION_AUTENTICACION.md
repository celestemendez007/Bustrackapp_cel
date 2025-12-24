# 🔧 Solución: Redirección Incorrecta Después de Login

## ✅ **Problema Identificado y Corregido**

El problema era una **inconsistencia en las claves del localStorage**:

- **AdminLoginPage guardaba:** `'token'` y `'user'`
- **apiClient buscaba:** `'bustracksv:token'` y `'bustracksv:user'`
- **AdminDashboardPage buscaba:** `'user'`

Esto causaba que:
1. El token no se encontrara en las peticiones
2. Las peticiones fallaran con 401/403
3. El interceptor redirigiera incorrectamente

## 🔄 **Cambios Realizados:**

### 1. **AdminLoginPage.jsx:**
- ✅ Cambiado `localStorage.setItem('token', ...)` a `localStorage.setItem('bustracksv:token', ...)`
- ✅ Cambiado `localStorage.setItem('user', ...)` a `localStorage.setItem('bustracksv:user', ...)`

### 2. **AdminDashboardPage.jsx:**
- ✅ Cambiado `localStorage.getItem('user')` a `localStorage.getItem('bustracksv:user')`
- ✅ Cambiado `localStorage.removeItem('token')` a `localStorage.removeItem('bustracksv:token')`
- ✅ Cambiado `localStorage.removeItem('user')` a `localStorage.removeItem('bustracksv:user')`

### 3. **apiClient.js:**
- ✅ Mejorado el interceptor para redirigir a `/admin/login` cuando estás en rutas de admin
- ✅ Redirige a `/login` solo cuando estás en rutas normales

## 📝 **Cómo Funciona Ahora:**

1. **Login exitoso:**
   - Token se guarda como `bustracksv:token`
   - Usuario se guarda como `bustracksv:user`
   - Redirige a `/admin/dashboard`

2. **Peticiones API:**
   - apiClient lee `bustracksv:token` automáticamente
   - Lo envía en el header `Authorization: Bearer <token>`

3. **Verificación de autenticación:**
   - AdminDashboardPage lee `bustracksv:user`
   - Verifica el rol antes de cargar datos

4. **Errores 401/403:**
   - Si estás en `/admin/*`, redirige a `/admin/login`
   - Si estás en rutas normales, redirige a `/login`

## ✅ **Prueba Ahora:**

1. **Cierra sesión** si estás logueado
2. **Limpia el localStorage** (F12 → Console → `localStorage.clear()`)
3. **Recarga la página** (Ctrl + F5)
4. **Inicia sesión de nuevo:**
   - Usuario: `admin`
   - Contraseña: `admin123`
5. **Debería:**
   - ✅ Mantenerte en `/admin/dashboard`
   - ✅ Cargar las rutas, paradas y usuarios
   - ✅ NO redirigirte a `/login`

## 🐛 **Si Aún Hay Problemas:**

1. **Verifica el token en localStorage:**
   ```javascript
   // En la consola del navegador (F12)
   localStorage.getItem('bustracksv:token')
   localStorage.getItem('bustracksv:user')
   ```

2. **Verifica que el servidor esté corriendo:**
   ```powershell
   netstat -ano | findstr ":4000"
   ```

3. **Revisa la consola del navegador (F12) para errores**

4. **Verifica la pestaña Network (F12) para ver las peticiones**

## ✅ **Estado Actual:**

- ✅ Claves de localStorage unificadas
- ✅ Token se guarda y lee correctamente
- ✅ Redirecciones corregidas
- ✅ Interceptor mejorado

**El problema debería estar completamente resuelto ahora.** 🚀





