# Script para iniciar ambos servidores
# Uso: .\iniciar-todo.ps1

Write-Host "🚀 Iniciando BusTrackSV..." -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor backend en nueva ventana
Write-Host "📡 Iniciando servidor backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm.cmd run dev"

# Esperar un poco
Start-Sleep -Seconds 2

# Iniciar cliente frontend en nueva ventana
Write-Host "💻 Iniciando cliente frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; npm.cmd run dev"

Write-Host ""
Write-Host "✅ Servidores iniciados en ventanas separadas" -ForegroundColor Green
Write-Host "📝 Backend: http://localhost:4000" -ForegroundColor Cyan
Write-Host "📝 Frontend: http://localhost:5173" -ForegroundColor Cyan






