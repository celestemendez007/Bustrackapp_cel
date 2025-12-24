# 🎯 Guía de Interfaces - BusTrackSV

## 📱 Dos Interfaces Separadas

BusTrackSV tiene **dos interfaces completamente separadas** para diferentes tipos de usuarios:

---

## 👥 **INTERFAZ DE USUARIOS NORMALES** (Pasajeros)

### 🎨 **Cómo se ve:**
- Fondo azul oscuro con gradientes
- Botón azul claro (`#6ab0ff` o `#7bc4f0`)
- Diseño moderno y amigable
- Enfoque en búsqueda de rutas y mapas

### 🔗 **Cómo acceder:**
1. **URL directa**: `http://localhost:5173/login`
2. **Desde la página principal**: Click en "Iniciar Sesión" (botón en el header)
3. **Desde cualquier página**: Click en "Iniciar Sesión" en el menú superior

### ✨ **Funcionalidades:**
- ✅ Buscar rutas de buses
- ✅ Ver mapa interactivo
- ✅ Planificar viajes
- ✅ Ver historial de búsquedas
- ✅ Gestionar perfil personal
- ✅ Ver información de paradas y rutas

### 🎯 **Después de iniciar sesión:**
- Redirige a `/dashboard` (panel de usuario)
- Puedes acceder a `/map` para buscar rutas
- Puedes ver tu perfil en `/perfil`

---

## 🏛️ **INTERFAZ DE GOBIERNO** (Administración)

### 🎨 **Cómo se ve:**
- Fondo azul oscuro similar pero con **bordes amarillos** (`border-yellow-500`)
- Botón **amarillo** (`#yellow-500`) en lugar de azul
- Icono de gobierno 🏛️
- Diseño más formal y administrativo
- Título: "Acceso Gobierno" o "Panel de Administración"

### 🔗 **Cómo acceder:**
1. **URL directa**: `http://localhost:5173/admin/login`
2. **Desde la página principal**: 
   - Scroll hasta el final (footer)
   - Click en "Acceso Gobierno" (enlace pequeño)
3. **Desde login de usuarios**: 
   - En la parte inferior del formulario
   - Click en "Acceso Gobierno →"

### ✨ **Funcionalidades:**
- ✅ **Gestionar Rutas**: Crear, editar, eliminar rutas de buses
- ✅ **Gestionar Paradas**: Crear, editar, eliminar paradas
- ✅ **Activar/Desactivar**: Controlar qué rutas/paradas ven los usuarios
- ✅ **Ver todas las rutas/paradas**: Incluyendo las inactivas
- ✅ **Cambios en tiempo real**: Los cambios se reflejan inmediatamente

### 🎯 **Después de iniciar sesión:**
- Redirige a `/admin/dashboard` (panel de administración)
- Puedes gestionar rutas y paradas desde ahí
- Los cambios se reflejan en la interfaz de usuarios normales

---

## 🔑 **Credenciales por Defecto**

### Usuario Normal:
- Crea tu cuenta desde `/register`
- O usa cualquier usuario que hayas creado

### Gobierno (Admin):
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- ⚠️ **IMPORTANTE**: Crea este usuario primero con:
  ```bash
  cd server
  npm run create-admin
  ```

---

## 📊 **Diferencias Visuales Rápidas**

| Característica | Usuarios Normales | Gobierno |
|----------------|-------------------|----------|
| **Color principal** | Azul claro (`#6ab0ff`) | Amarillo (`#yellow-500`) |
| **Icono** | 🚌 Bus | 🏛️ Gobierno |
| **Título** | "Inicia sesión en BusTrackSV" | "Acceso Gobierno" |
| **URL** | `/login` | `/admin/login` |
| **Después de login** | `/dashboard` | `/admin/dashboard` |
| **Funcionalidad** | Buscar y usar rutas | Gestionar rutas y paradas |

---

## 🗺️ **Mapa de Navegación**

```
Página Principal (/)
├── Usuarios Normales
│   ├── /login → Login usuarios
│   ├── /register → Registro
│   ├── /dashboard → Panel usuario
│   └── /map → Mapa y búsqueda
│
└── Gobierno
    ├── /admin/login → Login gobierno
    └── /admin/dashboard → Panel administración
```

---

## 💡 **Consejos**

1. **Si eres usuario normal**: Usa `/login` - es el botón principal en el header
2. **Si eres del gobierno**: Usa `/admin/login` - está en el footer o en el enlace del login normal
3. **No puedes mezclar**: Un usuario normal NO puede acceder al panel de gobierno, y viceversa
4. **Los cambios del gobierno**: Se reflejan automáticamente en la interfaz de usuarios normales

---

## 🆘 **Solución de Problemas**

### "No puedo acceder al panel de gobierno"
- Verifica que hayas creado el usuario admin: `npm run create-admin` en la carpeta `server`
- Asegúrate de usar las credenciales correctas: `admin` / `admin123`
- Verifica que el servidor backend esté corriendo

### "No veo el enlace de gobierno"
- Scroll hasta el final de la página principal
- O ve directamente a: `http://localhost:5173/admin/login`

### "Me redirige al login normal"
- Si eres usuario normal, no puedes acceder al panel de gobierno
- Necesitas un usuario con rol `admin` o `gobierno`
- Crea el usuario admin con el script mencionado arriba

---

¡Listo! Ahora sabes cómo diferenciar y acceder a cada interfaz. 🚀







