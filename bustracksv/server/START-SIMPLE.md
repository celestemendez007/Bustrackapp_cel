# ✅ BusTrackSV - Versión Simplificada con SQLite

## 🎯 ¿Qué cambió?

Hemos convertido la aplicación para usar **SQLite** en lugar de PostgreSQL. Esto significa:

✅ **NO necesitas instalar PostgreSQL**  
✅ **NO necesitas pgAdmin**  
✅ **La base de datos es un archivo local** (`bustracksv.sqlite`)  
✅ **Todo funciona sin servicios externos**

## 🚀 Cómo iniciar la aplicación

### 1. Servidor (Backend)
```powershell
cd server
npm start
```

El servidor iniciará en **http://localhost:4000**

### 2. Cliente (Frontend)
```powershell
cd client
npm run dev
```

El cliente iniciará en **http://localhost:5173**

## ⚠️ Funcionalidades disponibles

### ✅ Funciona perfectamente:
- ✅ Registro de usuarios
- ✅ Login / Logout
- ✅ Perfil de usuario
- ✅ Historial de búsquedas
- ✅ Cambio de contraseña

### ⚠️ Funcionalidades geoespaciales limitadas:
- ⚠️ Búsqueda de rutas cercanas (simplificada, sin PostGIS)
- ⚠️ Visualización de mapas (simplificada)
- ⚠️ Recomendaciones de rutas (simplificada)

**Nota:** Las funcionalidades avanzadas de mapas requieren PostgreSQL con PostGIS.

## 📁 Archivo de base de datos

La base de datos SQLite se guarda en:
```
server/bustracksv.sqlite
```

Puedes abrir este archivo con cualquier visor de SQLite como:
- DB Browser for SQLite
- SQLiteStudio
- VS Code Extension: SQLite Viewer

## 🔄 Volver a PostgreSQL

Si en el futuro quieres volver a usar PostgreSQL:
1. Renombra `server/src/db-postgres-backup.js` a `server/src/db.js`
2. Configura las variables de entorno en `.env`
3. Inicia PostgreSQL

## 📝 Base de datos creada automáticamente

Al iniciar el servidor por primera vez, se crea automáticamente la base de datos con las siguientes tablas:
- `usuarios`
- `historial_busquedas`
- `rutas`
- `paradas`
- `parada_ruta`



