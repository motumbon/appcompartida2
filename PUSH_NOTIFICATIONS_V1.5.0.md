# Push Notifications Completas - Versión 1.5.0

## 🎯 Objetivo
Implementar sistema completo de notificaciones push que funcione incluso cuando la app está cerrada, con monitoreo automático de cambios cada 2 minutos.

## ✅ Implementación Completa

### 🔧 Backend (Servidor)

#### 1. Dependencias Nuevas
- `expo-server-sdk@^3.7.0` - SDK de Expo para enviar push notifications
- `node-cron@^3.0.3` - Para programar tareas periódicas

#### 2. Modelo: `PushToken.js` ✅
- Almacena tokens de push de usuarios
- Un token por usuario (campo unique)
- Incluye información del dispositivo

#### 3. Servicio: `pushNotificationService.js` ✅
**Métodos:**
- `sendToUsers()` - Enviar a usuarios específicos
- `sendBatch()` - Enviar lotes a Expo
- `notifySharedActivity()` - Notificar actividad compartida
- `notifySharedTask()` - Notificar tarea compartida
- `notifySharedNote()` - Notificar nota compartida
- `notifySharedComplaint()` - Notificar reclamo compartido
- `notifyContractsUpdate()` - Notificar contratos actualizados
- `notifyStockUpdate()` - Notificar stock actualizado

#### 4. Servicio: `notificationMonitor.js` ✅ **NUEVO**
**Funcionalidad:**
- Monitoreo automático cada 2 minutos
- Verifica nuevas actividades compartidas
- Verifica nuevas tareas compartidas
- Verifica nuevas notas compartidas
- Envía notificaciones push automáticamente
- Tracking de última verificación por tipo

**Métodos:**
- `start()` - Iniciar monitoreo
- `stop()` - Detener monitoreo
- `checkForUpdates()` - Verificación manual
- `checkNewActivities()` - Verificar actividades
- `checkNewTasks()` - Verificar tareas
- `checkNewNotes()` - Verificar notas

#### 5. Rutas: `pushTokens.js` ✅
- `POST /api/push-tokens/register` - Registrar/actualizar token
- `DELETE /api/push-tokens/unregister` - Eliminar token (logout)

#### 6. Index.js Actualizado ✅
- Ruta de push tokens registrada
- Servicio de monitoreo iniciado automáticamente al arrancar el servidor

### 📱 Frontend (Mobile)

#### 1. Configuración: `app.json` ✅
**Cambios:**
- Versión: 1.4.9 → **1.5.0**
- versionCode: 20 → **21**
- Plugin `expo-notifications` configurado con modo production
- `adaptiveIcon` para Android
- Configuración de notificaciones (icono, color)

#### 2. API: `api.js` ✅
**Nuevo endpoint:**
```javascript
export const pushTokensAPI = {
  register: (data) => api.post('/push-tokens/register', data),
  unregister: () => api.delete('/push-tokens/unregister')
};
```

#### 3. Servicio: `notificationService.js` ✅
**Mejoras:**
- Obtención de token **real** de Expo Push Notifications
- Registro automático del token en el backend
- Configuración mejorada de canales Android
- Logging detallado para diagnóstico
- Método de prueba integrado

**Nuevo método:**
- `registerTokenWithBackend()` - Envía el token al servidor

#### 4. HomeScreen.js ✅
**Botón de prueba:**
- Ícono de campana verde en el header
- Permite probar notificaciones manualmente
- Útil para verificar funcionamiento

## 🚀 Instalación y Despliegue

### Paso 1: Instalar Dependencias del Servidor
```bash
cd "c:/Users/pablo/OneDrive/Escritorio/Proyectos de Aplicaciones/App Trabajo en terreno 2.0"
npm install
```

Esto instalará:
- `expo-server-sdk`
- `node-cron`

### Paso 2: Reiniciar el Servidor
Si el servidor está en Railway, el deploy automático instalará las dependencias.

Si es local:
```bash
npm run server
```

Deberías ver en los logs:
```
🔔 Iniciando monitoreo de notificaciones push...
✅ Monitoreo de notificaciones activado (cada 2 minutos)
```

### Paso 3: Compilar APK Móvil
```bash
cd mobile
$env:EAS_NO_VCS='1'; eas build -p android --profile preview
```

### Paso 4: Instalar y Probar
1. Instala el APK versión 1.5.0
2. Abre la app y otorga permisos de notificación
3. Verifica en los logs del servidor que el token se registró:
   ```
   🎫 Token de push obtenido: ExponentPushToken[xxxxxx]
   ✅ Token registrado en el backend correctamente
   ```

## 🧪 Cómo Probar

### Prueba 1: Botón de Prueba Manual
1. Abre la app
2. En la pantalla de inicio, toca el **ícono de campana verde**
3. Deberías ver:
   - Alert: "Prueba enviada"
   - Notificación aparece inmediatamente

### Prueba 2: Notificaciones Automáticas
1. **Usuario A** (en un dispositivo):
   - Crear una actividad/tarea/nota
   - Compartirla con **Usuario B**

