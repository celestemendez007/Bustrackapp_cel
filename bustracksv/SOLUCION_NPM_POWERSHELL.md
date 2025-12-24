# 🔧 Solución: Error de npm en PowerShell

## ❌ Problema
```
npm : No se puede cargar el archivo C:\Program Files\nodejs\npm.ps1. 
El archivo no está firmado digitalmente.
```

## ✅ Soluciones

### **Opción 1: Usar `npm.cmd` (Más Rápido - Recomendado)**

En lugar de `npm`, usa `npm.cmd`:

```powershell
# En lugar de:
npm run dev

# Usa:
npm.cmd run dev
```

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ No requiere cambiar configuraciones del sistema
- ✅ Es seguro

---

### **Opción 2: Cambiar Política de Ejecución (Permanente)**

#### Para la Sesión Actual (Temporal):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

#### Para el Usuario Actual (Permanente):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Luego ejecuta:**
```powershell
npm run dev
```

---

### **Opción 3: Usar CMD en lugar de PowerShell**

1. Abre **CMD** (no PowerShell)
2. Navega a la carpeta:
   ```cmd
   cd C:\Users\mende\Desktop\bustracksv\server
   ```
3. Ejecuta:
   ```cmd
   npm run dev
   ```

---

### **Opción 4: Crear Scripts de Inicio**

Crea archivos `.bat` o `.ps1` que ejecuten los comandos:

#### `iniciar-servidor.bat`
```batch
@echo off
cd server
call npm.cmd start
pause
```

#### `iniciar-cliente.bat`
```batch
@echo off
cd client
call npm.cmd run dev
pause
```

---

## 🚀 **Solución Recomendada para Este Proyecto**

### Usar `npm.cmd` siempre:

```powershell
# Servidor
cd server
npm.cmd run dev

# Cliente (en otra terminal)
cd client
npm.cmd run dev
```

---

## 📝 **Comandos Completos para Este Proyecto**

### Terminal 1 - Backend:
```powershell
cd C:\Users\mende\Desktop\bustracksv\server
npm.cmd run dev
```

### Terminal 2 - Frontend:
```powershell
cd C:\Users\mende\Desktop\bustracksv\client
npm.cmd run dev
```

### Crear Usuario Admin:
```powershell
cd C:\Users\mende\Desktop\bustracksv\server
npm.cmd run create-admin
```

---

## ⚠️ **Nota de Seguridad**

La política de ejecución de PowerShell está diseñada para proteger tu sistema. Si cambias la política, asegúrate de:
- Solo cambiar a `RemoteSigned` (no `Unrestricted`)
- Solo para `CurrentUser` (no para todo el sistema)
- Entender los riesgos

---

## ✅ **Verificación**

Después de aplicar la solución, verifica que funciona:

```powershell
npm.cmd --version
```

Debería mostrar la versión de npm sin errores.






