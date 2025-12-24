# Script para obtener la URL pública de ngrok
Write-Host "🔍 Obteniendo URL de ngrok..." -ForegroundColor Cyan

$maxAttempts = 10
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction Stop
        
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            $publicUrl = $response.tunnels[0].public_url
            Write-Host ""
            Write-Host "✅ URL pública de ngrok encontrada:" -ForegroundColor Green
            Write-Host "   $publicUrl" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "📋 Copia esta URL y actualiza client/.env.local:" -ForegroundColor Cyan
            Write-Host "   VITE_API_URL=$publicUrl" -ForegroundColor White
            Write-Host ""
            
            # Guardar en un archivo temporal
            $publicUrl | Out-File -FilePath "ngrok-url.txt" -Encoding utf8
            Write-Host "✅ URL guardada en ngrok-url.txt" -ForegroundColor Green
            
            exit 0
        }
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Host "⏳ Esperando que ngrok inicie... ($attempt/$maxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
}

Write-Host ""
Write-Host "❌ No se pudo obtener la URL de ngrok" -ForegroundColor Red
Write-Host "   Asegúrate de que ngrok esté corriendo:" -ForegroundColor Yellow
Write-Host "   ngrok http 4000" -ForegroundColor White
Write-Host ""

