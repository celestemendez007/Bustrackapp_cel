# 🌍 Acceso Global - BusTrackSV desde Cualquier Red

## Problema Actual

Tu servidor solo es accesible desde la misma red WiFi local. Para que funcione desde **cualquier red** necesitas exponerlo a internet.

## Soluciones

### 🚀 Opción 1: Vercel (Recomendado - Gratis y Profesional)

**Ventajas:**
- ✅ Gratis
- ✅ URL permanente
- ✅ HTTPS automático
- ✅ Accesible desde cualquier parte del mundo
- ✅ Auto-scaling

**Pasos:**

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy del backend:**
   ```bash
   cd bustracksv/server
   vercel
   ```
   Sigue las instrucciones. Al final te dará una URL como:
   ```
   https://bustracksv-api.vercel.app
   ```

3. **Configurar variables de entorno en Vercel:**
   - Ve a https://vercel.com/dashboard
   - Selecciona tu proyecto
   - Settings → Environment Variables
   - Agrega: `JWT_SECRET`, `GOOGLE_MAPS_API_KEY`, etc.

4. **Actualizar frontend:**
   ```bash
   cd bustracksv/client
   ```
   Edita `.env.local`:
   ```env
   VITE_API_URL=https://bustracksv-api.vercel.app
   ```

5. **Deploy del frontend:**
   ```bash
   vercel
   ```

**¡Listo!** Tu app estará en `https://tu-proyecto.vercel.app`

---

### ⚡ Opción 2: ngrok (Rápido para Pruebas)

**Ventajas:**
- ✅ Muy rápido de configurar
- ✅ Perfecto para pruebas

**Desventajas:**
- ❌ URL cambia cada vez (a menos que tengas cuenta paga)
- ❌ No es para producción

**Pasos:**

1. **Instalar ngrok:**
   - Descarga: https://ngrok.com/download
   - O: `choco install ngrok` (si tienes Chocolatey)

2. **Iniciar servidor:**
   ```bash
   cd bustracksv/server
   node src/index.js
   ```

3. **En otra terminal, iniciar ngrok:**
   ```bash
   ngrok http 4000
   ```

4. **Copiar la URL pública:**
   ngrok mostrará algo como:
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:4000
   ```

5. **Actualizar frontend:**
   En `client/.env.local`:
   ```env
   VITE_API_URL=https://abc123.ngrok.io
   ```

6. **Reiniciar frontend:**
   ```bash
   cd bustracksv/client
   npm run dev
   ```

**⚠️ Nota:** Cada vez que reinicies ngrok, la URL cambiará. Para URL fija, necesitas cuenta paga de ngrok.

---

### 🔧 Opción 3: Configurar Router (Avanzado)

Si tienes acceso a tu router, puedes:

1. Configurar port forwarding (puerto 4000)
2. Obtener IP pública (puede cambiar)
3. Configurar DNS dinámico (No-IP, DuckDNS)

**No recomendado** para producción, pero funciona.

---

## 🎯 Recomendación

### Para Desarrollo/Pruebas:
Usa **ngrok** - Es lo más rápido

### Para Producción:
Usa **Vercel** - Es gratis, profesional y escalable

---

## 📝 Checklist Rápido (Vercel)

- [ ] `npm install -g vercel`
- [ ] `vercel login`
- [ ] `cd server && vercel` (deploy backend)
- [ ] Copiar URL del backend
- [ ] Configurar variables de entorno en Vercel Dashboard
- [ ] Actualizar `client/.env.local` con URL del backend
- [ ] `cd client && vercel` (deploy frontend)
- [ ] ¡Probar desde cualquier dispositivo!

---

## 🆘 Troubleshooting

### "Cannot connect to API"
- Verifica que la URL en `.env.local` sea correcta
- Verifica que el backend esté desplegado
- Revisa CORS en el backend

### "CORS error"
- Agrega tu dominio frontend a `ALLOWED_ORIGINS` en Vercel
- O usa `ALLOWED_ORIGINS=*` para desarrollo (no recomendado en producción)

### "ngrok URL cambia"
- Crea cuenta gratuita en ngrok.com
- Configura authtoken: `ngrok authtoken TU_TOKEN`
- Usa: `ngrok http 4000 --domain=tu-dominio.ngrok.io` (requiere plan pago)

---

**¿Necesitas ayuda?** Revisa `DEPLOY_VERCEL.md` para instrucciones detalladas.


