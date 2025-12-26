# ⚡ Solución Rápida - Acceso desde Cualquier Red

## 🎯 Opción Más Rápida: ngrok (2 minutos)

### Paso 1: Instalar ngrok

**Opción A - Descarga directa:**
1. Ve a: https://ngrok.com/download
2. Descarga para Windows
3. Extrae `ngrok.exe` a una carpeta (ej: `C:\ngrok\`)
4. Agrega esa carpeta al PATH o úsalo desde ahí

**Opción B - Con Chocolatey (si lo tienes):**
```powershell
choco install ngrok
```

### Paso 2: Iniciar tu servidor

En una terminal PowerShell:
```powershell
cd "C:\Users\mende\Desktop\bustracksv - copia\bustracksv\server"
node src/index.js
```

Deja esta terminal abierta.

### Paso 3: Iniciar ngrok (Nueva terminal)

Abre **otra terminal PowerShell** y ejecuta:
```powershell
ngrok http 4000
```

Verás algo como:
```
Forwarding: https://abc123def456.ngrok-free.app -> http://localhost:4000
```

**¡Copia esa URL!** (la que empieza con `https://`)

### Paso 4: Actualizar Frontend

Abre `bustracksv/client/.env.local` y cambia:
```env
VITE_API_URL=https://abc123def456.ngrok-free.app
```
(Reemplaza con tu URL de ngrok)

### Paso 5: Reiniciar Frontend

```powershell
cd "C:\Users\mende\Desktop\bustracksv - copia\bustracksv\client"
npm run dev
```

### ✅ ¡Listo!

Ahora puedes acceder desde **cualquier dispositivo en cualquier red** usando la URL de ngrok.

---

## 🚀 Opción Profesional: Vercel (10 minutos, pero permanente)

Si quieres una solución permanente y profesional:

### 1. Instalar Vercel CLI
```powershell
npm install -g vercel
```

### 2. Deploy Backend
```powershell
cd "C:\Users\mende\Desktop\bustracksv - copia\bustracksv\server"
vercel
```

Sigue las instrucciones. Te dará una URL como:
```
https://bustracksv-api.vercel.app
```

### 3. Configurar Variables en Vercel Dashboard
- Ve a: https://vercel.com/dashboard
- Selecciona tu proyecto
- Settings → Environment Variables
- Agrega: `JWT_SECRET` (genera uno: `openssl rand -base64 32`)

### 4. Actualizar Frontend
En `client/.env.local`:
```env
VITE_API_URL=https://bustracksv-api.vercel.app
```

### 5. Deploy Frontend
```powershell
cd "C:\Users\mende\Desktop\bustracksv - copia\bustracksv\client"
vercel
```

### ✅ ¡Listo para Producción!

Tu app estará en `https://tu-proyecto.vercel.app` y será accesible desde **cualquier parte del mundo**.

---

## 📱 Probar desde tu Teléfono

1. **Con ngrok:**
   - Abre el navegador en tu teléfono
   - Ve a: `http://localhost:5173` (si estás en la misma red)
   - O mejor: despliega el frontend también con ngrok o Vercel

2. **Con Vercel:**
   - Abre: `https://tu-proyecto.vercel.app` desde cualquier dispositivo

---

## ⚠️ Notas Importantes

### ngrok:
- La URL cambia cada vez que reinicias ngrok
- Para URL fija, necesitas cuenta paga
- Perfecto para pruebas rápidas

### Vercel:
- URL permanente
- Gratis para proyectos personales
- Perfecto para producción
- HTTPS automático

---

## 🆘 Problemas Comunes

### "ngrok no se reconoce como comando"
- Asegúrate de que ngrok.exe esté en una carpeta del PATH
- O usa la ruta completa: `C:\ruta\a\ngrok.exe http 4000`

### "CORS error"
- Verifica que `ALLOWED_ORIGINS` en el backend incluya tu dominio
- O temporalmente usa `*` para desarrollo

### "Cannot connect"
- Verifica que el servidor esté corriendo en el puerto 4000
- Verifica que ngrok esté apuntando al puerto correcto

---

**¿Cuál usar?**
- **Pruebas rápidas**: ngrok
- **Producción**: Vercel





