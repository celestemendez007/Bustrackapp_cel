# Guía: Acceder a BusTrackSV desde tu Teléfono

## Problema: Pantalla en Blanco

Si ves una pantalla en blanco al acceder desde tu teléfono, es porque el frontend está intentando conectarse a `localhost:4000`, pero desde el teléfono `localhost` apunta al teléfono mismo, no a tu computadora.

## Solución

### Paso 1: Encuentra la IP de tu Computadora

**En Windows (PowerShell o CMD):**
```powershell
ipconfig
```

Busca la línea que dice **"IPv4 Address"** bajo tu adaptador de red WiFi. 
Ejemplo: `192.168.1.100`

**En Mac/Linux:**
```bash
ifconfig | grep "inet "
# o
ip addr show
```

### Paso 2: Configura la URL del API en el Cliente

1. Ve a la carpeta `client/`
2. Crea un archivo llamado `.env.local` (si no existe)
3. Agrega esta línea, reemplazando `TU_IP` con la IP que encontraste:

```env
VITE_API_URL=http://TU_IP:4000
```

**Ejemplo:**
```env
VITE_API_URL=http://192.168.1.100:4000
```

### Paso 3: Reinicia el Servidor de Desarrollo

1. Detén el servidor del cliente (Ctrl+C)
2. Inícialo de nuevo:
```bash
npm run dev
```

### Paso 4: Accede desde tu Teléfono

1. Asegúrate de que tu teléfono esté en la **misma red WiFi** que tu computadora
2. Abre el navegador en tu teléfono
3. Ve a: `http://TU_IP:5173` (reemplaza TU_IP con la IP de tu computadora)

**Ejemplo:**
```
http://192.168.1.100:5173
```

## Verificación

### El servidor debe mostrar:
```
Servidor BusTrackSV corriendo en http://localhost:4000
Servidor también accesible desde la red local
```

### El cliente debe mostrar:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://TU_IP:5173/
```

## Solución de Problemas

### Si aún ves pantalla en blanco:

1. **Verifica que ambos servidores estén corriendo:**
   - Servidor backend: `http://localhost:4000`
   - Cliente frontend: `http://localhost:5173`

2. **Verifica la conexión desde el teléfono:**
   - Abre el navegador en el teléfono
   - Ve a: `http://TU_IP:4000`
   - Deberías ver: `{"message":"Backend BusTrackSV funcionando",...}`

3. **Verifica el firewall:**
   - Asegúrate de que Windows Firewall permita conexiones en los puertos 4000 y 5173
   - O desactiva temporalmente el firewall para probar

4. **Verifica la red:**
   - Ambos dispositivos deben estar en la misma red WiFi
   - No uses datos móviles en el teléfono

5. **Revisa la consola del navegador:**
   - En el teléfono, abre las herramientas de desarrollador (si es posible)
   - O usa Chrome Remote Debugging para ver los errores

## Nota Importante

La IP de tu computadora puede cambiar cada vez que te conectas a una red diferente. Si cambias de red WiFi, necesitarás actualizar el archivo `.env.local` con la nueva IP.






