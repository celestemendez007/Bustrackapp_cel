# Script simple para reiniciar PostgreSQL
Write-Host "Reiniciando PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

# Buscar el servicio de PostgreSQL
$service = Get-Service | Where-Object { $_.DisplayName -like "*PostgreSQL*" } | Select-Object -First 1

if ($service) {
    Write-Host "Servicio encontrado: $($service.DisplayName)" -ForegroundColor Green
    Write-Host "Estado actual: $($service.Status)" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Deteniendo PostgreSQL..." -ForegroundColor Yellow
    net stop $service.Name
    Start-Sleep -Seconds 3
    
    Write-Host "Iniciando PostgreSQL..." -ForegroundColor Yellow
    net start $service.Name
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "PostgreSQL reiniciado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
    Write-Host "node find-password.js" -ForegroundColor White
}
else {
    Write-Host "No se encontro el servicio de PostgreSQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Reinicialo manualmente:" -ForegroundColor Yellow
    Write-Host "1. Presiona Windows + R" -ForegroundColor White
    Write-Host "2. Escribe: services.msc" -ForegroundColor White
    Write-Host "3. Busca: postgresql-x64-18" -ForegroundColor White
    Write-Host "4. Click derecho -> Reiniciar" -ForegroundColor White
}




