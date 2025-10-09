# 🔑 Configurar FCM Server Key en Expo (Para Push Notifications)

## ⚠️ IMPORTANTE

El Service Account configurado en EAS es para **BUILDS**.
Para **PUSH NOTIFICATIONS**, Expo necesita el **FCM Server Key** configurado por separado.

---

## Paso 1: Obtener FCM Server Key desde Firebase

### Opción A: Si Cloud Messaging API (Legacy) Está Habilitada

1. Ve a: https://console.firebase.google.com/project/app-trabajo-en-terreno/settings/cloudmessaging

2. Busca la sección: **"Cloud Messaging API (Legacy)"**

3. Si ves un **"Server key"** (empieza con `AAAAxxx...`), cópialo

### Opción B: Si Cloud Messaging API (Legacy) Está Deshabilitada

1. Ve a: https://console.firebase.google.com/project/app-trabajo-en-terreno/settings/cloudmessaging

2. En la sección "Cloud Messaging API (Legacy)", click en los 3 puntos (⋮)

3. Click **"Manage API in Google Cloud Console"**

4. Habilita la API **"Cloud Messaging API"** (la legacy)

5. Vuelve a Firebase Console → Cloud Messaging

6. Ahora deberías ver el **"Server key"**, cópialo

---

## Paso 2: Configurar en Expo con EAS CLI

### Método 1: Usando `eas credentials` (RECOMENDADO)

```powershell
cd mobile
eas credentials
```

**Selecciones:**
1. **Android**
2. **production**
3. **"Push Notifications: FCM server key"** ← Esta opción
4. **"Add a new FCM server key"**
5. Pega el Server Key que copiaste
6. Enter

### Método 2: Desde Expo Dashboard (Alternativa)

1. Ve a: https://expo.dev/accounts/[tu-cuenta]/projects/app-trabajo-terreno-mobile/credentials

2. Click en **"Android"**

3. Busca sección: **"FCM Server Key"**

4. Click **"Add FCM Server Key"**

5. Pega el Server Key

6. Save

---

## Paso 3: Verificar Configuración

Después de configurar, ejecuta:

```powershell
cd mobile
eas credentials
```

**Selecciona:**
- Android → production

**Deberías ver:**
```
✓ Google Service Account: Configured
✓ FCM Server Key: Configured  ← Esto debe aparecer
✓ Keystore: Configured
```

---

## Paso 4: NO Necesitas Recompilar APK

**IMPORTANTE:** El FCM Server Key es para el servicio de push de Expo, NO para el APK.

**NO necesitas recompilar.** El APK v1.7.2 ya funciona.

---

## Paso 5: Probar Notificaciones

Después de configurar el FCM Server Key:

1. **NO desinstalar/reinstalar app** (ya está v1.7.2)
2. **Dispositivo B:** Cerrar app
3. **Dispositivo A:** Compartir actividad
4. **Ver logs del backend:**

**Logs esperados:**
```
📦 Enviando 1 mensajes en 1 chunk(s) via Expo Push Service
✅ Chunk enviado: 1 tickets recibidos
✅ Notificaciones enviadas exitosamente: 1/1  ← SIN errores
```

**Si TODAVÍA aparece el error "Unable to retrieve FCM server key":**
- Espera 2-3 minutos (puede tardar en propagarse)
- Verifica que el Server Key esté bien copiado (sin espacios extra)
- Reinicia el backend (Railway auto-redeploy)

---

## 🎯 Resumen

| Qué Configurar | Dónde | Para Qué |
|----------------|-------|----------|
| **Google Service Account** | EAS credentials | Builds del APK ✅ |
| **FCM Server Key** | EAS credentials (Push Notifications) | Enviar notificaciones ⏳ |

**Ambos son necesarios:**
- Service Account → APK funciona
- FCM Server Key → Notificaciones push funcionan

---

**Configura el FCM Server Key con `eas credentials` y prueba de nuevo.** 🔑
