# 🔍 Diagnóstico Definitivo - Sistema de Notificaciones Push

## ❌ Problema Actual

**Reporte:** Las notificaciones NO funcionan en ningún escenario:
- ❌ NO funcionan con app cerrada
- ❌ NO funcionan con app abierta  
- ❌ NO funcionan con pull-to-refresh
- ❌ NO llegan al momento de compartir

## 🎯 La Pregunta Clave

**¿Es posible implementar notificaciones push en esta arquitectura?**

**Respuesta: SÍ, 100% POSIBLE.** Pero hay varios problemas críticos que lo impiden actualmente.

---

## 🔍 Análisis Profundo del Sistema

### 1. **Backend USA mal la API de Expo** 🚨 CRÍTICO

**Código Actual** (`server/services/pushNotificationService.js`):
```javascript
import axios from 'axios';  // ❌ Usando axios directamente

class PushNotificationService {
  constructor() {
    this.expo_push_url = 'https://exp.host/--/api/v2/push/send';
  }
  
  async sendBatch(messages) {
    const response = await axios.post(this.expo_push_url, messages, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return response.data;
  }
}
```

**Problemas:**
1. ❌ NO usa `expo-server-sdk` (aunque está instalado en package.json)
2. ❌ NO valida tokens con `Expo.isExpoPushToken()`
3. ❌ NO divide mensajes en chunks (límite 100 por request)
4. ❌ NO verifica receipts (no sabemos si llegaron)
5. ❌ NO tiene retry logic para errores

**Consecuencia:** Aunque el código PARECE que envía push, probablemente Expo está rechazando las requests silenciosamente.

---

### 2. **¿Qué Versión Tienen Instalada?** 🚨 CRÍTICO

**Si tienen v1.6.1 o anterior:**
```javascript
// Token registrado:
local-device-1728415200000-abc123xyz  // ❌ INVÁLIDO

// Backend lo filtra:
if (!token.startsWith('ExponentPushToken[')) {
  return { success: false, message: 'No valid Expo tokens' };
}
```

**Resultado:** 0 notificaciones enviadas porque NO hay tokens válidos.

**APK v1.7.1 compilado:**
- ✅ Link: https://expo.dev/artifacts/eas/nhkSwVen4PDHvPxB85ZTCV.apk
- ⚠️ **PERO AÚN NO INSTALADO**

---

### 3. **Sistema Híbrido Mal Coordinado** 🚨

Actualmente tienen 3 mecanismos que NO trabajan juntos:

**A. Push del Servidor (Backend)**
```javascript
// server/routes/activities.js
pushNotificationService.notifySharedActivity(activity, sharedUserIds);
```
- Intenta enviar push
- Pero usa axios (mal implementado)
- Y filtra tokens inválidos

**B. Polling Local (Cliente)**
```javascript
// mobile/src/services/pollingService.js
setInterval(() => {
  checkForUpdates();  // Cada 2 minutos
}, 2 * 60 * 1000);
```
- Verifica cambios cada 2 minutos
- Genera notificaciones LOCALES
- Solo funciona con app abierta

**C. Detección en HomeScreen (Cliente)**
```javascript
// mobile/src/screens/HomeScreen.js
if (!isFirstLoad && previousDataRef.current.activities.length > 0) {
  // Detecta nuevas actividades
  // Genera notificaciones LOCALES
}
```
- Solo funciona en mount inicial
- NO funciona en refresh (ahora sí en v1.7.1)

**Problema:** Los 3 sistemas compiten entre sí y ninguno funciona correctamente.

---

## ✅ Solución Definitiva

### Arquitectura Correcta

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO A                            │
│            (Comparte actividad con B)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ POST /api/activities
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js)                      │
│                                                          │
│  1. Guardar actividad ✅                                │
│  2. Detectar sharedWith nuevos ✅                       │
│  3. pushNotificationService.notifySharedActivity() ✅   │
│     │                                                    │
│     ├─ Obtener tokens de usuarios ✅                    │
│     ├─ Validar con Expo.isExpoPushToken() ⭐ FALTA    │
│     ├─ Dividir en chunks (100 max) ⭐ FALTA           │
│     ├─ Enviar con expo.sendPushNotificationsAsync() ⭐ │
│     └─ Verificar receipts ⭐ OPCIONAL                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Via Expo Push Service
                     ▼
┌─────────────────────────────────────────────────────────┐
│              EXPO PUSH SERVICE                          │
│       (exp.host/--/api/v2/push/send)                   │
│                                                          │
│  - Valida tokens ✅                                     │
│  - Encola notificaciones ✅                             │
│  - Entrega a FCM/APNS ✅                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─── Via FCM (Android) ──────┐
                     │                             │
                     ▼                             ▼
┌────────────────────────────────┐   ┌────────────────────────────────┐
│       DISPOSITIVO B            │   │       DISPOSITIVO C            │
│    (App CERRADA o ABIERTA)    │   │    (App CERRADA o ABIERTA)    │
│                                │   │                                │
│  📱 Notificación aparece      │   │  📱 Notificación aparece      │
│     incluso con app killed    │   │     incluso con app killed    │
└────────────────────────────────┘   └────────────────────────────────┘
```

---

### Cambios Necesarios

#### 1. Reemplazar pushNotificationService.js con expo-server-sdk ⭐

**Código Nuevo:**
```javascript
import { Expo } from 'expo-server-sdk';
import PushToken from '../models/PushToken.js';

