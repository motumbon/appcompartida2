# 🔑 Obtener FCM Server Key de Firebase

## ❌ Error Actual

```
Unable to retrieve the FCM server key for the recipient's app
```

**Causa:** Expo necesita la clave del servidor de Firebase para enviar notificaciones push a dispositivos Android.

---

## ✅ Solución: Configurar FCM Server Key

### Paso 1: Obtener Server Key de Firebase Console

1. **Ve a Firebase Console:**
   ```
   https://console.firebase.google.com/
   ```

2. **Selecciona tu proyecto:**
   - `app-trabajo-en-terreno`

3. **Ir a Project Settings:**
   - Click en el ⚙️ (engranaje) arriba a la izquierda
   - Click en **"Project settings"**

4. **Ir a Cloud Messaging:**
   - Click en la pestaña **"Cloud Messaging"**
   - Scroll hacia abajo

5. **Habilitar Cloud Messaging API (Legacy):**
   
   **Si ves un mensaje que dice "Cloud Messaging API (Legacy) is disabled":**
   
   a. Click en el botón **"Manage API in Google Cloud Console"**
   
   b. En Google Cloud Console:
      - Busca **"Firebase Cloud Messaging API"** (NO la legacy)
      - Click **"ENABLE"** si está deshabilitada
   
   c. Vuelve a Firebase Console → Cloud Messaging
   
   d. **IMPORTANTE:** También necesitas habilitar la **Legacy API**:
      - En Google Cloud Console, busca: **"Cloud Messaging"**
      - O ve directamente a:
        ```
        https://console.cloud.google.com/apis/library/fcm.googleapis.com
        ```
      - Click **"ENABLE"**

6. **Copiar Server Key:**
   
   Deberías ver una sección llamada **"Cloud Messaging API (Legacy)"**
   
   **Hay dos claves:**
   - 🔑 **Server key** ← Esta la necesitamos
   - Sender ID
   
   **Copia el "Server key"** completo (empieza con `AAAA...`)

---

### Paso 2: Configurar en Expo

Una vez que tengas el Server Key, hay dos opciones:

#### Opción A: Usando EAS CLI (Recomendado)

```powershell
cd mobile
eas credentials
```

**Selecciona:**
1. Android
2. production
3. "Push Notifications: FCM server key"
4. "Add a new FCM server key"
5. Pega el Server Key que copiaste
6. Confirma

#### Opción B: Configurar en app.json (Temporal para testing)

Agregar en `mobile/app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleMaps": {
          "apiKey": ""
        }
      },
      "fcmServerKey": "AAAA.............."  ← Pegar aquí
    }
  }
}
```

**IMPORTANTE:** NO subas esta clave a GitHub (agregar a .gitignore)

---

### Paso 3: Recompilar APK

Después de configurar el Server Key:

```powershell
cd mobile
eas build -p android --profile preview
```

Esperar 10-15 minutos.

---

### Paso 4: Instalar y Probar

1. Descargar nuevo APK
2. Instalar en dispositivos
3. Probar notificación push

---

## 🎯 Verificación

**Backend logs esperados:**
```
📅 Enviando notificación inmediata: actividad "..." compartida con 1 usuario(s)
📤 Enviando notificación a 1 dispositivo(s) con tokens válidos
📦 Enviando 1 mensajes en 1 chunk(s)
✅ Chunk enviado: 1 tickets recibidos
✅ Notificaciones enviadas exitosamente: 1/1  ← Sin errores
```

**Ya NO debe aparecer:**
```
⚠️ 1 notificaciones fallaron: [...]
```

---

## 📝 Resumen

**El problema NO es el código, es la configuración de Firebase.**

Necesitas:
1. ✅ Habilitar Cloud Messaging API en Firebase
2. ✅ Obtener Server Key
3. ✅ Configurar en Expo con `eas credentials`
4. ✅ Recompilar APK

**Esto es una configuración de una sola vez. Después de esto, las notificaciones push funcionarán para siempre.**

---

**¿Necesitas ayuda con alguno de estos pasos?**
