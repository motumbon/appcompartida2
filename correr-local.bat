@echo off
echo ================================================
echo    Correr Backend Localmente para Pruebas
echo ================================================
echo.
echo Este script iniciara el servidor en tu PC
echo La app movil podra conectarse si esta en la misma WiFi
echo.
pause
echo.
echo [1/2] Iniciando servidor local en puerto 5000...
echo.
cd /d "%~dp0"
npm start
pause
