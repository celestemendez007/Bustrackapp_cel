# 🔐 Crear Usuario Admin de Gobierno

Este documento explica cómo crear un usuario administrador de gobierno para acceder al panel de administración.

## 📋 Información del Usuario

- **Usuario**: `admin_gobierno`
- **Contraseña**: `Gobierno2025!`
- **Rol**: `gobierno`
- **Email**: `admin@gobierno.sv`

## 🚀 Opción 1: Ejecutar en Render (Recomendado para Producción)

### Usando Render Shell:

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Selecciona el servicio `bustracksv-backend`
3. Ve a la pestaña **"Shell"**
4. Ejecuta el siguiente comando:

```bash
cd /app
node create-admin-gobierno.js
```

### O usando npm script:

```bash
cd /app
npm run create-admin-gobierno
```

---

## 💻 Opción 2: Ejecutar Localmente (Requiere Variables de Entorno)

Si tienes las variables de entorno configuradas para conectarte a la base de datos de producción:

### En Windows (PowerShell):

```powershell
cd bustracksv\server
npm.cmd run create-admin-gobierno
```

### En Linux/Mac:

```bash
cd bustracksv/server
npm run create-admin-gobierno
```

**⚠️ Importante**: Necesitas tener configurado el archivo `.env` con las variables de entorno de producción:
- `DATABASE_URL` o `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

---

## 🔧 Opción 3: Ejecutar el Script Directamente

### En Windows (PowerShell):

```powershell
cd bustracksv\server
node create-admin-gobierno.js
```

### En Linux/Mac:

```bash
cd bustracksv/server
node create-admin-gobierno.js
```

---

## ✅ Verificación

Después de ejecutar el script, deberías ver un mensaje como:

```
✅ Usuario administrador de gobierno creado exitosamente
   Usuario: admin_gobierno
   Contraseña: Gobierno2025!
   Rol: gobierno
```

## 🔑 Acceso al Panel

Una vez creado el usuario, puedes acceder al panel de administración:

- **URL de Producción**: https://bustrackapp-cel.onrender.com/admin/login
- **URL Local**: http://localhost:5173/admin/login

**Credenciales**:
- Usuario: `admin_gobierno`
- Contraseña: `Gobierno2025!`

## ⚠️ IMPORTANTE

**Cambia la contraseña después del primer acceso** usando una contraseña segura y única.

---

## 📝 Notas

- El script detecta automáticamente si está en modo cloud (PostgreSQL) o local (SQLite)
- Si el usuario ya existe, se actualizará con las nuevas credenciales
- El script crea/actualiza el esquema de la base de datos si es necesario


