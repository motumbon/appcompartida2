# Diagnóstico y Solución de Notificaciones Push

## 🔍 Problema Actual

Las notificaciones solo aparecen cuando haces **pull-to-refresh** (deslizar hacia abajo) manualmente, pero NO aparecen automáticamente cuando:
- La app está cerrada
- La app está en segundo plano
- Esperando sin tocar la app

## 📊 Diagnóstico Paso a Paso

### Paso 1: Verificar Tokens Registrados

Abre tu navegador y ve a:
```
https://web-production-10bfc.up.railway.app/api/test-notifications/tokens
```

**Login requerido**: Usa tus credenciales de la app

**Qué buscar:**
- ✅ **Token válido**: Empieza con `ExponentPushToken[...]`
- ❌ **Token local**: Empieza con `local-device-...`

**Ejemplo de respuesta:**
```json
{
  "total": 2,
  "validTokens": 1,
  "localTokens": 1,
  "tokens": [
    {
      "username": "pablo",
      "token": "ExponentPushToken[xxxxxx]",
      "isValid": "SÍ ✅",
      "deviceInfo": "Samsung Galaxy Tab - Android 12"
    },
    {
      "username": "oscar",
      "token": "local-device-1234567890-abc",
      "isValid": "NO ❌ (local)"
    }
  ]
}
```

### Interpretación:

**Si tu token es "local-device-...":**
- ❌ Firebase NO está funcionando correctamente
- Las notificaciones push reales NO funcionarán
- **Solución**: Desinstala completamente la app y reinstala el APK v1.6.0

**Si tu token es "ExponentPushToken[...]":**
- ✅ Firebase está funcionando
- Las notificaciones push DEBERÍAN funcionar
- El problema está en otro lado

### Paso 2: Probar Notificación Manual

En el navegador, haz una petición POST a:
```
https://web-production-10bfc.up.railway.app/api/test-notifications/send-test
```

O usa PowerShell:
```powershell
$token = "TU_TOKEN_JWT_AQUI"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://web-production-10bfc.up.railway.app/api/test-notifications/send-test" `
    -Method Post `
    -Headers $headers
```

**Qué esperar:**
- Con token válido de Expo: Notificación debería llegar INMEDIATAMENTE
- Con token local: No llegará nada

### Paso 3: Verificar Estado del Monitor

```powershell
$token = "TU_TOKEN_JWT_AQUI"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "https://web-production-10bfc.up.railway.app/api/test-notifications/monitor-status" `
    -Headers $headers
```

**Respuesta esperada:**
```json
{
  "isRunning": true,
  "lastCheck": {
    "activities": "2025-10-08T10:30:00.000Z",
    "tasks": "2025-10-08T10:30:00.000Z",
    "notes": "2025-10-08T10:30:00.000Z"
  },
  "currentTime": "2025-10-08T10:32:00.000Z"
}
```

Si `isRunning` es `false`, el monitor NO está activo.

## 🛠️ Soluciones por Problema

### Problema 1: Token es "local-device-..." (Firebase no funciona)

**Causa:** Firebase no se configuró correctamente en el APK

**Solución:**

1. **Verificar que google-services.json existe:**
   ```powershell
   dir "mobile\google-services.json"
   ```

2. **Verificar package name:**
   ```powershell
   type "mobile\google-services.json" | findstr "package_name"
   ```
   Debe mostrar: `"package_name": "com.apptrabajoenterreno.mobile"`

3. **Recompilar APK:**
   ```powershell
   cd mobile
   $env:EAS_NO_VCS='1'; eas build -p android --profile preview
   ```

4. **Desinstalar app actual completamente:**
   - Configuración → Apps → App Trabajo en Terreno → Desinstalar

5. **Instalar nuevo APK y otorgar permisos**

6. **Verificar token nuevamente** (debe ser ExponentPushToken ahora)

### Problema 2: Token válido pero no llegan notificaciones

**Causa:** Optimización de batería o permisos

**Solución:**

1. **Desactivar optimización de batería:**
   - Configuración → Batería → Optimización de batería
   - Buscar "App Trabajo en Terreno"
   - Seleccionar "No optimizar"

2. **Verificar permisos de notificación:**
   - Configuración → Apps → App Trabajo en Terreno
   - Notificaciones → Activar TODO

3. **Desactivar "No Molestar"**

4. **Verificar en logs del servidor:**
   Si tienes acceso a Railway:
   ```
   ✅ [10:30:15] Verificando actualizaciones...
   📅 Nueva actividad compartida: "Test" con 1 usuarios
   📤 Enviando notificación a 1 dispositivo(s) con tokens válidos
   ✅ Notificaciones enviadas
   ```

### Problema 3: Monitor no está corriendo

**Solución:**

Reiniciar el servidor:
```powershell
# Si es Railway, redeploy desde dashboard

