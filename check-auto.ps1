# Script automatico para verificar tokens

$server = "https://web-production-10bfc.up.railway.app"

Write-Host "Verificando servidor..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$server/api/health" -TimeoutSec 10
    Write-Host "Servidor OK: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: No se puede conectar al servidor" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Iniciando sesion como administrador..." -ForegroundColor Cyan

$loginBody = @{
    username = "administrador"
    password = "1234567"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$server/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "Login exitoso!" -ForegroundColor Green
} catch {
    Write-Host "ERROR en login" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $($loginResponse.token)"
}

Write-Host ""
Write-Host "Obteniendo tokens registrados..." -ForegroundColor Cyan
try {
    $tokens = Invoke-RestMethod -Uri "$server/api/test-notifications/tokens" -Headers $headers
} catch {
    Write-Host "ERROR obteniendo tokens" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "RESULTADO:" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Total dispositivos: $($tokens.total)"
Write-Host "Tokens validos (Firebase): $($tokens.validTokens)" -ForegroundColor Green
Write-Host "Tokens locales (sin Firebase): $($tokens.localTokens)" -ForegroundColor Yellow
Write-Host ""

if ($tokens.tokens.Count -gt 0) {
    foreach ($t in $tokens.tokens) {
        Write-Host "Usuario: $($t.username)" -ForegroundColor White
        if ($t.isValid -like "*SI*") {
            Write-Host "  Estado: VALIDO (Firebase OK)" -ForegroundColor Green
        } else {
            Write-Host "  Estado: LOCAL (sin Firebase)" -ForegroundColor Yellow
        }
        $tokenShort = $t.token.Substring(0, [Math]::Min(40, $t.token.Length))
        Write-Host "  Token: $tokenShort..." -ForegroundColor Gray
        Write-Host "  Device: $($t.deviceInfo)" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "NO hay dispositivos registrados" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "==================================" -ForegroundColor Cyan

if ($tokens.validTokens -gt 0) {
    Write-Host ""
    Write-Host "RESULTADO: Firebase esta FUNCIONANDO correctamente" -ForegroundColor Green
    Write-Host "Las notificaciones push deberian funcionar con app cerrada" -ForegroundColor Green
    Write-Host ""
    Write-Host "Si no llegan notificaciones, revisa:" -ForegroundColor Yellow
    Write-Host "- Optimizacion de bateria (debe estar desactivada)" -ForegroundColor White
    Write-Host "- Permisos de notificaciones (deben estar activos)" -ForegroundColor White
    Write-Host "- Modo No Molestar (debe estar desactivado)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "RESULTADO: Firebase NO esta configurado" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUCION:" -ForegroundColor Yellow
    Write-Host "1. Desinstala completamente la app" -ForegroundColor White
    Write-Host "2. Reinstala el APK v1.6.0" -ForegroundColor White
    Write-Host "3. Abre la app y otorga permisos" -ForegroundColor White
    Write-Host "4. Ejecuta este script de nuevo" -ForegroundColor White
}

Write-Host ""
Write-Host "Verificando monitor de notificaciones..." -ForegroundColor Cyan
try {
    $monitor = Invoke-RestMethod -Uri "$server/api/test-notifications/monitor-status" -Headers $headers
    
    if ($monitor.isRunning) {
        Write-Host "Monitor: ACTIVO (verifica cada 2 minutos)" -ForegroundColor Green
    } else {
        Write-Host "Monitor: INACTIVO" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR verificando monitor" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verificacion completa!" -ForegroundColor Green
Write-Host ""
