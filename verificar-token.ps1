# Script simple para verificar token de notificaciones

Write-Host ""
Write-Host "🔍 Verificación Rápida de Token" -ForegroundColor Cyan
Write-Host ""

# Servidor
$server = "https://web-production-10bfc.up.railway.app"

# 1. Test de conectividad
Write-Host "1️⃣  Probando conexión al servidor..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$server/api/health" -TimeoutSec 5
    Write-Host "   ✅ Servidor funcionando" -ForegroundColor Green
} catch {
    Write-Host "   ❌ No se puede conectar al servidor" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Login
Write-Host "2️⃣  Iniciando sesión..." -ForegroundColor Yellow
$username = Read-Host "   Ingresa tu usuario"
$password = Read-Host "   Ingresa tu contraseña"

try {
    $loginBody = @{
        username = $username
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$server/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "   ✅ Login exitoso" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host ""

# 3. Verificar tokens
Write-Host "3️⃣  Verificando tokens de push..." -ForegroundColor Yellow
try {
    $tokensResponse = Invoke-RestMethod -Uri "$server/api/test-notifications/tokens" `
        -Headers $headers
    
    Write-Host ""
    Write-Host "   📊 RESUMEN:" -ForegroundColor Cyan
    Write-Host "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "   Total de dispositivos: $($tokensResponse.total)" -ForegroundColor White
    Write-Host "   Tokens válidos (Firebase): $($tokensResponse.validTokens)" -ForegroundColor Green
    Write-Host "   Tokens locales (sin Firebase): $($tokensResponse.localTokens)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($tokensResponse.total -eq 0) {
        Write-Host "   ⚠️  NO hay dispositivos registrados" -ForegroundColor Yellow
        Write-Host "   💡 Abre la app móvil y otorga permisos de notificación" -ForegroundColor Cyan
    } else {
        Write-Host "   👥 DISPOSITIVOS REGISTRADOS:" -ForegroundColor Cyan
        Write-Host "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        
        foreach ($t in $tokensResponse.tokens) {
            Write-Host ""
            $color = if ($t.isValid -like "*✅*") { "Green" } else { "Yellow" }
            Write-Host "   👤 Usuario: $($t.username)" -ForegroundColor White
            Write-Host "      Estado: $($t.isValid)" -ForegroundColor $color
            Write-Host "      Device: $($t.deviceInfo)" -ForegroundColor Gray
            
            $tokenPreview = if ($t.token.Length -gt 40) {
                $t.token.Substring(0, 40) + "..."
            } else {
                $t.token
            }
            Write-Host "      Token: $tokenPreview" -ForegroundColor DarkGray
            Write-Host "      Última actualización: $($t.lastUpdated)" -ForegroundColor DarkGray
        }
    }
    
    Write-Host ""
    Write-Host "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Evaluación
    if ($tokensResponse.validTokens -gt 0) {
        Write-Host "   ✅ FIREBASE FUNCIONANDO CORRECTAMENTE" -ForegroundColor Green
        Write-Host "   ✅ Las notificaciones push deberían funcionar con app cerrada" -ForegroundColor Green
    } elseif ($tokensResponse.localTokens -gt 0) {
        Write-Host "   ⚠️  FIREBASE NO CONFIGURADO" -ForegroundColor Yellow
        Write-Host "   ℹ️  Notificaciones funcionan solo con app abierta" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   🔧 SOLUCIÓN:" -ForegroundColor Cyan
        Write-Host "   1. Desinstala la app completamente" -ForegroundColor White
        Write-Host "   2. Instala el APK v1.6.0" -ForegroundColor White
        Write-Host "   3. Abre la app y otorga permisos" -ForegroundColor White
        Write-Host "   4. Ejecuta este script nuevamente" -ForegroundColor White
    }
    
} catch {
    Write-Host "   ❌ Error obteniendo tokens: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Ver estado del monitor
Write-Host "4️⃣  Estado del monitor..." -ForegroundColor Yellow
try {
    $monitorResponse = Invoke-RestMethod -Uri "$server/api/test-notifications/monitor-status" `
        -Headers $headers
    
    if ($monitorResponse.isRunning) {
        Write-Host "   ✅ Monitor de notificaciones ACTIVO" -ForegroundColor Green
        Write-Host "   ⏱️  Verifica cada 2 minutos automáticamente" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Monitor de notificaciones INACTIVO" -ForegroundColor Red
        Write-Host "   💡 Reinicia el servidor" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error verificando monitor: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
