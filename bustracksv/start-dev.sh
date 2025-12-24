#!/bin/bash

# Script para iniciar el proyecto BusTrackSV en modo desarrollo
# Este script inicia la base de datos, backend y frontend

echo "🚀 Iniciando BusTrackSV en modo desarrollo..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
show_message() {
    echo -e "${BLUE}[BusTrackSV]${NC} $1"
}

show_success() {
    echo -e "${GREEN}[BusTrackSV]${NC} ✅ $1"
}

show_warning() {
    echo -e "${YELLOW}[BusTrackSV]${NC} ⚠️  $1"
}

show_error() {
    echo -e "${RED}[BusTrackSV]${NC} ❌ $1"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    show_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    show_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    show_error "Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    show_error "Node.js versión 18+ requerida. Versión actual: $(node -v)"
    exit 1
fi

show_message "Verificando archivo .env..."
if [ ! -f "server/.env" ]; then
    show_warning "Archivo .env no encontrado. Creando desde config.example.js..."
    cp server/config.example.js server/.env
    show_warning "Por favor edita server/.env con tus valores antes de continuar."
    exit 1
fi

show_message "Iniciando base de datos PostgreSQL..."
cd server
docker-compose up -d

# Esperar a que la base de datos esté lista
show_message "Esperando a que la base de datos esté lista..."
sleep 10

# Verificar que la base de datos esté funcionando
if ! docker-compose ps | grep -q "Up"; then
    show_error "Error al iniciar la base de datos. Revisa los logs:"
    docker-compose logs
    exit 1
fi

show_success "Base de datos iniciada correctamente"

show_message "Instalando dependencias del backend..."
if [ ! -d "node_modules" ]; then
    npm install
fi

show_message "Instalando dependencias del frontend..."
cd ../client
if [ ! -d "node_modules" ]; then
    npm install
fi

show_success "Dependencias instaladas"

show_message "Iniciando servidor backend en puerto 4000..."
cd ../server
npm run dev &
BACKEND_PID=$!

# Esperar a que el backend esté listo
sleep 5

show_message "Iniciando frontend en puerto 5173..."
cd ../client
npm run dev &
FRONTEND_PID=$!

show_success "¡BusTrackSV iniciado correctamente!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:4000"
echo "🗄️  PgAdmin:  http://localhost:5050"
echo ""
echo "Para detener el proyecto, presiona Ctrl+C"

# Función para limpiar procesos al salir
cleanup() {
    show_message "Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    cd ../server
    docker-compose down
    show_success "Servicios detenidos"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Mantener el script ejecutándose
wait
