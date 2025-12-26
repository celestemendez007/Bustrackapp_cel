# ⚠️ ADVERTENCIA DE SEGURIDAD

## Archivos Sensibles Incluidos en el Repositorio

Este repositorio ahora incluye archivos que normalmente **NO deberían** estar en Git por razones de seguridad:

### 🔴 Archivos Sensibles Incluidos:

1. **`firebase-key.json`** 
   - Contiene credenciales de Firebase
   - Si alguien tiene acceso a este archivo, puede acceder a tu proyecto de Firebase
   - **RECOMENDACIÓN**: Rotar las credenciales de Firebase después de subir esto

2. **Bases de datos SQLite (`*.sqlite`)**
   - Contienen datos de usuarios y rutas
   - Pueden incluir información personal
   - **RECOMENDACIÓN**: Asegúrate de que no contengan datos sensibles reales

3. **`node_modules/`**
   - Aunque no es un riesgo de seguridad directo, hace el repositorio muy pesado
   - Normalmente se regeneran con `npm install`
   - **RECOMENDACIÓN**: Considerar usar `.gitignore` para esto en el futuro

4. **Archivos `.env` (si existen)**
   - Contienen variables de entorno y secretos
   - Claves de API, contraseñas de base de datos, etc.
   - **RIESGO CRÍTICO**: Si tienes archivos `.env` con datos reales, RÓTALOS INMEDIATAMENTE

## 🛡️ Acciones Recomendadas

### 1. Si este es un repositorio privado:
- ✅ Asegúrate de que sea privado en GitHub
- ✅ Solo da acceso a personas de confianza
- ✅ Revisa los permisos del repositorio

### 2. Si este es un repositorio público:
- ⚠️ **EXTREMADAMENTE PELIGROSO**
- 🔴 **ROTA TODAS LAS CREDENCIALES INMEDIATAMENTE**
- 🔴 Genera nuevas claves de API
- 🔴 Cambia todas las contraseñas
- 🔴 Regenera credenciales de Firebase

### 3. Acciones Inmediatas:
1. Ve a Firebase Console → Settings → Service Accounts
2. Elimina las credenciales actuales
3. Genera nuevas credenciales
4. Actualiza `firebase-key.json` con las nuevas credenciales
5. Si tienes archivos `.env` con datos reales:
   - Cambia todas las contraseñas
   - Regenera todas las claves de API (Google Maps, JWT_SECRET, etc.)

### 4. Para el Futuro:
- Usa variables de entorno del proveedor (Render, Railway, etc.)
- Nunca subas `.env` con datos reales
- Usa `.gitignore` para archivos sensibles
- Considera usar GitHub Secrets para CI/CD

## 📋 Checklist de Seguridad

- [ ] Verificar que el repositorio sea privado (si contiene datos sensibles)
- [ ] Rotar credenciales de Firebase
- [ ] Rotar claves de API (Google Maps, etc.)
- [ ] Cambiar contraseñas de base de datos
- [ ] Regenerar JWT_SECRET
- [ ] Revisar quién tiene acceso al repositorio
- [ ] Considerar hacer el repositorio privado
- [ ] Monitorear accesos no autorizados a Firebase/APIs

---

**NOTA**: Esta advertencia fue creada porque se solicitó incluir archivos sensibles en el repositorio. Por favor, toma las medidas de seguridad apropiadas.



