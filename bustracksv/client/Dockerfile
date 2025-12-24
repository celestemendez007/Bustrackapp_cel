# Dockerfile para el cliente frontend de BusTrackSV

# Etapa 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Argumento para la URL de la API (se puede pasar en build time)
ARG VITE_API_URL=http://localhost:4000

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Establecer variable de entorno para el build
ENV VITE_API_URL=$VITE_API_URL

# Construir la aplicación
RUN npm run build

# Etapa 2: Servir con nginx
FROM nginx:alpine

# Copiar archivos construidos desde la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Nginx inicia automáticamente
CMD ["nginx", "-g", "daemon off;"]

