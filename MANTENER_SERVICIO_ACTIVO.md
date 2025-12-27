# 🚀 Cómo Mantener el Servicio Activo en Render (Evitar Sleep)

En el plan gratuito de Render, los servicios se "duermen" después de 15 minutos de inactividad. Cuando alguien intenta acceder, el servicio tarda unos segundos en "despertarse", mostrando la pantalla de "WELCOME TO RENDER".

## ✅ Solución: Usar un Servicio de Ping Automático

### Opción 1: UptimeRobot (Recomendado - Gratis)

**UptimeRobot** es un servicio gratuito que puede hacer pings a tu servicio cada 5 minutos para mantenerlo activo.

#### Pasos:

1. **Crear cuenta en UptimeRobot:**
   - Ve a: https://uptimerobot.com/
   - Haz clic en "Sign Up" (es gratis)
   - Crea una cuenta

2. **Agregar un monitor:**
   - Una vez dentro, haz clic en **"+ Add New Monitor"**
   - Selecciona **"HTTP(s)"** como tipo de monitor
   - Completa los campos:
     - **Friendly Name:** `BusTrackSV Keep-Alive`
     - **URL:** `https://bustrackapp-cel.onrender.com/health`
     - **Monitoring Interval:** `5 minutes` (mínimo permitido en plan gratuito)
   - Haz clic en **"Create Monitor"**

3. **¡Listo!**
   - UptimeRobot hará un ping cada 5 minutos a tu endpoint `/health`
   - Esto mantendrá tu servicio activo y evitará que se duerma

---

### Opción 2: cron-job.org (Alternativa Gratuita)

**cron-job.org** es otro servicio gratuito que puede hacer pings periódicos.

#### Pasos:

1. **Crear cuenta:**
   - Ve a: https://cron-job.org/
   - Haz clic en "Sign Up" (es gratis)
   - Crea una cuenta

2. **Crear un cron job:**
   - Haz clic en **"Create cronjob"**
   - Completa los campos:
     - **Title:** `BusTrackSV Keep-Alive`
     - **Address:** `https://bustrackapp-cel.onrender.com/health`
     - **Schedule:** Selecciona **"Every 5 minutes"**
   - Haz clic en **"Create cronjob"**

3. **¡Listo!**
   - El servicio hará pings cada 5 minutos

---

### Opción 3: Usar GitHub Actions (Si tienes el código en GitHub)

Puedes crear un workflow de GitHub Actions que haga pings periódicos.

#### Pasos:

1. **Crear el archivo de workflow:**
   - En tu repositorio, crea: `.github/workflows/keep-alive.yml`
   - Agrega este contenido:

```yaml
name: Keep Service Alive

on:
  schedule:
    # Ejecutar cada 10 minutos
    - cron: '*/10 * * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping service
        run: |
          curl -f https://bustrackapp-cel.onrender.com/health || exit 0
```

2. **Commit y push:**
   ```bash
   git add .github/workflows/keep-alive.yml
   git commit -m "Add keep-alive workflow"
   git push
   ```

3. **¡Listo!**
   - GitHub Actions hará pings cada 10 minutos automáticamente

---

## 📊 Comparación de Opciones

| Opción | Gratis | Intervalo Mínimo | Facilidad |
|--------|--------|-------------------|-----------|
| **UptimeRobot** | ✅ Sí | 5 minutos | ⭐⭐⭐ Muy fácil |
| **cron-job.org** | ✅ Sí | 1 minuto | ⭐⭐ Fácil |
| **GitHub Actions** | ✅ Sí | 1 minuto | ⭐ Requiere GitHub |

## 🎯 Recomendación

**Usa UptimeRobot** porque:
- ✅ Es el más fácil de configurar
- ✅ Tiene una interfaz muy clara
- ✅ 5 minutos es suficiente para mantener el servicio activo
- ✅ Es completamente gratuito
- ✅ Te notifica si el servicio está caído

## ⚠️ Nota Importante

- El plan gratuito de Render permite que los servicios se duerman después de 15 minutos
- Con pings cada 5 minutos, el servicio **nunca se dormirá**
- Si necesitas garantía 100% de que el servicio nunca se duerma, considera actualizar a un plan de pago

## 🔍 Verificar que Funciona

1. Configura uno de los servicios de ping
2. Espera 10-15 minutos
3. Intenta acceder a tu aplicación
4. Si no ves la pantalla de "WELCOME TO RENDER", ¡funciona! ✅

---

## 📝 Endpoint de Health Check

Tu aplicación ya tiene un endpoint `/health` configurado en:
- URL: `https://bustrackapp-cel.onrender.com/health`
- Método: `GET`
- Respuesta: `{ status: "OK", timestamp: "..." }`

Este endpoint es perfecto para los pings porque:
- ✅ Es ligero (no hace consultas pesadas)
- ✅ Responde rápido
- ✅ Verifica que el servicio está funcionando





