# Script para configurar ngrok automáticamente
Write-Host "🌐 Configurando ngrok para acceso global..." -ForegroundColor Cyan
Write-Host ""

# Esperar a que ngrok esté listo
Write-Host "⏳ Esperando que ngrok inicie..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$maxAttempts = 10
$attempt = 0
$ngrokUrl = $null

while ($attempt -lt $maxAttempts -and !$ngrokUrl) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction Stop
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            $ngrokUrl = $response.tunnels[0].public_url
            Write-Host "✅ URL de ngrok encontrada: $ngrokUrl" -ForegroundColor Green
            break
        }
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Host "   Intento $attempt/$maxAttempts..." -ForegroundColor Gray
            Start-Sleep -Seconds 3
        }
    }
}

if (!$ngrokUrl) {
    Write-Host ""
    Write-Host "⚠️  No se pudo obtener la URL automáticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Por favor:" -ForegroundColor Cyan
    Write-Host "   1. Abre tu navegador en: http://localhost:4040" -ForegroundColor White
    Write-Host "   2. Copia la URL que aparece en 'Forwarding' (ej: https://xxxx.ngrok-free.app)" -ForegroundColor White
    Write-Host "   3. Ejecuta este comando reemplazando TU_URL:" -ForegroundColor White
    Write-Host ""
    Write-Host "   `$url = 'TU_URL_AQUI'; (Get-Content 'bustracksv\client\.env.local') -replace 'VITE_API_URL=.*', \"VITE_API_URL=`$url\" | Set-Content 'bustracksv\client\.env.local'" -ForegroundColor Gray
    Write-Host ""
    exit
}

# Actualizar .env.local del cliente
$envFile = "bustracksv\client\.env.local"
$envPath = Join-Path $PSScriptRoot $envFile

if (Test-Path $envPath) {
    Write-Host "📝 Actualizando $envFile..." -ForegroundColor Cyan
    $content = Get-Content $envPath -Raw
    
    if ($content -match 'VITE_API_URL=') {
        $content = $content -replace 'VITE_API_URL=.*', "VITE_API_URL=$ngrokUrl"
    } else {
        $content += "`nVITE_API_URL=$ngrokUrl"
    }
    
    Set-Content -Path $envPath -Value $content -NoNewline
    Write-Host "✅ Archivo actualizado con: $ngrokUrl" -ForegroundColor Green
} else {
    Write-Host "📝 Creando $envFile..." -ForegroundColor Cyan
    $envDir = Split-Path $envPath -Parent
    if (!(Test-Path $envDir)) {
        New-Item -ItemType Directory -Path $envDir -Force | Out-Null
    }
    Set-Content -Path $envPath -Value "VITE_API_URL=$ngrokUrl"
    Write-Host "✅ Archivo creado con: $ngrokUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Tu aplicación ahora es accesible desde cualquier red usando:" -ForegroundColor Cyan
Write-Host "   Backend: $ngrokUrl" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Reinicia el frontend para que tome los cambios:" -ForegroundColor Yellow
Write-Host "   cd bustracksv\client" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
