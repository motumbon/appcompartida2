# Sistema de Notificaciones con Polling - Versión 1.5.1

## 🔧 Problema Resuelto

**Error anterior:** Firebase no estaba configurado, causando error al obtener token de Expo Push Notifications.

**Solución:** Sistema híbrido que funciona sin Firebase usando:
1. **Notificaciones locales** - Cuando la app está abierta
2. **Polling cada 2 minutos** - Verifica cambios en el servidor
3. **Backend con monitoreo** - También verifica cada 2 minutos

## ✅ Cómo Funciona Ahora

### Sistema Dual de Verificación

#### 1. Frontend (App Móvil) - Polling Activo
- Verifica cada 2 minutos cuando la app está **abierta**
- Compara con última verificación guardada
- Muestra notificaciones locales inmediatamente
- **NO requiere Firebase**

#### 2. Backend (Servidor) - Monitoreo Continuo
- Verifica cada 2 minutos (app abierta o cerrada)
- Busca nuevos items compartidos
- Si encuentra, envía a través de Expo (requiere Firebase para push real)
- Como fallback, el frontend hará polling

## 📱 Implementación Frontend

### 1. Servicio de Polling (`pollingService.js`) ✅ **NUEVO**

**Funciones principales:**
```javascript
startForegroundPolling()   // Inicia polling cada 2 minutos
stopForegroundPolling()     // Detiene polling
checkForUpdates()           // Verificación manual
checkNewActivities()        // Verifica actividades
checkNewTasks()             // Verifica tareas
checkNewNotes()             // Verifica notas
```

**Flujo:**
1. Carga última verificación desde SecureStore
2. Consulta APIs de actividades/tareas/notas
3. Filtra items compartidos y nuevos
4. Muestra notificación local
5. Guarda nuevo timestamp de verificación

### 2. Servicio de Notificaciones Mejorado

**Manejo de error de Firebase:**
```javascript
try {
  // Intenta obtener token de Expo
  token = await Notifications.getExpoPushTokenAsync();
} catch (error) {
  // Si falla (no Firebase), usa token local
  token = `local-${Device.modelName}-${Date.now()}`;
}
```

**Resultado:**
- ✅ No muestra error al usuario
- ✅ Registra token local en backend
- ✅ Continúa funcionando con polling

### 3. HomeScreen Actualizado

**Cambios:**
```javascript
// Inicia polling al abrir app
await pollingService.startForegroundPolling();

// Detiene polling al cerrar
return () => {
  pollingService.stopForegroundPolling();
};
```

## 🔄 Flujo Completo de Notificaciones

```
Usuario A comparte actividad con Usuario B
                ↓
    ┌───────────────────────────┐
    │   Backend Monitoreo       │ (cada 2 min)
    │   Detecta cambio          │
    │   Intenta enviar push     │
    └───────────────────────────┘
                ↓
         (falla sin Firebase)
                ↓
    ┌───────────────────────────┐
    │   Frontend Polling        │ (cada 2 min)
    │   Usuario B tiene app     │
    │   abierta                 │
    └───────────────────────────┘
                ↓
    ┌───────────────────────────┐
    │   Consulta API            │
    │   /activities, /tasks     │
    │   /notes                  │
    └───────────────────────────┘
                ↓
    ┌───────────────────────────┐
    │   Detecta item nuevo      │
    │   compartido              │
    └───────────────────────────┘
                ↓
    ┌───────────────────────────┐
    │   Muestra notificación    │
    │   local                   │
    └───────────────────────────┘
                ↓
    Usuario B ve la notificación ✅
```

## ⚙️ Configuración

### Frecuencia de Polling

**Frontend (pollingService.js):**
```javascript
// Cada 2 minutos (actual)
this.intervalId = setInterval(async () => {
  await this.checkForUpdates();
}, 2 * 60 * 1000);
```

**Opciones:**
- 1 minuto: `1 * 60 * 1000`
- 2 minutos: `2 * 60 * 1000` ← **Actual**
- 5 minutos: `5 * 60 * 1000`

### Persistencia

Los timestamps de última verificación se guardan en:
```javascript
SecureStore.setItemAsync('lastNotificationCheck', JSON.stringify({
  activities: '2024-01-08T10:30:00.000Z',
  tasks: '2024-01-08T10:30:00.000Z',
  notes: '2024-01-08T10:30:00.000Z'
}));
```

## 🧪 Cómo Probar

### Prueba 1: Polling Funciona
1. Abre la app en dispositivo de Usuario B
2. Verifica logs (si conectas con adb):
   ```
   🔄 Iniciando polling de notificaciones (cada 2 minutos)...
   ✅ Polling activado
   ```
