# 🔐 Seguridad y Control de Usuarios - BusTrackSV

## ✅ Sistema de Seguridad Implementado

### 🎯 **Registro Público (Usuarios Normales)**

**¿Quién puede registrarse?**
- ✅ Cualquier persona puede registrarse como usuario normal
- ✅ URL: `http://localhost:5173/register`

**¿Qué rol obtienen?**
- 🔒 **SIEMPRE** obtienen el rol `'usuario'`
- ❌ **NUNCA** pueden obtener rol `'admin'` o `'gobierno'` por registro público
- ✅ El sistema fuerza el rol `'usuario'` automáticamente

**Código de seguridad:**
```javascript
// En server/src/index.js - Endpoint /register
// El rol 'usuario' se asigna automáticamente, no se puede cambiar desde el registro público
"INSERT INTO usuarios (..., rol) VALUES (..., 'usuario')"
```

---

### 🏛️ **Usuarios de Gobierno (Administradores)**

**¿Quién puede crear usuarios de gobierno?**
- ✅ **Solo el programador** mediante scripts
- ✅ **Solo administradores existentes** desde el panel de administración
- ❌ **NUNCA** usuarios normales pueden crear usuarios de gobierno

**Métodos para crear usuarios de gobierno:**

#### 1. **Script del Programador** (Recomendado para el primer admin)
```bash
cd server
npm run create-admin
```
- Crea usuario: `admin` / contraseña: `admin123`
- Rol: `gobierno`
- Solo el programador puede ejecutar este script

#### 2. **Panel de Administración** (Para crear más admins)
- Solo usuarios con rol `admin` o `gobierno` pueden acceder
- URL: `http://localhost:5173/admin/dashboard`
- Pestaña "Usuarios de Gobierno"
- Pueden crear nuevos usuarios de gobierno

---

## 🔒 **Protecciones Implementadas**

### 1. **Registro Público Protegido**
```javascript
// El registro SIEMPRE crea usuarios con rol 'usuario'
// No importa qué intente el usuario, el rol será 'usuario'
INSERT INTO usuarios (..., rol) VALUES (..., 'usuario')
```

### 2. **Endpoints de Administración Protegidos**
- Todos los endpoints `/admin/*` requieren:
  - ✅ Token JWT válido
  - ✅ Rol `admin` o `gobierno`
- Middleware `requireAdmin` verifica el rol antes de permitir acceso

### 3. **Login Separado**
- Login de usuarios normales: `/login`
- Login de gobierno: `/admin/login`
- El login de gobierno verifica el rol antes de permitir acceso

### 4. **Creación de Usuarios de Gobierno**
- Endpoint: `POST /admin/usuarios`
- Requiere autenticación de administrador
- Solo puede crear usuarios con rol `admin` o `gobierno`
- Usuarios normales no pueden acceder a este endpoint

---

## 📋 **Flujo de Seguridad**

```
┌─────────────────────────────────────────┐
│  Usuario Normal Intenta Registrarse     │
└──────────────┬──────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ POST /register │
        └───────┬───────┘
                │
                ▼
    ┌───────────────────────┐
    │ Rol SIEMPRE = 'usuario'│
    │ (Forzado por sistema)  │
    └───────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ Usuario Normal│
        │ Creado        │
        └───────────────┘

┌─────────────────────────────────────────┐
│  Programador/Admin Crea Usuario Gobierno │
└──────────────┬──────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ Script       │  │ Panel Admin      │
│ create-admin │  │ POST /admin/     │
│              │  │ usuarios         │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       │                   │ (Requiere auth admin)
       │                   │
       └─────────┬─────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Rol = 'gobierno'│
         │ o 'admin'      │
         └───────────────┘
```

---

## 🛡️ **Resumen de Seguridad**

| Acción | Usuario Normal | Administrador | Programador |
|--------|---------------|---------------|-------------|
| **Registrarse** | ✅ (rol: usuario) | ❌ No necesario | ❌ No necesario |
| **Crear usuario gobierno** | ❌ Bloqueado | ✅ Desde panel | ✅ Script |
| **Acceder panel admin** | ❌ Bloqueado | ✅ Permitido | ✅ Permitido |
| **Cambiar roles** | ❌ Bloqueado | ✅ Desde panel | ✅ Script/DB |
| **Gestionar rutas/paradas** | ❌ Bloqueado | ✅ Permitido | ✅ Permitido |

---

## ⚠️ **Importante**

1. **El registro público NUNCA puede crear administradores**
   - El código fuerza el rol `'usuario'` automáticamente
   - No hay forma de que un usuario normal se convierta en admin por registro

2. **Solo administradores pueden crear más administradores**
   - Desde el panel de administración
   - Requiere estar autenticado como admin

3. **El programador tiene control total**
   - Puede crear usuarios admin mediante scripts
   - Puede modificar directamente la base de datos si es necesario
   - Tiene acceso completo al código

4. **Cambiar contraseñas**
   - Los usuarios normales pueden cambiar su propia contraseña
   - Los administradores pueden cambiar contraseñas desde el panel (próximamente)

---

## 🔧 **Para el Programador**

### Crear Usuario Admin Inicial:
```bash
cd server
npm run create-admin
```

### Crear Usuario Admin Manualmente (desde código):
Edita `server/create-admin-user.js` y cambia:
- `usuario`: nombre de usuario
- `password`: contraseña
- `rol`: 'admin' o 'gobierno'

### Ver Usuarios en Base de Datos:
Puedes usar DB Browser for SQLite o cualquier herramienta SQLite para ver/modificar usuarios directamente.

---

## ✅ **Conclusión**

**Sí, solo el programador y los administradores pueden asignar qué usuarios y contraseñas pueden ingresar al panel de gobierno.**

- ✅ Usuarios normales: Se registran libremente, siempre con rol `usuario`
- ✅ Usuarios gobierno: Solo creados por programador (script) o administradores (panel)
- ✅ Sistema seguro: Múltiples capas de protección
- ✅ Control total: El programador tiene control completo sobre quién puede ser administrador







