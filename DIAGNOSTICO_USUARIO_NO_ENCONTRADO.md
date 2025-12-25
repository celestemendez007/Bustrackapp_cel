# 🔍 Diagnóstico: "Usuario no encontrado"

## Problema más común: Backend usando SQLite en lugar de PostgreSQL

El backend puede estar buscando en SQLite (base de datos local vacía) en lugar de PostgreSQL (donde está tu usuario).

---

## ✅ Verificación Rápida

### 1. Verifica en DBeaver que el usuario existe:

```sql
SELECT * FROM usuarios WHERE usuario = 'admin_celeste';
```

Si **SÍ aparece** → El usuario está en PostgreSQL ✅
Si **NO aparece** → El usuario no existe, créalo de nuevo

---

### 2. Verifica qué base de datos está usando el backend:

**En Render:**
1. Ve a `bustracksv-backend` → **"Logs"**
2. Busca al inicio de los logs cuando el servidor arranca:
   - ✅ **Bien:** `☁️ Modo Cloud: Usando PostgreSQL`
   - ❌ **Mal:** `💾 Modo Local: Usando SQLite`

Si dice SQLite, el backend NO está conectado a PostgreSQL.

---

### 3. Verifica Variables de Entorno:

1. Ve a `bustracksv-backend` → **"Environment"**
2. Verifica que existe:
   - `DATABASE_URL` = `postgresql://...` (debe empezar con `postgresql://`)
   - Si no existe o está vacía → **Ese es el problema**

---

## 🔧 Solución

### Si DATABASE_URL NO está configurada:

1. Ve a tu base de datos PostgreSQL en Render
2. Copia la **"Internal Database URL"**
3. Ve a `bustracksv-backend` → **"Environment"**
4. Agrega:
   - **Key:** `DATABASE_URL`
   - **Value:** (pega la URL completa)
5. Click en **"Save Changes"**
6. Render reiniciará automáticamente el backend

---

### Si DATABASE_URL SÍ está configurada pero sigue usando SQLite:

1. Verifica que la URL sea correcta (debe empezar con `postgresql://`)
2. Haz un **"Manual Deploy"** o **"Redeploy"** del backend
3. Espera a que termine el deploy
4. Revisa los logs de nuevo para confirmar que dice "PostgreSQL"

---

### Si el usuario NO existe en PostgreSQL:

Ejecuta esto en DBeaver:

```sql
-- Agregar columna rol si no existe
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';

-- Crear el usuario completo
INSERT INTO usuarios (usuario, email, password, nombre_completo, activo, rol) 
VALUES (
  'admin_celeste', 
  'celeste.mendez007@gmail.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Celeste Mendez', 
  true,
  'admin'
);
```

---

## 🧪 Probar la Conexión

Después de corregir, prueba el login de nuevo:
- URL: `https://tu-frontend.onrender.com/admin/login`
- Usuario: `admin_celeste`
- Contraseña: `123456`

---

## Resumen

**El problema casi siempre es:**
1. ❌ `DATABASE_URL` no configurada → Backend usa SQLite
2. ✅ Usuario está en PostgreSQL, pero backend busca en SQLite
3. ✅ Resultado: "Usuario no encontrado"

**La solución:**
1. Configurar `DATABASE_URL` correctamente
2. Redeploy del backend
3. Verificar logs que diga "PostgreSQL"

