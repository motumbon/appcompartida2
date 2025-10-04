# Script para subir a GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUBIR A GITHUB - App Trabajo Terreno" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Git está instalado
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitInstalled) {
    Write-Host "[ERROR] Git no esta instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Descarga Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "[1/5] Inicializando repositorio Git..." -ForegroundColor Green
git init

Write-Host ""
Write-Host "[2/5] Agregando archivos..." -ForegroundColor Green
git add .

Write-Host ""
Write-Host "[3/5] Creando commit..." -ForegroundColor Green
git commit -m "Initial commit: App Trabajo en Terreno 2.0 completa"

Write-Host ""
Write-Host "[4/5] Conectando con GitHub..." -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin https://github.com/motumbon/appcompartida2.git

Write-Host ""
Write-Host "[5/5] Subiendo a GitHub..." -ForegroundColor Green
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUBIDA COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Siguiente paso:" -ForegroundColor Yellow
Write-Host "1. Ve a https://railway.app" -ForegroundColor White
Write-Host "2. Conecta tu repositorio de GitHub" -ForegroundColor White
Write-Host "3. Configura las variables de entorno" -ForegroundColor White
Write-Host ""
Write-Host "Lee SUBIR_A_GITHUB.md para mas detalles" -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para salir"
