# 🏛️ Sistema de Administración - BusTrackSV

## Descripción

El sistema de administración permite al gobierno de El Salvador gestionar las rutas y paradas de buses que se muestran a los usuarios en la aplicación.

## Características

- ✅ **Dos interfaces separadas**: Una para usuarios normales y otra para el gobierno
- ✅ **Gestión completa de rutas**: Crear, editar, eliminar y activar/desactivar rutas
- ✅ **Gestión completa de paradas**: Crear, editar, eliminar y activar/desactivar paradas
- ✅ **Cambios en tiempo real**: Los cambios se reflejan inmediatamente en la interfaz de usuarios
- ✅ **Autenticación segura**: Solo usuarios con rol de administrador pueden acceder

## Configuración Inicial

### 1. Crear Usuario Administrador

Ejecuta el siguiente comando en la carpeta `server`:

```bash
cd server
npm run create-admin
```

Esto creará un usuario administrador con las siguientes credenciales:
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: `gobierno`

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer acceso.

### 2. Acceder al Panel de Administración

1. Abre tu navegador y ve a: `http://localhost:5173/admin/login`
2. Ingresa las credenciales del administrador
3. Serás redirigido al panel de administración

## Uso del Panel de Administración

### Gestión de Rutas

En la pestaña **Rutas**, puedes:

- **Ver todas las rutas**: Lista completa de rutas (activas e inactivas)
- **Crear nueva ruta**: Click en "Agregar Ruta" y completa el formulario
- **Editar ruta**: Click en "Editar" en cualquier ruta
- **Eliminar ruta**: Click en "Eliminar" (esto también elimina las asociaciones con paradas)
- **Activar/Desactivar**: Usa el checkbox "Ruta activa" en el formulario

**Campos de una ruta:**
- Número de Ruta (requerido, único)
- Nombre (requerido)
- Empresa
- Tipo (Bus, Microbus, Ruta Especial)
- Tarifa
- Color (para visualización en el mapa)
- Horario de inicio y fin
- Frecuencia en minutos
- Estado (activa/inactiva)

### Gestión de Paradas

En la pestaña **Paradas**, puedes:

- **Ver todas las paradas**: Lista completa de paradas
- **Crear nueva parada**: Click en "Agregar Parada" y completa el formulario
- **Editar parada**: Click en "Editar" en cualquier parada
- **Eliminar parada**: Click en "Eliminar"
- **Activar/Desactivar**: Usa el checkbox "Parada activa" en el formulario

**Campos de una parada:**
- Nombre (requerido)
- Código (opcional, único)
- Latitud (requerido)
- Longitud (requerido)
- Dirección
- Tipo (Regular, Terminal, etc.)
- Características: Tiene techo, Tiene asientos, Accesible
- Estado (activa/inactiva)

## Flujo de Trabajo Recomendado

1. **Crear paradas primero**: Define todas las paradas que necesitas
2. **Crear rutas**: Crea las rutas de buses
3. **Asociar paradas a rutas**: Usa la funcionalidad de asociación (próximamente)
4. **Activar rutas y paradas**: Marca como activas las que quieres que los usuarios vean

## Seguridad

- Solo usuarios con rol `admin` o `gobierno` pueden acceder al panel
- Las rutas del backend están protegidas con autenticación JWT
- Los cambios requieren confirmación antes de eliminar elementos

## Notas Técnicas

- Los cambios se guardan inmediatamente en la base de datos SQLite
- Las rutas y paradas inactivas no se muestran a los usuarios normales
- El sistema usa SQLite, por lo que no requiere configuración de servidor de base de datos

## Solución de Problemas

### No puedo iniciar sesión
- Verifica que hayas creado el usuario administrador con `npm run create-admin`
- Asegúrate de que el servidor backend esté corriendo

### Los cambios no se reflejan
- Refresca la página del panel de administración
- Verifica que las rutas/paradas estén marcadas como "activas"
- Los usuarios normales verán los cambios al recargar la página

### Error al eliminar
- Asegúrate de que no haya relaciones activas (por ejemplo, una parada asociada a una ruta)
- El sistema eliminará automáticamente las relaciones antes de eliminar el elemento

## Soporte

Para más información o problemas, consulta el README principal del proyecto.







