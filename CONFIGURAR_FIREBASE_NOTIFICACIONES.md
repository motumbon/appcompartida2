# Configurar Firebase para Notificaciones Push - App Cerrada

## 📋 Requisitos Previos

Para que las notificaciones funcionen cuando la app está **completamente cerrada**, necesitas configurar Firebase Cloud Messaging (FCM).

## 🚀 Pasos para Configurar Firebase

### Paso 1: Crear Proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Agregar proyecto"** o **"Add project"**
3. Nombre del proyecto: `App Trabajo en Terreno` (o el que prefieras)
4. Acepta los términos y clic en **Continuar**
5. (Opcional) Desactiva Google Analytics si no lo necesitas
6. Clic en **Crear proyecto**
7. Espera a que se cree (1-2 minutos)

### Paso 2: Agregar Android al Proyecto Firebase

1. En el dashboard del proyecto, clic en el ícono de **Android**
2. Completa los datos:
   - **Nombre del paquete Android**: `com.apptrabajoenterreno.mobile`
   - **Alias de la app**: `App Trabajo en Terreno`
   - **Certificado SHA-1**: (opcional, déjalo en blanco por ahora)
3. Clic en **Registrar app**
4. **IMPORTANTE**: Descarga el archivo **`google-services.json`**
5. Guarda el archivo en tu computadora

### Paso 3: Colocar google-services.json

**Ubicación:**
```
mobile/
├── google-services.json  ← AQUÍ
├── app.json
├── package.json
└── ...
```

**Comando para copiar** (ejecuta desde la carpeta del proyecto):
```bash
# Reemplaza "ruta/a/tu/archivo" con la ruta donde descargaste el archivo
copy "C:\Users\TU_USUARIO\Downloads\google-services.json" "mobile\google-services.json"
```

### Paso 4: Actualizar app.json

Ya está configurado, pero verifica que tenga esto:

```json
{
  "expo": {
    "android": {
      "package": "com.apptrabajoenterreno.mobile",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#3b82f6",
          "mode": "production"
        }
      ]
    ]
  }
}
```

### Paso 5: Habilitar Cloud Messaging API

1. En Firebase Console, ve a **"Project Settings"** (ícono de engranaje)
2. Ve a la pestaña **"Cloud Messaging"**
3. Si aparece un botón para habilitar la API, haz clic en él
4. Espera a que se active (puede tardar unos minutos)

### Paso 6: Recompilar el APK

```bash
cd mobile
$env:EAS_NO_VCS='1'; eas build -p android --profile preview
```

Esto tardará 10-15 minutos.

## ✅ Verificación

Una vez instalado el nuevo APK con Firebase configurado:

### 1. Verifica el Token
Abre la app y revisa los logs:
```
🎫 Token de push obtenido: ExponentPushToken[xxxxxxxxxxxxxx]
✅ Token registrado en el backend correctamente
```

**Token válido**: Empieza con `ExponentPushToken[...]`
**Token local**: Empieza con `local-device-...` (NO funcionará con app cerrada)

### 2. Prueba con App Cerrada

**Usuario A** (dispositivo 1):
1. Crea una actividad/tarea/nota
2. Compártela con Usuario B

**Usuario B** (dispositivo 2):
1. **CIERRA completamente la app** (desliza desde recientes)
2. Espera 2 minutos
3. **Debería aparecer una notificación** en la bandeja del sistema ✅

## 🔍 Solución de Problemas

### No aparece token válido (sigue siendo local-device-...)

**Causas:**
- google-services.json no está en el lugar correcto
- El archivo no corresponde al package name correcto
- No se recompiló el APK después de agregar el archivo

**Solución:**
1. Verifica que `google-services.json` esté en la carpeta `mobile/`
2. Abre el archivo y verifica que `package_name` sea `com.apptrabajoenterreno.mobile`
3. Recompila el APK completamente

### La notificación no llega con app cerrada

**Verifica:**
1. Que el token sea válido (empieza con `ExponentPushToken`)
2. Que el servidor esté ejecutándose
3. Que el monitoreo esté activo en el servidor:
   ```
   ✅ Monitoreo de notificaciones activado (cada 2 minutos)
   ```
4. En el dispositivo:
   - Modo "No Molestar" desactivado
   - Permisos de notificación otorgados
   - Optimización de batería desactivada para la app

### Error al compilar APK

**Error común**: `Could not find google-services.json`

**Solución:**
```bash
# Verifica que el archivo existe
dir mobile\google-services.json

# Si no existe, cópialo nuevamente
copy "Downloads\google-services.json" "mobile\google-services.json"
```

## 📊 Diferencias: Sin Firebase vs Con Firebase

| Característica | Sin Firebase | Con Firebase ✅ |
|----------------|--------------|----------------|
| Notificaciones con app abierta | ✅ Sí | ✅ Sí |
| Notificaciones en background | ✅ Sí (pocos minutos) | ✅ Sí |
| Notificaciones con app cerrada | ❌ No | ✅ **Sí** |
| Latencia | ~2 minutos | ~Instantáneo |
| Batería | Más consumo | Eficiente |
| Configuración | Simple | Media complejidad |

## 🎯 Resumen de Archivos

Después de seguir esta guía, tu proyecto debería tener:

```
mobile/
├── google-services.json          ← NUEVO (de Firebase Console)
├── app.json                       ← Actualizado con googleServicesFile
├── src/
│   └── services/
│       ├── notificationService.js ← Ya configurado
│       └── pollingService.js      ← Seguirá funcionando como fallback
└── ...
```

## 📱 Comandos Rápidos

```bash
# 1. Verificar que google-services.json existe
dir mobile\google-services.json

# 2. Ver contenido del archivo (verificar package_name)
type mobile\google-services.json | findstr "package_name"

# 3. Recompilar APK
cd mobile
$env:EAS_NO_VCS='1'; eas build -p android --profile preview

# 4. Verificar logs del servidor
# (Deberías ver el token real registrarse)
```

## ⚠️ Importante

- **NO compartas** el archivo `google-services.json` públicamente
- **NO lo subas** a GitHub (ya está en `.gitignore`)
- Guarda una **copia de seguridad** del archivo
- Si regeneras el archivo en Firebase, deberás recompilar el APK

## 🆘 Soporte

Si después de seguir todos los pasos las notificaciones no funcionan con la app cerrada:

1. Verifica que el token sea válido (comienza con `ExponentPushToken`)
2. Revisa los logs del servidor para ver si detecta cambios
3. Confirma que `google-services.json` tenga el package name correcto
4. Intenta con otro dispositivo para descartar problemas específicos del hardware

---

Una vez completados estos pasos, las notificaciones funcionarán **incluso con la app completamente cerrada**. 🎉
