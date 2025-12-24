# Script para resetear password de PostgreSQL
# Ejecutar como Administrador

Write-Host "Reseteo de Password de PostgreSQL" -ForegroundColor Cyan
Write-Host ""

# Buscar PostgreSQL
$pgDataPath = $null
$pgPaths = @(
    "C:\Program Files\PostgreSQL\18\data",
    "C:\Program Files\PostgreSQL\17\data",
    "C:\Program Files\PostgreSQL\16\data",
    "C:\Program Files\PostgreSQL\15\data",
    "C:\Program Files\PostgreSQL\14\data"
)

foreach ($path in $pgPaths) {
    if (Test-Path $path) {
        $pgDataPath = $path
        Write-Host "PostgreSQL encontrado en: $pgDataPath" -ForegroundColor Green
        break
    }
}

if ($pgDataPath -eq $null) {
    Write-Host "ERROR: No se encontro PostgreSQL" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Backup
$pgHbaPath = Join-Path $pgDataPath "pg_hba.conf"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = Join-Path $pgDataPath "pg_hba.conf.backup.$timestamp"

Write-Host "Haciendo backup..." -ForegroundColor Yellow
Copy-Item $pgHbaPath $backupPath
Write-Host "Backup: $backupPath" -ForegroundColor Green
Write-Host ""

# Modificar pg_hba.conf
Write-Host "Modificando configuracion..." -ForegroundColor Yellow
$content = Get-Content $pgHbaPath
$newContent = @()

foreach ($line in $content) {
    if ($line -match "^host\s+all\s+all\s+127\.0\.0\.1/32") {
        $newContent += "host    all             all             127.0.0.1/32            trust"
    }
    elseif ($line -match "^host\s+all\s+all\s+::1/128") {
        $newContent += "host    all             all             ::1/128                 trust"
    }
    else {
        $newContent += $line
    }
}

$newContent | Set-Content $pgHbaPath
Write-Host "Configuracion modificada" -ForegroundColor Green
Write-Host ""

# Reiniciar PostgreSQL
Write-Host "Reiniciando PostgreSQL..." -ForegroundColor Yellow
$service = Get-Service | Where-Object { $_.Name -like "postgresql*" } | Select-Object -First 1

if ($service) {
    Restart-Service $service.Name -Force
    Start-Sleep -Seconds 3
    Write-Host "PostgreSQL reiniciado" -ForegroundColor Green
}
else {
    Write-Host "No se encontro el servicio de PostgreSQL" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Edita server\.env y pon:" -ForegroundColor White
Write-Host "   DB_PASSWORD=" -ForegroundColor Cyan
Write-Host "   (dejalo vacio)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Prueba:" -ForegroundColor White
Write-Host "   cd server" -ForegroundColor Cyan
Write-Host "   node find-password.js" -ForegroundColor Cyan
Write-Host ""




