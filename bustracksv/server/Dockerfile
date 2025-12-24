# Dockerfile para el servidor backend de BusTrackSV

FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Exponer el puerto del servidor
EXPOSE 4000

# Comando para iniciar el servidor
CMD ["node", "src/index.js"]

