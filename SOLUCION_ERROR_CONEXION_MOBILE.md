# Solución: Error "No se pudo conectar al servidor" en App Móvil

**Fecha:** 16 Octubre 2025  
**Versión solucionada:** v1.8.6  
**Problema:** Login fallaba con error de conexión a pesar de que el dispositivo tenía internet

---

## 🔍 Diagnóstico del Problema

### Síntomas
- App móvil mostraba: "No se pudo conectar al servidor. Verifica tu conexión a internet."
- Dispositivo SÍ tenía internet (navegador funcionaba)
- Servidor Railway estaba funcionando correctamente
- Logs de Railway NO mostraban ningún request de login
- Endpoint `/api/health` funcionaba desde navegador móvil pero NO desde la app

### Versiones Afectadas
- v1.8.1 - Primera versión con problema (después de agregar Firebase)
- v1.8.2 - Intento de fix 1 (remover google-services.json)
- v1.8.3 - Intento de fix 2 (agregar usesCleartextTraffic en app.json)
- v1.8.4 - Intento de fix 3 (hardcodear API URL)
- v1.8.5 - Intento de fix 4 (revertir a código de v1.8.0)

**Ninguna funcionó** porque el problema NO era el código.

### Causa Raíz
**Android Network Security Policy** bloqueaba requests HTTP/HTTPS desde la app.

Android 9+ (API 28+) tiene políticas de seguridad estrictas que requieren configuración explícita para permitir tráfico de red en apps. Sin esta configuración, Android bloquea TODOS los requests, incluso a servidores HTTPS válidos.

**Por qué el navegador funcionaba pero la app no:**
- Navegadores tienen certificados del sistema pre-configurados
- Apps necesitan declarar explícitamente qué conexiones están permitidas

---

## ✅ La Solución

### Paso 1: Instalar expo-build-properties

```bash
npm install expo-build-properties@~0.11.1
```

### Paso 2: Configurar app.json

Agregar el plugin a `mobile/app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#3b82f6",
          "mode": "production"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "networkInspector": true,
            "usesCleartextTraffic": true
          }
        }
      ]
    ]
  }
}
```

### Paso 3: Rebuild

```bash
cd mobile
npx eas-cli build --platform android --profile preview
```

---

## 🎯 Configuración Final (v1.8.6)

### package.json
```json
{
  "dependencies": {
    "expo-build-properties": "~0.11.1"
  }
}
```

### app.json
```json
{
  "expo": {
    "version": "1.8.6",
    "android": {
      "versionCode": 38,
      "permissions": [
        "INTERNET",
        "POST_NOTIFICATIONS"
      ]
    },
    "plugins": [
      "expo-secure-store",
      ["expo-notifications", {...}],
      [
        "expo-build-properties",
        {
          "android": {
            "networkInspector": true,
            "usesCleartextTraffic": true
          }
        }
      ]
    ]
  }
}
```

---

## 📊 Qué hace usesCleartextTraffic

`usesCleartextTraffic: true` le dice a Android:

1. ✅ Permitir conexiones HTTPS a cualquier servidor
2. ✅ Confiar en certificados del sistema
3. ✅ No bloquear requests de red desde la app
4. ✅ Permitir inspección de tráfico de red (debugging)

**Sin esta configuración:**
- ❌ Android bloquea requests
- ❌ No se muestran errores claros
- ❌ Los requests ni siquiera llegan al servidor

**Con esta configuración:**
- ✅ Requests funcionan normalmente
- ✅ App se comporta como navegador
- ✅ Conexión a Railway funciona

---

## 🧪 Cómo Diagnosticar Este Problema

Si vuelve a ocurrir, estos son los pasos de diagnóstico:

### 1. Verificar Servidor
```
Abrir en navegador móvil:
https://TU-SERVIDOR/api/health

✅ Si carga: Servidor funciona
❌ Si no carga: Problema de servidor/red
```

### 2. Verificar Logs
```
Revisar logs del servidor (Railway)

✅ Si aparecen requests: App conecta bien
❌ Si NO aparecen: Problema de configuración de app
```

### 3. Comparar Navegador vs App
```
Navegador móvil carga /api/health: ✅
App móvil NO puede hacer login: ❌

→ Problema: Network Security Policy
→ Solución: expo-build-properties
```

---

## 📝 Lecciones Aprendidas

1. **Siempre verificar desde el navegador móvil primero**
   - Si el navegador puede acceder al endpoint, el servidor está bien
   - El problema está en la configuración de la app

2. **Android 9+ requiere configuración explícita de networking**
   - No asumir que INTERNET permission es suficiente
   - Usar `expo-build-properties` para configurar políticas de red

3. **Los logs del servidor son cruciales**
   - Si no aparecen requests, el problema es antes del servidor
   - Revisar configuración de red de la app

4. **No sobre-ingeniería el código**
   - Cuando algo no funciona, diagnosticar PRIMERO
   - No agregar código complejo sin entender el problema real

---

## 🚀 Estado Final

**Versión:** v1.8.6 (versionCode 38)  
**Estado:** ✅ Funcionando correctamente  
**Login:** ✅ Funcional  
**Requests a Railway:** ✅ Llegan correctamente  
**Notificaciones Push:** ⚠️ Deshabilitadas (sin Firebase)

---

## 📋 Próximos Pasos (Opcional)

Si deseas re-habilitar notificaciones push:

1. Configurar Firebase correctamente
2. Agregar `google-services.json`
3. Testear que networking sigue funcionando
4. Build y despliegue

**Por ahora:** La app funciona completamente excepto notificaciones push remotas.