2. **Usuario B** (en otro dispositivo):
   - Esperar máximo 2 minutos
   - Debería recibir una notificación push
   - **Funciona incluso si la app está cerrada**

### Prueba 3: Verificar en Logs del Servidor
```bash
# Ver logs del servidor
🔍 Verificando actualizaciones... [hora]
📅 Nueva actividad compartida: "[título]" con 1 usuarios
✅ Notificación enviada correctamente
```

## 📊 Flujo Completo

```
1. Usuario abre app móvil
   ↓
2. App obtiene token de Expo Push Notifications
   ↓
3. App envía token al backend (/api/push-tokens/register)
   ↓
4. Backend guarda token en MongoDB
   ↓
5. Servidor inicia monitoreo automático (cada 2 minutos)
   ↓
6. Usuario A comparte actividad con Usuario B
   ↓
7. Monitoreo detecta nueva actividad compartida
   ↓
8. Backend envía push notification a Expo
   ↓
9. Expo entrega notificación al dispositivo de Usuario B
   ↓
10. Usuario B recibe notificación (app abierta o cerrada)
```

## 🔧 Configuración del Monitoreo

El monitoreo está configurado en `notificationMonitor.js`:

```javascript
// Ejecutar cada 2 minutos
this.cronJob = cron.schedule('*/2 * * * *', async () => {
  await this.checkForUpdates();
});
```

**Frecuencias disponibles:**
- Cada minuto: `'* * * * *'`
- Cada 2 minutos: `'*/2 * * * *'` ← **Actual**
- Cada 5 minutos: `'*/5 * * * *'`
- Cada 10 minutos: `'*/10 * * * *'`

## 📱 Canales de Notificación Android

Se crearon 2 canales:

### 1. Default (Notificaciones Generales)
- Importancia: MAX
- Sonido: Habilitado
- Vibración: [0, 250, 250, 250]
- Color: #3b82f6 (azul)

### 2. High Priority (Notificaciones Importantes)
- Importancia: MAX
- Sonido: Habilitado
- Vibración: [0, 500, 250, 500]
- Color: #ef4444 (rojo)

## ⚠️ Requisitos Importantes

### En el Dispositivo:
1. ✅ Permisos de notificación otorgados
2. ✅ Modo "No Molestar" desactivado
3. ✅ Optimización de batería desactivada para la app
4. ✅ Internet activo (para recibir push)

### En el Servidor:
1. ✅ Dependencias instaladas (`expo-server-sdk`, `node-cron`)
2. ✅ Servidor ejecutándose
3. ✅ MongoDB conectado
4. ✅ Monitoreo iniciado

## 🐛 Diagnóstico de Problemas

### No llegan notificaciones:

1. **Verificar token registrado:**
   ```bash
   # En MongoDB, buscar en la colección 'pushtokens'
   db.pushtokens.find({ user: ObjectId("ID_USUARIO") })
   ```

2. **Verificar logs del servidor:**
   ```
   🔍 Verificando actualizaciones...
   📅 Nueva actividad compartida...
   ```

3. **Verificar permisos en el dispositivo:**
   - Configuración → Apps → App Trabajo en Terreno → Notificaciones

4. **Verificar que el token sea válido:**
   - Debe empezar con `ExponentPushToken[...]`
   - Si es `"local-notifications-enabled"`, hay un problema

### Error al obtener token:

- Asegúrate de estar en un **dispositivo físico** (no emulador)
- Verifica conexión a internet
- Reinstala la app completamente

### Monitoreo no funciona:

- Verifica logs del servidor al iniciar:
  ```
  ✅ Monitoreo de notificaciones activado (cada 2 minutos)
  ```
- Si no aparece, revisar que `notificationMonitor.start()` esté en `index.js`

## 📈 Mejoras Futuras (Opcional)

1. **Notificaciones instantáneas:**
   - En lugar de verificar cada 2 minutos
   - Enviar notificación inmediatamente al crear/compartir

2. **Tipos de notificación personalizados:**
   - Urgentes
   - Recordatorios
   - Actualizaciones

3. **Configuración de usuario:**
   - Permitir activar/desactivar tipos de notificaciones
   - Horarios de "No Molestar"

4. **Estadísticas:**
   - Dashboard de notificaciones enviadas
   - Tasa de apertura
   - Dispositivos activos

## 🎉 Resumen de Cambios

### Backend:
- ✅ 2 nuevas dependencias instaladas
- ✅ Sistema de monitoreo automático con cron
- ✅ Servicio de push notifications completo
- ✅ Ruta de registro de tokens
- ✅ Verificación cada 2 minutos

### Frontend:
- ✅ Obtención de token real de Expo
- ✅ Registro automático en backend
- ✅ Mejores logs para diagnóstico
- ✅ Botón de prueba en home
- ✅ Versión 1.5.0

## 📞 Soporte

Si las notificaciones push aún no funcionan:
1. Revisa los logs del servidor y de la app
2. Verifica que el token esté registrado en MongoDB
3. Prueba con el botón de prueba manual
4. Asegúrate de que ambos usuarios tengan tokens registrados
5. Espera al menos 2 minutos después de compartir algo
