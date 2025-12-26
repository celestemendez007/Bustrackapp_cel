# Script para iniciar el servidor BusTrackSV
# Soluciona problemas de política de ejecución de PowerShell

# Cambiar al directorio del servidor
Set-Location $PSScriptRoot

# Iniciar el servidor usando node directamente (evita problemas con npm)
Write-Host "🚀 Iniciando servidor BusTrackSV..." -ForegroundColor Green
node src/index.js




