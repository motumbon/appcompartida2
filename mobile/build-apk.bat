@echo off
echo ================================================
echo    Compilar APK desde Android Studio
echo ================================================
echo.
echo Este script compilara el APK automaticamente
echo.
pause

echo.
echo [1/5] Limpiando builds anteriores...
if exist android rmdir /s /q android
if exist ios rmdir /s /q ios
echo ✅ Limpieza completada
echo.

echo [2/5] Instalando dependencias...
call npm install
echo ✅ Dependencias instaladas
echo.

echo [3/5] Generando proyecto Android nativo...
call npx expo prebuild --platform android --clean
echo ✅ Proyecto Android generado
echo.

echo [4/5] Compilando APK de Debug...
cd android
call gradlew assembleDebug
cd ..
echo ✅ APK Debug compilado
echo.

echo [5/5] Compilando APK de Release...
cd android
call gradlew assembleRelease
cd ..
echo ✅ APK Release compilado
echo.

echo ================================================
echo           Compilacion Completada
echo ================================================
echo.
echo APK Debug ubicado en:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo APK Release ubicado en:
echo   android\app\build\outputs\apk\release\app-release.apk
echo.
echo Para instalar en dispositivo conectado:
echo   cd android
echo   gradlew installDebug
echo.
pause
