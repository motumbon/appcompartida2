@echo off
echo ========================================
echo   SUBIR A GITHUB - App Trabajo Terreno
echo ========================================
echo.

REM Verificar si Git está instalado
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git no esta instalado
    echo.
    echo Descarga Git desde: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [1/5] Inicializando repositorio Git...
git init

echo.
echo [2/5] Agregando archivos...
git add .

echo.
echo [3/5] Creando commit...
git commit -m "Initial commit: App Trabajo en Terreno 2.0 completa"

echo.
echo [4/5] Conectando con GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/motumbon/appcompartida2.git

echo.
echo [5/5] Subiendo a GitHub...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo   SUBIDA COMPLETADA
echo ========================================
echo.
echo Siguiente paso:
echo 1. Ve a https://railway.app
echo 2. Conecta tu repositorio de GitHub
echo 3. Configura las variables de entorno
echo.
echo Lee SUBIR_A_GITHUB.md para mas detalles
echo.
pause
