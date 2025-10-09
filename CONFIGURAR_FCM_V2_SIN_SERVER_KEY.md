# 🔑 Configurar FCM sin Server Key (Usando Service Account)

## 🎯 Solución Alternativa

Ya que la API Legacy está obsoleta y no muestra el Server Key, usaremos **Service Account JSON** en vez del Server Key.

---

## ✅ Paso 1: Descargar Service Account JSON

**1. En Firebase Console:**
   ```
   Configuración del proyecto (⚙️)
   → Pestaña "Cuentas de servicio"
   ```

**2. Verás algo como:**
   ```
   Claves privadas de la cuenta de servicio de Firebase Admin SDK
   ```

**3. Click en el botón:**
   ```
   "Generar nueva clave privada"
   ```

**4. Confirma** → Se descargará un archivo JSON:
   ```
   app-trabajo-en-terreno-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
   ```

**5. Guarda ese archivo** en un lugar seguro (NO lo subas a GitHub)

---

## ✅ Paso 2: Subir a Expo con EAS CLI

**1. Renombrar el archivo (opcional pero recomendado):**
   ```powershell
   Rename-Item "app-trabajo-en-terreno-firebase-adminsdk-xxxxx-xxxxxxxxxx.json" "google-services-account.json"
   ```

**2. Configurar con EAS:**
   ```powershell
   cd mobile
   eas credentials
   ```

**3. Selecciona:**
   - Platform: **Android**
   - Profile: **production**
   - **"Google Service Account"** (NO "FCM Server Key")
   - **"Upload a new JSON key"**
   - Selecciona el archivo que descargaste

**4. Confirma** → EAS guardará las credenciales

---

## ✅ Paso 3: Actualizar app.json

Asegúrate que `mobile/app.json` tiene:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "useNextNotificationsApi": true  ← Agregar esto
    }
  }
}
```

---

## ✅ Paso 4: Recompilar APK

```powershell
cd mobile
eas build -p android --profile preview
```

Espera 10-15 minutos.

---

## ✅ Paso 5: Testing

Después de instalar el nuevo APK:

**Backend logs esperados:**
```
📅 Enviando notificación inmediata: actividad "..." compartida con 1 usuario(s)
📤 Enviando notificación a 1 dispositivo(s) con tokens válidos
📦 Enviando 1 mensajes en 1 chunk(s)
✅ Chunk enviado: 1 tickets recibidos
✅ Notificaciones enviadas exitosamente: 1/1  ← Sin errores ✅
```

**Ya NO debe aparecer:**
```
⚠️ 1 notificaciones fallaron: [
  { message: "Unable to retrieve the FCM server key..." }
]
```

---

## 🎯 Diferencia: Server Key vs Service Account

| Método | API | Ventaja |
|--------|-----|---------|
| **Server Key** | Legacy (obsoleta) | Simple pero obsoleta |
| **Service Account JSON** | V1 (moderna) | ✅ Más seguro, recomendado |

---

## 📝 Resumen

1. ✅ Firebase → Cuentas de servicio → Generar nueva clave privada
2. ✅ Descargar JSON
3. ✅ `eas credentials` → Google Service Account → Upload JSON
4. ✅ Agregar `"useNextNotificationsApi": true` en app.json
5. ✅ Recompilar APK
6. ✅ Instalar y probar

---

**Este es el método MODERNO y RECOMENDADO por Expo.**
