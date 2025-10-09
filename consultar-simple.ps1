# Script para consultar info basica

$server = "https://web-production-10bfc.up.railway.app"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO DE NOTIFICACIONES PUSH" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test servidor
Write-Host "[1/3] Verificando servidor..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$server/api/health" -TimeoutSec 10
    Write-Host "      OK: Servidor funcionando" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Servidor no responde" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Ingresa credenciales de la app movil:" -ForegroundColor Cyan
$username = Read-Host "      Usuario"
$password = Read-Host "      Password"

# Login
Write-Host ""
Write-Host "[3/3] Conectando..." -ForegroundColor Cyan
$loginBody = @{
    username = $username
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$server/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    Write-Host "      OK: Autenticado como $username" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Credenciales incorrectas" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Usuario autenticado: $username" -ForegroundColor White
Write-Host "Token JWT obtenido: SI" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Las rutas de diagnostico aun no estan en Railway." -ForegroundColor Yellow
Write-Host ""
Write-Host "Para verificar el token de push:" -ForegroundColor Cyan
Write-Host "1. Abre la app movil" -ForegroundColor White
Write-Host "2. Conecta la tablet con USB" -ForegroundColor White  
Write-Host "3. Ejecuta: adb logcat | findstr Token" -ForegroundColor White
Write-Host ""
Write-Host "Busca una linea como:" -ForegroundColor Cyan
Write-Host "  Token obtenido: ExponentPushToken[...] <- VALIDO" -ForegroundColor Green
Write-Host "  Token local: local-device-... <- NO VALIDO" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
