# 🏗️ Compilar APK desde Android Studio

## 📋 Requisitos Previos

1. ✅ Android Studio instalado
2. ✅ Android SDK configurado
3. ✅ Java JDK 17 instalado
4. ✅ Variables de entorno configuradas (ANDROID_HOME, JAVA_HOME)

---

## 🚀 Método 1: Expo Prebuild + Gradle (Recomendado)

### Paso 1: Abrir Terminal en Android Studio

1. Abre Android Studio
2. File → Open → Selecciona la carpeta `mobile`
3. Abre la terminal integrada (Alt + F12 o View → Tool Windows → Terminal)

### Paso 2: Generar Proyecto Android Nativo

```bash
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
npx expo prebuild --platform android --clean
```

**Esto creará la carpeta `android/` con el proyecto nativo.**

### Paso 3: Compilar APK de Debug

```bash
cd android
.\gradlew assembleDebug
```

**El APK estará en:**
```
android\app\build\outputs\apk\debug\app-debug.apk
```

### Paso 4: Compilar APK de Release (Producción)

```bash
cd android
.\gradlew assembleRelease
```

**El APK estará en:**
```
android\app\build\outputs\apk\release\app-release.apk
```

---

## 🔧 Método 2: Build Completo Paso a Paso

### Paso 1: Limpiar Builds Anteriores

```bash
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
rmdir /s /q android
rmdir /s /q ios
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Generar Proyecto Nativo

```bash
npx expo prebuild --clean
```

### Paso 4: Navegar a la Carpeta Android

```bash
cd android
```

### Paso 5: Compilar APK

**Para Debug (testing):**
```bash
.\gradlew assembleDebug
```

**Para Release (producción):**
```bash
.\gradlew assembleRelease
```

### Paso 6: Instalar en Dispositivo Conectado

```bash
.\gradlew installDebug
```

O para release:
```bash
.\gradlew installRelease
```

---

## 🎯 Método 3: Desde la UI de Android Studio

### Paso 1: Abrir Proyecto

1. Android Studio → File → Open
2. Navega a: `mobile/android`
3. Click "OK"

### Paso 2: Esperar Sincronización

Espera a que Gradle sincronice (puede tomar 5-10 minutos la primera vez)

### Paso 3: Build APK

1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Espera a que compile
3. Click en "locate" cuando termine

---

## 🐛 Solución de Problemas Comunes

### Error: "SDK location not found"

**Solución:**
Crea el archivo `android/local.properties`:

```properties
sdk.dir=C\:\\Users\\pablo\\AppData\\Local\\Android\\Sdk
```

### Error: "Java version incompatible"

**Solución:**
Verifica que usas Java 17:

```bash
java -version
```

Si no es Java 17, descarga desde: https://adoptium.net/

### Error: "Gradle build failed"

**Solución:**
Limpia y recompila:

```bash
cd android
.\gradlew clean
.\gradlew assembleDebug
```

### Error: "expo-modules-core not found"

**Solución:**
Reinstala dependencias:

```bash
cd ..
npm install
npx expo prebuild --clean
cd android
.\gradlew assembleDebug
```

---

## 📦 Ubicación de los APKs Generados

### APK Debug:
```
mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

### APK Release:
```
mobile\android\app\build\outputs\apk\release\app-release.apk
```

### AAB (Para Google Play):
```
mobile\android\app\build\outputs\bundle\release\app-release.aab
```

---

## 🔐 Firmar APK de Release (Opcional)

Si quieres un APK firmado para distribución:

### Paso 1: Generar Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Paso 2: Configurar Gradle

Edita `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'tu_password'
            keyAlias 'my-key-alias'
            keyPassword 'tu_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

### Paso 3: Compilar APK Firmado

```bash
.\gradlew assembleRelease
```

---

## ⚡ Comandos Rápidos (Resumen)

### Build Debug Rápido:
```bash
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
npx expo prebuild --platform android --clean
cd android
.\gradlew assembleDebug
```

### Build Release Rápido:
```bash
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
npx expo prebuild --platform android --clean
cd android
.\gradlew assembleRelease
```

### Instalar en Dispositivo:
```bash
cd android
.\gradlew installDebug
```

---

## 📱 Instalar APK Manualmente

### Desde PC:
```bash
adb install app\build\outputs\apk\debug\app-debug.apk
```

### Desde Android:
1. Copia el APK a tu teléfono
2. Abre el archivo APK
3. Permite "Instalar desde fuentes desconocidas"
4. Instala

---

## 🎯 Recomendación

**Para desarrollo/testing:**
- Usa `assembleDebug` - Es más rápido y no requiere firma

**Para producción/distribución:**
- Usa EAS Build (cloud) - Es más confiable y maneja todo automáticamente
- O usa `assembleRelease` con keystore firmado

---

## 📞 Ayuda Adicional

Si tienes problemas, revisa:
- Logs en: `android/app/build/outputs/logs/`
- Variables de entorno: `ANDROID_HOME`, `JAVA_HOME`
- Versión de Gradle: `.\gradlew --version`
- Versión de Java: `java -version`

---

**Última actualización:** 06/10/2025
