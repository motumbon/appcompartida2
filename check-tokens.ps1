# Script simple para verificar tokens

$server = "https://web-production-10bfc.up.railway.app"

Write-Host "Verificando servidor..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$server/api/health"
Write-Host "Servidor OK: $($health.status)" -ForegroundColor Green
Write-Host ""

Write-Host "Ingresa tus credenciales:" -ForegroundColor Yellow
$username = Read-Host "Usuario"
$password = Read-Host "Contrasena"

Write-Host ""
Write-Host "Iniciando sesion..." -ForegroundColor Cyan

$loginBody = @{
    username = $username
    password = $password
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$server/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
Write-Host "Login exitoso!" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $($loginResponse.token)"
}

Write-Host ""
Write-Host "Obteniendo tokens registrados..." -ForegroundColor Cyan
$tokens = Invoke-RestMethod -Uri "$server/api/test-notifications/tokens" -Headers $headers

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "RESULTADO:" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Total dispositivos: $($tokens.total)"
Write-Host "Tokens validos (Firebase): $($tokens.validTokens)" -ForegroundColor Green
Write-Host "Tokens locales (sin Firebase): $($tokens.localTokens)" -ForegroundColor Yellow
Write-Host ""

foreach ($t in $tokens.tokens) {
    Write-Host "Usuario: $($t.username)"
    Write-Host "  Estado: $($t.isValid)"
    Write-Host "  Token: $($t.token.Substring(0, [Math]::Min(40, $t.token.Length)))..."
    Write-Host "  Device: $($t.deviceInfo)"
    Write-Host ""
}

Write-Host "==================================" -ForegroundColor Cyan

if ($tokens.validTokens -gt 0) {
    Write-Host "RESULTADO: Firebase esta FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "RESULTADO: Firebase NO esta configurado" -ForegroundColor Red
    Write-Host "SOLUCION: Desinstala la app y reinstala APK v1.6.0" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verificando monitor..." -ForegroundColor Cyan
$monitor = Invoke-RestMethod -Uri "$server/api/test-notifications/monitor-status" -Headers $headers

if ($monitor.isRunning) {
    Write-Host "Monitor: ACTIVO (verifica cada 2 minutos)" -ForegroundColor Green
} else {
    Write-Host "Monitor: INACTIVO (reinicia el servidor)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verificacion completa!" -ForegroundColor Green
