# 🔐 Control de Acceso - Usuarios de Gobierno

## 📋 **Situación Actual**

### **¿Quién puede crear usuarios de gobierno?**

Actualmente hay **DOS formas** de crear usuarios de gobierno:

#### 1. **El Programador** (Mediante Script)
- ✅ Puede crear usuarios admin ejecutando: `npm run create-admin`
- ✅ Tiene control total sobre el código y la base de datos
- ✅ Puede modificar directamente la base de datos si es necesario

#### 2. **Administradores Existentes** (Desde el Panel)
- ✅ Los usuarios con rol `admin` o `gobierno` pueden crear más usuarios de gobierno
- ✅ Lo hacen desde el panel: `/admin/dashboard` → Pestaña "Usuarios Gobierno"
- ✅ Requiere estar autenticado como administrador

---

## ❌ **Lo que NO puede hacer un usuario normal:**

- ❌ **NO puede** registrarse como administrador
- ❌ **NO puede** acceder al panel de gobierno
- ❌ **NO puede** crear usuarios de gobierno
- ❌ **NO puede** cambiar su propio rol a 'admin' o 'gobierno'

**El código fuerza el rol 'usuario' automáticamente:**
```javascript
// En server/src/index.js - línea 131
"INSERT INTO usuarios (..., rol) VALUES (..., 'usuario')"
```

---

## 🔒 **Protecciones Implementadas:**

1. **Registro Público Protegido:**
   - Siempre crea usuarios con rol `'usuario'`
   - No hay forma de cambiar esto desde el registro público

2. **Endpoints Protegidos:**
   - `/admin/usuarios` requiere autenticación de administrador
   - Middleware `requireAdmin` verifica el rol antes de permitir acceso

3. **Panel de Administración:**
   - Solo usuarios con rol `admin` o `gobierno` pueden acceder
   - Verificación en frontend y backend

---

## ⚙️ **Opciones de Configuración:**

### **Opción A: Solo el Programador (Más Restrictivo)**

Si quieres que **SOLO el programador** pueda crear usuarios de gobierno:

1. **Eliminar la funcionalidad del panel** de crear usuarios
2. **Solo usar el script** `create-admin-user.js`
3. **Ventaja:** Control total del programador
4. **Desventaja:** Si un admin olvida su contraseña, solo el programador puede crear uno nuevo

### **Opción B: Programador + Administradores (Actual - Recomendado)**

Permite que:
- El programador cree el primer admin
- Los administradores puedan crear más admins
- **Ventaja:** Más flexible, los admins pueden gestionar su equipo
- **Desventaja:** Más personas pueden crear usuarios admin

---

## 💡 **Recomendación:**

**Mantener la Opción B (actual)** porque:
- El programador crea el primer administrador
- Ese administrador puede crear más usuarios según necesidad
- Si un admin olvida su contraseña, otro admin puede crear uno nuevo
- El programador siempre tiene control total (puede modificar la base de datos directamente)

---

## 🛠️ **Si quieres cambiar a "Solo Programador":**

Puedo modificar el código para:
1. Eliminar la pestaña "Usuarios Gobierno" del panel
2. Eliminar los endpoints de creación de usuarios desde el panel
3. Dejar solo el script `create-admin-user.js` como método

¿Quieres que haga este cambio?






