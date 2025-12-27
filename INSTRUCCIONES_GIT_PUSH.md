# 🔐 Instrucciones para Subir Código a GitHub

El código ya está preparado y con commit hecho, pero necesitas autenticarte en GitHub para hacer el push.

## ✅ Estado Actual

- ✅ Repositorio Git inicializado
- ✅ Todos los archivos agregados (178 archivos)
- ✅ Commit realizado
- ⏳ Falta: Autenticación para hacer push

## 🔑 Opción 1: Personal Access Token (Recomendado)

1. **Crear un Personal Access Token:**
   - Ve a: https://github.com/settings/tokens
   - Click en "Generate new token" → "Generate new token (classic)"
   - Nombre: "BusTrackSV"
   - Selecciona el scope `repo` (acceso completo a repositorios)
   - Click en "Generate token"
   - **COPIA EL TOKEN** (solo se muestra una vez)

2. **Hacer push usando el token:**
   ```powershell
   cd "C:\Users\mende\Desktop\bustracksv - copia"
   git push -u origin main
   ```
   - Cuando pida Username: `celestemendez007`
   - Cuando pida Password: **PEGA EL TOKEN** (no tu contraseña de GitHub)

## 🔑 Opción 2: GitHub CLI (Más fácil)

1. **Instalar GitHub CLI:**
   - Descarga desde: https://cli.github.com/
   - O instala con winget: `winget install --id GitHub.cli`

2. **Autenticarte:**
   ```powershell
   gh auth login
   ```
   - Selecciona GitHub.com
   - Selecciona HTTPS
   - Selecciona "Login with a web browser"
   - Sigue las instrucciones

3. **Hacer push:**
   ```powershell
   cd "C:\Users\mende\Desktop\bustracksv - copia"
   git push -u origin main
   ```

## 🔑 Opción 3: Configurar Credenciales en Windows

Si Git está usando credenciales incorrectas:

1. **Limpiar credenciales guardadas:**
   ```powershell
   # Ir a Panel de Control → Credenciales de Windows → Credenciales de Windows
   # O usar:
   cmdkey /list
   # Buscar y eliminar cualquier entrada de github.com
   ```

2. **Configurar Git con tu usuario:**
   ```powershell
   git config --global user.name "celestemendez007"
   git config --global user.email "tu-email-que-usas-en-github@ejemplo.com"
   ```

3. **Hacer push (te pedirá credenciales):**
   ```powershell
   cd "C:\Users\mende\Desktop\bustracksv - copia"
   git push -u origin main
   ```

## 🚀 Después del Push

Una vez que el push sea exitoso:

1. Ve a: https://github.com/celestemendez007/Bustrackapp_cel
2. Verifica que todos los archivos estén ahí
3. Ya puedes conectarlo a Render/Railway para desplegar

## 📝 Notas Importantes

- **NUNCA** subas archivos `.env` con valores reales
- El archivo `firebase-key.json` está en `.gitignore` y NO se subirá
- Los archivos de base de datos SQLite también están ignorados

---

**¿Tienes problemas?** Verifica que:
- Tu usuario de GitHub sea `celestemendez007`
- Tengas permisos de escritura en el repositorio
- El repositorio exista en GitHub





