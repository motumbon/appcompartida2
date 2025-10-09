# Script para verificar configuración de Firebase

Write-Host ""
Write-Host "🔍 Verificando configuración de Firebase..." -ForegroundColor Cyan
Write-Host ""

$googleServicesPath = "google-services.json"

if (Test-Path $googleServicesPath) {
    Write-Host "✅ Archivo google-services.json encontrado" -ForegroundColor Green
    
    # Verificar que no sea el placeholder
    $content = Get-Content $googleServicesPath -Raw
    if ($content -like "*REEMPLAZAR_CON_TU*") {
        Write-Host "⚠️  ATENCIÓN: Estás usando el archivo placeholder" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Necesitas reemplazarlo con el archivo real de Firebase Console:" -ForegroundColor Yellow
        Write-Host "1. Ve a https://console.firebase.google.com/" -ForegroundColor White
        Write-Host "2. Crea un proyecto o usa uno existente" -ForegroundColor White
        Write-Host "3. Agrega una app Android con package: com.apptrabajoenterreno.mobile" -ForegroundColor White
        Write-Host "4. Descarga google-services.json" -ForegroundColor White
        Write-Host "5. Reemplaza el archivo en mobile/google-services.json" -ForegroundColor White
        Write-Host ""
        Write-Host "📖 Ver guía completa: CONFIGURAR_FIREBASE_NOTIFICACIONES.md" -ForegroundColor Cyan
        exit 1
    }
    
    # Verificar package name
    if ($content -like "*com.apptrabajoenterreno.mobile*") {
        Write-Host "✅ Package name correcto: com.apptrabajoenterreno.mobile" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: Package name incorrecto en google-services.json" -ForegroundColor Red
        Write-Host "   Debe ser: com.apptrabajoenterreno.mobile" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "🎉 Configuración de Firebase correcta" -ForegroundColor Green
    Write-Host "✅ Puedes compilar el APK con:" -ForegroundColor Green
    Write-Host "   `$env:EAS_NO_VCS='1'; eas build -p android --profile preview" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "❌ Archivo google-services.json NO encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Pasos para configurar Firebase:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1️⃣  Ve a Firebase Console:" -ForegroundColor Cyan
    Write-Host "   https://console.firebase.google.com/" -ForegroundColor White
    Write-Host ""
    Write-Host "2️⃣  Crea un nuevo proyecto (o usa uno existente)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3️⃣  Agrega una app Android:" -ForegroundColor Cyan
    Write-Host "   - Package name: com.apptrabajoenterreno.mobile" -ForegroundColor White
    Write-Host "   - App nickname: App Trabajo en Terreno" -ForegroundColor White
    Write-Host ""
    Write-Host "4️⃣  Descarga google-services.json" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5️⃣  Copia el archivo aquí:" -ForegroundColor Cyan
    Write-Host "   mobile\google-services.json" -ForegroundColor White
    Write-Host ""
    Write-Host "   Comando de ejemplo:" -ForegroundColor Gray
    Write-Host "   copy `"C:\Users\TU_USUARIO\Downloads\google-services.json`" `"google-services.json`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "6️⃣  Vuelve a ejecutar este script para verificar" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📖 Guía completa en: ..\CONFIGURAR_FIREBASE_NOTIFICACIONES.md" -ForegroundColor Magenta
    Write-Host ""
    exit 1
}
