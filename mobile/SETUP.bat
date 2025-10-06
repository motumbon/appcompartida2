@echo off
echo ================================================
echo    App Trabajo en Terreno - Setup Movil
echo ================================================
echo.

echo [1/5] Instalando dependencias de Node.js...
call npm install
if errorlevel 1 (
    echo ERROR: Fallo al instalar dependencias
    pause
    exit /b 1
)

echo.
echo [2/5] Instalando Expo CLI globalmente...
call npm install -g expo-cli eas-cli
if errorlevel 1 (
    echo ADVERTENCIA: No se pudo instalar Expo CLI globalmente
    echo Intenta ejecutar como Administrador
)

echo.
echo [3/5] Verificando instalacion...
call expo --version
call eas --version

echo.
echo ================================================
echo        Setup completado exitosamente!
echo ================================================
echo.
echo Proximos pasos:
echo 1. Ejecutar: eas login
echo 2. Editar app.json y configurar tu URL de API
echo 3. Ejecutar: eas build -p android --profile preview
echo.
echo Para mas informacion, lee BUILD_APK_INSTRUCTIONS.md
echo.
pause