# Si es local:
npm run server
```

Verificar en logs:
```
✅ Monitoreo de notificaciones activado (cada 2 minutos)
```

## 🧪 Script de Prueba Completo

Guarda esto como `test-push.ps1`:

```powershell
# Script de diagnóstico de notificaciones push

Write-Host "🔍 Diagnóstico de Notificaciones Push" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que servidor está corriendo
Write-Host "1️⃣  Verificando servidor..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://web-production-10bfc.up.railway.app/api/health" -TimeoutSec 5
    Write-Host "   ✅ Servidor funcionando: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Servidor NO responde" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Pedir credenciales
Write-Host "2️⃣  Ingresa tus credenciales" -ForegroundColor Yellow
$username = Read-Host "   Usuario"
$password = Read-Host "   Contraseña" -AsSecureString
$passwordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

# 3. Login
Write-Host ""
Write-Host "3️⃣  Iniciando sesión..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "https://web-production-10bfc.up.railway.app/api/auth/login" `
        -Method Post `
        -Body (@{ username = $username; password = $passwordText } | ConvertTo-Json) `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "   ✅ Login exitoso" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 4. Verificar tokens
Write-Host ""
Write-Host "4️⃣  Verificando tokens registrados..." -ForegroundColor Yellow
try {
    $tokensResponse = Invoke-RestMethod -Uri "https://web-production-10bfc.up.railway.app/api/test-notifications/tokens" `
        -Headers $headers
    
    Write-Host "   📊 Total tokens: $($tokensResponse.total)" -ForegroundColor Cyan
    Write-Host "   ✅ Tokens válidos: $($tokensResponse.validTokens)" -ForegroundColor Green
    Write-Host "   ❌ Tokens locales: $($tokensResponse.localTokens)" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($t in $tokensResponse.tokens) {
        $color = if ($t.isValid -like "*✅*") { "Green" } else { "Yellow" }
        Write-Host "   👤 $($t.username): $($t.isValid)" -ForegroundColor $color
        Write-Host "      Token: $($t.token.Substring(0, [Math]::Min(30, $t.token.Length)))..." -ForegroundColor Gray
    }
    
    if ($tokensResponse.validTokens -eq 0) {
        Write-Host ""
        Write-Host "   ⚠️  NO hay tokens válidos de Expo" -ForegroundColor Red
        Write-Host "   💡 Solución: Desinstala y reinstala el APK v1.6.0" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error obteniendo tokens: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Verificar estado del monitor
Write-Host ""
Write-Host "5️⃣  Verificando monitor de notificaciones..." -ForegroundColor Yellow
try {
    $monitorResponse = Invoke-RestMethod -Uri "https://web-production-10bfc.up.railway.app/api/test-notifications/monitor-status" `
        -Headers $headers
    
    if ($monitorResponse.isRunning) {
        Write-Host "   ✅ Monitor ACTIVO" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Monitor INACTIVO" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error verificando monitor: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Enviar notificación de prueba
Write-Host ""
Write-Host "6️⃣  Enviando notificación de prueba..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-RestMethod -Uri "https://web-production-10bfc.up.railway.app/api/test-notifications/send-test" `
        -Method Post `
        -Headers $headers
    
    Write-Host "   ✅ Notificación enviada" -ForegroundColor Green
    Write-Host "   📱 Verifica tu dispositivo (debería aparecer en unos segundos)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Error enviando notificación: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Diagnóstico completado" -ForegroundColor Green
Write-Host ""
```

**Ejecutar:**
```powershell
.\test-push.ps1
```

## 📱 Verificación en la App

1. **Abrir la app**
2. **Ver logs** (si está conectada con adb):
   ```bash
   adb logcat | findstr "Token\|Notificación\|Push"
   ```

3. **Buscar líneas como:**
   ```
   🎫 Token de push obtenido: ExponentPushToken[xxxxxx]
   ✅ Token registrado en el backend correctamente
   ```

## 🎯 Checklist Final

- [ ] Token es `ExponentPushToken[...]` (no `local-device-...`)
- [ ] Monitor del servidor está activo (`isRunning: true`)
- [ ] Permisos de notificación otorgados
- [ ] Optimización de batería desactivada
- [ ] Modo "No Molestar" desactivado
- [ ] Notificación de prueba manual llega
- [ ] google-services.json existe en mobile/

## 🆘 Si Nada Funciona

1. **Desinstala completamente la app**
2. **Borra datos de la app** (por si acaso)
3. **Reinicia el dispositivo**
4. **Instala APK v1.6.0 limpio**
5. **Otorga todos los permisos**
6. **Ejecuta script de diagnóstico**
7. **Verifica token es válido**

Si después de todo esto sigue sin funcionar, el problema puede ser:
- Firebase no configurado correctamente en el proyecto
- Cloud Messaging API no habilitada en Firebase Console
- google-services.json incorrecto o corrupto