class PushNotificationService {
  constructor() {
    this.expo = new Expo();  // ⭐ Usar librería oficial
  }

  async sendToUsers(userIds, notification) {
    try {
      // Obtener tokens
      const pushTokens = await PushToken.find({
        user: { $in: userIds }
      });

      if (pushTokens.length === 0) {
        console.log('⚠️ No hay tokens registrados');
        return { success: false, message: 'No tokens found' };
      }

      // ⭐ Filtrar con validación oficial de Expo
      const validTokens = pushTokens.filter(pt => 
        Expo.isExpoPushToken(pt.token)
      );

      if (validTokens.length === 0) {
        console.log('⚠️ No hay tokens válidos de Expo');
        return { success: false, message: 'No valid Expo tokens' };
      }

      // ⭐ Preparar mensajes con formato correcto
      const messages = validTokens.map(pt => ({
        to: pt.token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: 'high',
        channelId: 'default'
      }));

      // ⭐ Dividir en chunks automáticamente
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      // ⭐ Enviar cada chunk
      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error enviando chunk:', error);
        }
      }

      console.log(`✅ ${tickets.length} notificaciones enviadas`);
      return { success: true, tickets };
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PushNotificationService();
```

#### 2. Instalar APK v1.7.1 en TODOS los Dispositivos ⭐

**CRÍTICO:** Sin esto, los tokens siguen siendo `local-device-...`

**Link del APK:**
```
https://expo.dev/artifacts/eas/nhkSwVen4PDHvPxB85ZTCV.apk
```

**Pasos:**
1. Desinstalar versión anterior
2. Instalar v1.7.1
3. Abrir app y login
4. Verificar logs: `Token de push obtenido: ExponentPushToken[...]`

#### 3. Verificar Firebase está Configurado ⭐

**Firebase Project:**
- ✅ project_id: `app-trabajo-en-terreno`
- ✅ package_name: `com.apptrabajoenterreno.mobile`
- ✅ API key: `AIzaSyD7hy3gxhgScvAE5xX_hLAJzJjbCCfdp3c`

**Verificar en Firebase Console:**
1. https://console.firebase.google.com/
2. Proyecto: "app-trabajo-en-terreno"
3. Cloud Messaging → Verificar que esté habilitado

---

## 🧪 Plan de Testing

### Test 1: Verificar Tokens (PRIMERO)

**Endpoint:**
```bash
GET https://web-production-10bfc.up.railway.app/api/push-tokens/list
```

**Respuesta esperada:**
```json
{
  "total": 3,
  "validTokens": 3,  // ⭐ Debe ser > 0
  "localTokens": 0,  // ⭐ Debe ser 0
  "tokens": [
    {
      "username": "oscar",
      "token": "ExponentPushToken[xxxxxx]",  // ⭐ VÁLIDO
      "isValid": true
    }
  ]
}
```

**Si `validTokens: 0`:**
- ❌ NO tienen instalado v1.7.1
- Instalar APK nuevo en todos los dispositivos

### Test 2: Push del Servidor (Backend)

**Con expo-server-sdk implementado:**

1. Dispositivo A: Compartir actividad
2. Ver logs del backend:
   ```
   📅 Enviando notificación inmediata: actividad "..." compartida con 1 usuario(s)
   📤 Enviando notificación a 1 dispositivo(s) con tokens válidos
   ✅ 1 notificaciones enviadas
   ```
3. Dispositivo B (app cerrada): Notificación aparece en 5-10 segundos

### Test 3: Polling Local (Cliente)

**Solo si push falla:**

1. Dispositivo A: Compartir actividad
2. Dispositivo B: App abierta
3. Hacer pull-to-refresh
4. Notificación local aparece

---

## 📊 Por Qué NO Funciona Actualmente

| Componente | Estado | Problema |
|-----------|--------|----------|
| **Backend push** | ❌ Mal implementado | No usa expo-server-sdk |
| **Tokens en DB** | ❌ Inválidos | Tienen v1.6.1 con `local-device` |
| **APK v1.7.1** | ✅ Compilado | Pero NO instalado |
| **Firebase** | ✅ Configurado | OK |
| **Event-driven** | ✅ Código OK | Pero push service falla |
| **Polling** | ⚠️ Funciona parcial | Solo con app abierta |

---

## ✅ Solución en 3 Pasos

### Paso 1: Arreglar Backend (15 minutos)

Reemplazar `pushNotificationService.js` para usar `expo-server-sdk` correctamente.

### Paso 2: Instalar APK v1.7.1 (5 minutos)

En TODOS los dispositivos:
1. Desinstalar app actual
2. Instalar: https://expo.dev/artifacts/eas/nhkSwVen4PDHvPxB85ZTCV.apk
3. Login
4. Verificar token

### Paso 3: Testing (10 minutos)

1. Verificar tokens válidos (endpoint `/api/push-tokens/list`)
2. Compartir algo
3. Verificar que llegue notificación

---

## 🎯 Respuesta a "¿Es posible?"

**SÍ, es 100% posible implementar notificaciones push.**

**Pero necesitan:**
1. ✅ Backend que use `expo-server-sdk` correctamente (a implementar)
2. ✅ Tokens válidos `ExponentPushToken[...]` (requiere v1.7.1)
3. ✅ Firebase configurado (ya lo tienen)
4. ✅ Event-driven en backend (ya lo tienen)

**El problema NO es la arquitectura, es la implementación.**

---

**¿Quieres que implemente el fix del backend con expo-server-sdk correctamente?**
