# 🔧 Ejecutar Script para Corregir Usuario Admin

## Instrucciones para Render

### Paso 1: Abrir Shell en Render

1. Ve a tu servicio `bustracksv-backend` en Render
2. Click en **"Shell"** (en el menú lateral izquierdo o en la parte superior)

### Paso 2: Ejecutar el Script

Copia y pega este comando en el Shell:

```bash
node fix-admin-celeste.js
```

Si no funciona, prueba estas variaciones:

```bash
cd server && node fix-admin-celeste.js
```

```bash
cd bustracksv/server && node fix-admin-celeste.js
```

```bash
ls -la
```

(El último comando lista los archivos para ver dónde estás)

### Paso 3: Verificar el Resultado

El script debería mostrar:
- ✅ Conectado a PostgreSQL
- ✅ Usuario creado/actualizado
- ✅ Credenciales: admin_celeste / 123456

### Paso 4: Probar el Login

1. Ve a: `https://tu-frontend.onrender.com/admin/login`
2. Usuario: `admin_celeste`
3. Contraseña: `123456`

---

## Si el Script No Se Encuentra

El archivo debe estar en la misma carpeta que el código. Si no está, puedes:

1. **Subirlo a tu repositorio Git y hacer push**
2. **O ejecutarlo desde tu computadora** (si tienes acceso a la base de datos):

```powershell
cd "bustracksv\server"
node fix-admin-celeste.js
```

(Necesitas tener DATABASE_URL en tu archivo .env)

---

## Credenciales

Después de ejecutar el script:
- **Usuario:** `admin_celeste`
- **Contraseña:** `123456`
- **Rol:** `admin`

⚠️ **Cambia la contraseña después del primer acceso!**

