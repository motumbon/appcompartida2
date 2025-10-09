# Script para compilar APK con logs

Write-Host "Iniciando build de APK v1.6.1..." -ForegroundColor Cyan
Write-Host ""

# Establecer variable de entorno
$env:EAS_NO_VCS = '1'

Write-Host "Configuracion:" -ForegroundColor Yellow
Write-Host "  EAS_NO_VCS: $env:EAS_NO_VCS"
Write-Host "  Platform: Android"
Write-Host "  Profile: preview"
Write-Host ""

# Verificar google-services.json
if (Test-Path "google-services.json") {
    Write-Host "[OK] google-services.json encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] google-services.json NO encontrado" -ForegroundColor Red
    exit 1
}

# Verificar que NO exista carpeta android
if (Test-Path "android") {
    Write-Host "[ADVERTENCIA] Carpeta android/ existe - debe eliminarse" -ForegroundColor Yellow
    Write-Host "Renombrando android/ a android_backup..." -ForegroundColor Cyan
    Rename-Item "android" "android_backup_manual" -Force
    Write-Host "[OK] Carpeta android/ renombrada" -ForegroundColor Green
}

Write-Host ""
Write-Host "Ejecutando: eas build -p android --profile preview --non-interactive" -ForegroundColor Cyan
Write-Host ""

# Ejecutar build con output visible
eas build --platform android --profile preview --non-interactive 2>&1 | Tee-Object -FilePath "build-log.txt"

Write-Host ""
Write-Host "Build completado. Ver logs en: build-log.txt" -ForegroundColor Green
