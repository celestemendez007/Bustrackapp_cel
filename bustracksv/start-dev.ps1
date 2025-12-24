# Script para iniciar el proyecto BusTrackSV en modo desarrollo (Windows)
# Este script inicia la base de datos, backend y frontend

Write-Host "🚀 Iniciando BusTrackSV en modo desarrollo..." -ForegroundColor Blue

# Función para mostrar mensajes
function Show-Message {
    param($Message)
    Write-Host "[BusTrackSV] $Message" -ForegroundColor Blue
}

function Show-Success {
    param($Message)
    Write-Host "[BusTrackSV] ✅ $Message" -ForegroundColor Green
}

function Show-Warning {
    param($Message)
    Write-Host "[BusTrackSV] ⚠️  $Message" -ForegroundColor Yellow
}

function Show-Error {
    param($Message)
    Write-Host "[BusTrackSV] ❌ $Message" -ForegroundColor Red
}

# Verificar que Docker esté instalado
try {
    docker --version | Out-Null
} catch {
    Show-Error "Docker no está instalado. Por favor instala Docker Desktop primero."
    exit 1
}

# Verificar que Docker Compose esté instalado
try {
    docker-compose --version | Out-Null
} catch {
    Show-Error "Docker Compose no está instalado. Por favor instala Docker Desktop primero."
    exit 1
}

# Verificar que Node.js esté instalado
try {
    $nodeVersion = node -v
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Show-Error "Node.js versión 18+ requerida. Versión actual: $nodeVersion"
        exit 1
    }
} catch {
    Show-Error "Node.js no está instalado. Por favor instala Node.js 18+ primero."
    exit 1
}

Show-Message "Verificando archivo .env..."
if (-not (Test-Path "server\.env")) {
    Show-Warning "Archivo .env no encontrado. Creando desde config.example.js..."
    Copy-Item "server\config.example.js" "server\.env"
    Show-Warning "Por favor edita server\.env con tus valores antes de continuar."
    exit 1
}

Show-Message "Iniciando base de datos PostgreSQL..."
Set-Location server
docker-compose up -d

# Esperar a que la base de datos esté lista
Show-Message "Esperando a que la base de datos esté lista..."
Start-Sleep -Seconds 10

# Verificar que la base de datos esté funcionando
$dbStatus = docker-compose ps
if (-not ($dbStatus -match "Up")) {
    Show-Error "Error al iniciar la base de datos. Revisa los logs:"
    docker-compose logs
    exit 1
}

Show-Success "Base de datos iniciada correctamente"

Show-Message "Instalando dependencias del backend..."
if (-not (Test-Path "node_modules")) {
    npm install
}

Show-Message "Instalando dependencias del frontend..."
Set-Location ..\client
if (-not (Test-Path "node_modules")) {
    npm install
}

Show-Success "Dependencias instaladas"

Show-Message "Iniciando servidor backend en puerto 4000..."
Set-Location ..\server
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"

# Esperar a que el backend esté listo
Start-Sleep -Seconds 5

Show-Message "Iniciando frontend en puerto 5173..."
Set-Location ..\client
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"

Show-Success "¡BusTrackSV iniciado correctamente!"
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "🗄️  PgAdmin:  http://localhost:5050" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener el proyecto, presiona Ctrl+C" -ForegroundColor Yellow

# Mantener el script ejecutándose
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Show-Message "Deteniendo servicios..."
    Set-Location ..\server
    docker-compose down
    Show-Success "Servicios detenidos"
}
