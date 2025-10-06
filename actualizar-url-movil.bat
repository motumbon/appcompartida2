@echo off
echo ================================================
echo    Actualizar URL en App Movil
echo ================================================
echo.
echo IMPORTANTE: Primero verifica la URL correcta en Railway
echo.
echo 1. Ve a https://railway.app/
echo 2. Abre tu proyecto
echo 3. Settings -^> Domains
echo 4. Copia la URL que aparece (ej: https://tu-app.up.railway.app)
echo.
echo Luego:
echo 1. Edita: mobile/src/config/api.js
echo 2. Linea 6, cambia BASE_API_URL por tu URL correcta
echo 3. Guarda el archivo
echo 4. Regenera el APK con: cd mobile ^&^& set EAS_NO_VCS=1 ^&^& eas build -p android --profile preview
echo.
pause