3. En otro dispositivo, Usuario A comparte una actividad con Usuario B
4. Espera **máximo 2 minutos**
5. Usuario B debería ver notificación local

### Prueba 2: Sin Errores de Firebase
1. Abre la app
2. Acepta permisos de notificación
3. **NO debería aparecer error** de Firebase
4. Verifica logs:
   ```
   ⚠️ No se pudo obtener token de Expo (requiere Firebase)
   📲 Usando sistema de notificaciones locales con polling
   ```

### Prueba 3: Botón de Prueba
1. Toca ícono de campana verde
2. Debería mostrar notificación inmediatamente
3. Confirma que permisos están correctos

## ⚠️ Limitaciones

### Con Este Sistema (Sin Firebase):

✅ **Funciona:**
- Notificaciones cuando app está abierta
- Verificación cada 2 minutos
- Notificaciones locales inmediatas
- No requiere configuración adicional

❌ **NO Funciona:**
- Notificaciones cuando app está **completamente cerrada**
- Push notifications instantáneas
- Notificaciones en background profundo

### Para Notificaciones Verdaderas Push (Requiere Firebase):

1. Configurar proyecto en Firebase Console
2. Descargar `google-services.json`
3. Agregarlo al proyecto Expo
4. Configurar en `app.json`:
   ```json
   "android": {
     "googleServicesFile": "./google-services.json"
   }
   ```
5. Rebuild del APK

## 🔍 Diagnóstico

### Verificar que polling está activo:

**Logs esperados:**
```
🔄 Iniciando polling de notificaciones (cada 2 minutos)...
✅ Polling activado
🔍 Verificando actualizaciones... [hora]
```

### Si no llegan notificaciones:

1. **Verifica que la app esté abierta**
   - El polling solo funciona con app abierta
   - En background por unos minutos sí funciona
   - Cerrada completamente NO

2. **Revisa permisos**
   - Configuración → Apps → App Trabajo en Terreno → Notificaciones

3. **Verifica última verificación**
   - Los timestamps se guardan en SecureStore
   - Reinstalar app resetea esto

4. **Prueba botón manual**
   - Ícono de campana verde
   - Confirma que notificaciones locales funcionan

## 📊 Comparación de Sistemas

| Característica | Con Firebase | Sin Firebase (Actual) |
|----------------|--------------|----------------------|
| Push cuando app cerrada | ✅ Sí | ❌ No |
| Notificaciones inmediatas | ✅ Sí | ⏱️ Cada 2 min |
| App abierta | ✅ Sí | ✅ Sí |
| Configuración compleja | ❌ Sí | ✅ No |
| Requiere google-services | ❌ Sí | ✅ No |
| Batería | ✅ Eficiente | ⚠️ Más consumo |

## 🚀 Instalación

### Versión: 1.5.1 (versionCode 22)

1. **Instalar APK** en dispositivo
2. **Otorgar permisos** de notificación
3. **Dejar app abierta** o en background
4. **Esperar** cambios (máx 2 minutos)

### No se requiere:
- ❌ Configurar Firebase
- ❌ Descargar archivos adicionales
- ❌ Modificar código nativo

## 💡 Recomendaciones

### Para Mejor Experiencia:

1. **Mantén la app abierta** en background
2. **Desactiva optimización de batería**
   - Configuración → Batería → App Trabajo en Terreno → Sin restricciones
3. **Verifica cada 1-2 minutos** manualmente si esperas algo urgente
4. **Usa botón de prueba** para confirmar que funciona

### Para el Futuro:

Si necesitas **notificaciones cuando app está cerrada**, considera:
1. Configurar Firebase (1-2 horas de trabajo)
2. O mantener app en background siempre
3. O usar alarmas programadas del sistema (limitado en Android 12+)

## 📝 Resumen de Cambios v1.5.1

### Código:
- ✅ `pollingService.js` - Nuevo servicio de polling
- ✅ `notificationService.js` - Manejo de error Firebase
- ✅ `HomeScreen.js` - Inicia/detiene polling
- ✅ Versión: 1.5.0 → 1.5.1

### Comportamiento:
- ✅ No muestra error al aceptar permisos
- ✅ Usa token local si Firebase no disponible
- ✅ Polling cada 2 minutos cuando app abierta
- ✅ Notificaciones locales funcionan

### Backend:
- ✅ Sin cambios (ya tiene monitoreo con cron)
- ✅ Compatible con tokens locales

## 🎯 Conclusión

El sistema ahora funciona **sin Firebase**, usando polling cada 2 minutos. Es una solución práctica que:

✅ No requiere configuración compleja
✅ No muestra errores al usuario
✅ Funciona mientras app está abierta/background
✅ Es fácil de mantener

Para notificaciones cuando la app está completamente cerrada, sería necesario configurar Firebase en el futuro.
