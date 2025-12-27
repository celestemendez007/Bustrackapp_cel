# Script para iniciar el servidor con ngrok (accesible desde internet)
# Requiere tener ngrok instalado: https://ngrok.com/download

Write-Host "🚀 Iniciando servidor BusTrackSV con ngrok..." -ForegroundColor Green
Write-Host ""

# Cambiar al directorio del servidor
Set-Location $PSScriptRoot

# Iniciar el servidor en background
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node src/index.js
}

# Esperar un momento para que el servidor inicie
Start-Sleep -Seconds 3

# Iniciar ngrok
Write-Host "🌐 Iniciando túnel ngrok..." -ForegroundColor Cyan
Write-Host "   El servidor estará disponible públicamente en unos segundos..." -ForegroundColor Yellow
Write-Host ""

# Iniciar ngrok en una nueva ventana
Start-Process ngrok -ArgumentList "http 4000"

Write-Host "✅ Servidor iniciado en background" -ForegroundColor Green
Write-Host "📋 Para ver la URL pública:" -ForegroundColor Yellow
Write-Host "   1. Abre http://localhost:4040 en tu navegador" -ForegroundColor White
Write-Host "   2. Copia la URL 'Forwarding' (ej: https://xxxx.ngrok.io)" -ForegroundColor White
Write-Host "   3. Actualiza VITE_API_URL en client/.env.local con esa URL" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Red

# Mantener el script corriendo
try {
    Wait-Job $serverJob | Out-Null
} catch {
    Stop-Job $serverJob
    Remove-Job $serverJob
}






