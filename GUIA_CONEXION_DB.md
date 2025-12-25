# 🔌 Guía: Cómo Conectar a la Base de Datos PostgreSQL en Render

## 📋 Información que Necesitas

Para que tu aplicación se conecte a PostgreSQL en Render, **solo necesitas una cosa**:

### ✅ DATABASE_URL

Esta es una URL que contiene toda la información de conexión en un solo string.

Formato:
```
postgresql://usuario:contraseña@host:puerto/nombre_base_datos
```

Ejemplo:
```
postgresql://bustracksv_user:abc123xyz@dpg-xxxxx-a.oregon-postgres.render.com:5432/bustracksv_db
```

---

## 🔍 Cómo Obtener la DATABASE_URL en Render

### Paso 1: Ir a tu Base de Datos PostgreSQL

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Busca tu servicio de base de datos PostgreSQL (ej: `bustracksv-db`)
3. Click en el nombre del servicio

### Paso 2: Copiar la DATABASE_URL

En la página de tu base de datos, verás una sección llamada **"Connection Information"** o **"Info"** con varias formas de conexión:

**Opción A: Internal Database URL (Para servicios en Render)**
- Esta es la que debes usar si tu backend también está en Render
- Se ve así: `postgresql://user:password@host:5432/dbname`
- Click en **"Copy"** para copiarla

**Opción B: External Connection String (Para conectar desde fuera)**
- Esta es útil si quieres conectarte desde tu computadora para ejecutar scripts SQL
- También contiene toda la información necesaria

### Paso 3: Verificar que Tienes Todos los Componentes

La DATABASE_URL debe incluir:
- ✅ `postgresql://` (protocolo)
- ✅ Usuario (ej: `bustracksv_user`)
- ✅ Contraseña (después de `:`)
- ✅ Host (ej: `dpg-xxxxx-a.oregon-postgres.render.com`)
- ✅ Puerto (generalmente `5432`)
- ✅ Nombre de la base de datos (ej: `bustracksv_db`)

---

## ⚙️ Dónde Configurar la DATABASE_URL

### En Render (Para Producción):

1. Ve a tu servicio **`bustracksv-backend`** en Render
2. Click en **"Environment"** (en el menú lateral izquierdo)
3. Busca la variable `DATABASE_URL` o click en **"Add Environment Variable"**
4. **Key:** `DATABASE_URL`
5. **Value:** Pega la URL completa que copiaste (ej: `postgresql://user:pass@host:5432/dbname`)
6. **IMPORTANTE:** No agregues comillas alrededor del valor
7. Click en **"Save Changes"**
8. Render reiniciará automáticamente tu backend

---

## 🧪 Verificar que la Conexión Funciona

### Método 1: Revisar los Logs en Render

1. Ve a tu servicio `bustracksv-backend` en Render
2. Click en **"Logs"**
3. Busca mensajes como:
   - ✅ `✅ Conexión a PostgreSQL exitosa`
   - ✅ `☁️ Modo Cloud: Usando PostgreSQL`
   - ❌ Si ves errores de conexión, verifica que la DATABASE_URL esté correcta

### Método 2: Probar el Endpoint de Health

1. Abre en tu navegador: `https://tu-backend.onrender.com/health`
2. Debe responder con algo como `{"status":"ok"}`

### Método 3: Usar un Script de Prueba Local (Opcional)

Si quieres probar la conexión desde tu computadora:

1. Crea un archivo `.env` en `bustracksv/server/` con:
   ```
   DATABASE_URL=postgresql://usuario:contraseña@host:puerto/dbname
   ```

2. Ejecuta:
   ```powershell
   cd bustracksv/server
   node test-connection.js
   ```

---

## 🔐 Seguridad: Nunca Compartas tu DATABASE_URL

⚠️ **IMPORTANTE:**
- La DATABASE_URL contiene tu contraseña
- **NUNCA** la subas a GitHub o la compartas públicamente
- Render la guarda de forma segura en las variables de entorno
- Solo úsala en variables de entorno, nunca en el código

---

## ❓ ¿Qué Pasa Si No Tengo la Base de Datos Creada?

Si aún no has creado la base de datos PostgreSQL en Render:

1. Ve a tu dashboard de Render
2. Click en **"New +"** (esquina superior derecha)
3. Selecciona **"PostgreSQL"**
4. Configura:
   - **Name:** `bustracksv-db` (o el nombre que prefieras)
   - **Database:** `bustracksv` (nombre de la base de datos)
   - **User:** `bustracksv` (nombre de usuario)
   - **Plan:** Starter (gratis) o el que prefieras
5. Click en **"Create Database"**
6. Espera a que se cree (toma unos minutos)
7. Una vez creada, sigue los pasos anteriores para obtener la DATABASE_URL

---

## 🎯 Resumen

**Lo único que necesitas:**
1. ✅ Crear base de datos PostgreSQL en Render (si no existe)
2. ✅ Copiar la `DATABASE_URL` de Render
3. ✅ Agregarla como variable de entorno en tu backend en Render
4. ✅ Verificar en los logs que se conectó correctamente

**¡Eso es todo!** Tu código ya está configurado para usar PostgreSQL automáticamente cuando detecta la variable `DATABASE_URL`.

