# 🔍 Probar el Endpoint /login Directamente

## Problema
El backend está funcionando (health responde), pero /login da 404.

## Prueba 1: Verificar que el endpoint existe

Abre en tu navegador o usa curl:

```
https://bustracksv-backend.onrender.com/login
```

Si da 404, el endpoint no está registrado correctamente.

## Prueba 2: Ver los logs del backend

1. Ve a Render → `bustracksv-backend` → **"Logs"**
2. Intenta hacer login desde el frontend
3. Busca en los logs si aparece algún error cuando intentas hacer login
4. Copia aquí cualquier error que veas

## Prueba 3: Verificar que el usuario existe en PostgreSQL

En DBeaver, ejecuta:

```sql
SELECT id, usuario, email, rol, activo 
FROM usuarios 
WHERE usuario = 'admin_celeste';
```

Debe mostrar el usuario con:
- `rol` = `'admin'`
- `activo` = `true`

## Posibles Problemas:

### 1. El endpoint no está registrado
- Verifica en los logs que el servidor arrancó sin errores
- Busca mensajes de error sobre rutas no encontradas

### 2. El servidor se reinició y perdió las rutas
- Haz un redeploy del backend

### 3. Hay un error en el código que impide que las rutas se registren
- Revisa los logs para ver errores al iniciar

