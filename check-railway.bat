@echo off
echo ================================================
echo    Verificacion de Estado del Servidor Railway
echo ================================================
echo.

echo [1/3] Verificando URL principal...
curl -i https://web-production-10bfc.up.railway.app
echo.
echo.

echo [2/3] Verificando endpoint /api/health...
curl -i https://web-production-10bfc.up.railway.app/api/health
echo.
echo.

echo [3/3] Verificando endpoint /api/auth/login...
curl -i https://web-production-10bfc.up.railway.app/api/auth
echo.
echo.

echo ================================================
echo           Verificacion Completada
echo ================================================
echo.
echo Si ves "404 Not Found" en todos los endpoints:
echo   - Railway no esta funcionando o el deploy fallo
echo   - Necesitas verificar en https://railway.app
echo.
echo Si ves "200 OK":
echo   - El servidor esta funcionando
echo   - El problema esta en la app movil
echo.
pause
