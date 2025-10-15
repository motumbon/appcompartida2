# 🔑 Configurar FCM V1 para Push Notifications en Expo

## El Problema

Ya configuramos:
- ✅ Google Service Account → Para BUILDS
- ❌ FCM para Push Notifications → FALTA

**Son dos configuraciones diferentes en EAS.**

---

## Pasos en el Menú de `eas credentials`

### 1. Select platform
```
? Select platform › 
  ❯ Android
```
**Selecciona:** Android (Enter)

---

### 2. Select a build profile
```
? Select a build profile › 
  ❯ production
```
**Selecciona:** production (Enter)

---

### 3. ¿Qué Hacer?

Aquí el menú mostrará todas las credenciales. Busca:

```
? What do you want to do? › 
  Google Service Account
  ❯ Set up a Google Service Account and configure Push Notifications  ← ESTA
  Push Notifications: FCM V1 service account key
  Keystore
  ...
```

**O puede aparecer como:**
```
? What do you want to do? › 
  ❯ Push Notifications: FCM V1 service account key  ← ESTA
  Google Service Account
  ...
```

**Selecciona la opción relacionada con "Push Notifications" + "FCM V1" + "service account"**

---

### 4. Upload Service Account

Te pedirá el archivo JSON del Service Account.

**Escribe:**
```
C:\Users\pablo\Downloads\app-trabajo-en-terreno-firebase-adminsdk-fbsvc-ae8baf4c1c.json
```

O si no funciona, usa el que copiamos:
```
./google-service-account.json
```

---

### 5. Confirmar

Debería decir:
```
✅ FCM V1 service account configured successfully
```

**Presiona Ctrl+C para salir.**

---

## Verificar

Ejecuta de nuevo:
```powershell
eas credentials
```

Android → production → Deberías ver:

```
✓ Google Service Account: Configured
✓ FCM V1 Service Account: Configured  ← Esto es lo nuevo
✓ Keystore: Configured
```

---

## Probar (SIN recompilar)

1. **Dispositivo B:** Cerrar app (v1.7.2)
2. **Dispositivo A:** Compartir actividad
3. **Logs esperados:**
   ```
   ✅ Notificaciones enviadas exitosamente: 1/1
   ```

---

**Si no ves la opción de "Push Notifications FCM V1", toma screenshot del menú y me lo compartes.**
