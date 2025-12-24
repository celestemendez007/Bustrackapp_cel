# 🚌 BusTrackSV - Sistema de Transporte Público

Sistema inteligente de seguimiento y planificación de rutas de transporte público para El Salvador.

> ⚡ **NUEVO**: Base de datos expandida con 80+ rutas y **250+ paradas**
> 
> 🚀 **[→ INICIO RÁPIDO: Implementa la expansión en 5 minutos](./INICIO_RAPIDO.md)** ⭐
> 
> 🎯 **NUEVO**: Búsqueda mejorada con **20 sugerencias** en vez de 10 - **[Ver instrucciones](./MAS_PARADAS_INSTRUCCIONES.md)**

## 🎯 Características

- ✅ **Registro y autenticación de usuarios**
- ✅ **Perfil de usuario personalizado**
- ✅ **Historial de búsquedas**
- ✅ **Búsqueda de rutas de buses**
- ✅ **Visualización en mapa interactivo**
- ✅ **Base de datos SQLite (no requiere PostgreSQL)**
- 🆕 **Base de datos EXPANDIDA: 80+ rutas y 150+ paradas**
- 🆕 **Sistema de recomendación inteligente de rutas**
- 🆕 **Búsqueda por proximidad geográfica**
- 🆕 **Algoritmo de rutas con transbordos**

## 📊 Base de Datos Expandida

BusTrackSV ahora incluye una base de datos significativamente expandida:

| Característica | Cantidad |
|----------------|----------|
| **Rutas de Buses** | 80+ |
| **Paradas Estratégicas** | 250+ 🆕 |
| **Sugerencias de Búsqueda** | 20 (antes: 10) 🆕 |
| **Cobertura** | Todo el AMSS |
| **Fuentes** | VMT + bus.sv + Datos Oficiales |

### 🚀 Importar Datos Expandidos

**Opción 1: 250+ paradas (RECOMENDADO para más opciones de búsqueda)**
```bash
cd server
node import-super-expanded-data.js
```

**Opción 2: 156 paradas (versión original expandida)**
```bash
cd server
node import-expanded-data.js
```

📖 **Documentación completa**: Ver [DATOS_EXPANDIDOS_README.md](./DATOS_EXPANDIDOS_README.md)
⚡ **Guía rápida**: Ver [GUIA_RAPIDA_EXPANSION.md](./GUIA_RAPIDA_EXPANSION.md)
🎯 **Más paradas**: Ver [MAS_PARADAS_INSTRUCCIONES.md](./MAS_PARADAS_INSTRUCCIONES.md) 🆕

## 🚀 Inicio Rápido

### Opción 1: Script automático (Recomendado)
```powershell
.\iniciar.ps1
```

### Opción 2: Manual

**1. Iniciar el servidor:**
```powershell
cd server
npm start
```

**2. Iniciar el cliente (en otra terminal):**
```powershell
cd client
npm run dev
```

**3. Abrir en el navegador:**
```
http://localhost:5173
```

## ⚙️ Instalación

### Requisitos previos
- Node.js 18+ 
- npm

### Instalar dependencias

**Servidor:**
```powershell
cd server
npm install
```

**Cliente:**
```powershell
cd client
npm install
```

## 💾 Base de Datos

La aplicación usa **SQLite**, una base de datos ligera que no requiere instalación de servidor.

- **Archivo:** `server/bustracksv.sqlite`
- **Se crea automáticamente** al iniciar el servidor por primera vez
- **No necesitas PostgreSQL ni pgAdmin**

### Visualizar la base de datos

Puedes abrir el archivo SQLite con:
- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQLiteStudio](https://sqlitestudio.pl/)
- VS Code Extension: SQLite Viewer

## 📁 Estructura del Proyecto

```
bustracksv/
├── client/           # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── router/
│   └── package.json
├── server/           # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.js
│   │   └── db.js
│   ├── database/
│   └── package.json
├── iniciar.ps1       # Script de inicio automático
└── README.md
```

## 🛠️ Tecnologías

### Frontend
- React 18
- Vite
- React Router
- TailwindCSS
- Leaflet (mapas)

### Backend
- Node.js
- Express
- SQLite (sql.js)
- JWT (autenticación)
- bcrypt (encriptación)

## 📝 API Endpoints

### Autenticación
- `POST /register` - Registrar usuario
- `POST /login` - Iniciar sesión
- `GET /validate` - Validar token

### Usuario
- `GET /perfil` - Obtener perfil
- `PUT /perfil` - Actualizar perfil
- `PUT /perfil/password` - Cambiar contraseña

### Historial
- `GET /historial` - Obtener historial
- `POST /historial` - Guardar búsqueda
- `DELETE /historial/:id` - Eliminar búsqueda

### Rutas y Paradas
- `GET /api/rutas` - Listar rutas
- `GET /api/rutas/:id` - Obtener ruta específica
- `GET /api/paradas` - Listar paradas
- `GET /api/paradas/:id` - Obtener parada específica

## 🔐 Seguridad

- Contraseñas encriptadas con bcrypt
- Autenticación con JWT
- Validación de datos en cliente y servidor
- Protección contra inyección SQL

## 🌟 Características Futuras

- Notificaciones en tiempo real
- Estimación de tiempos de llegada
- Compartir rutas con otros usuarios
- Modo oscuro
- App móvil nativa

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu característica
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o soporte, abre un issue en el repositorio.

---

Hecho con ❤️ para mejorar el transporte público en El Salvador 🇸🇻
