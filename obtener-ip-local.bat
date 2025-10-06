@echo off
echo ================================================
echo    Obtener IP Local para Configurar App Movil
echo ================================================
echo.
echo Tu IP local es necesaria para que la app movil se conecte
echo al servidor que corre en tu PC
echo.
pause
echo.
echo Buscando tu IP local...
echo.
ipconfig | findstr /i "IPv4"
echo.
echo ================================================
echo   ANOTA la direccion IPv4 (ej: 192.168.1.100)
echo ================================================
echo.
echo Ahora debes:
echo 1. Editar: mobile/src/config/api.js
echo 2. Linea 6, cambiar a: const BASE_API_URL = 'http://TU_IP:5000';
echo    Ejemplo: const BASE_API_URL = 'http://192.168.1.100:5000';
echo 3. Guardar y regenerar APK
echo.
echo IMPORTANTE: Tu telefono debe estar en la MISMA WiFi que tu PC
echo.
pause
