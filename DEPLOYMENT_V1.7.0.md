# 🚀 Guía de Deployment - Versión 1.7.0

## 📦 Cambios en esta Versión

### Backend
- ✅ **Event-driven push notifications** en endpoints de actividades, tareas y notas
- ✅ **Monitor mejorado** usando `updatedAt` con lookback de 10 minutos
- ✅ **Logs mejorados** distinguiendo entre envíos inmediatos y cron

### Mobile
- ✅ **Registro de token robusto** en AuthContext
- ✅ **Desregistro automático** al logout
- ✅ **HomeScreen simplificado** (sin registro duplicado)

## 🔧 Deployment Backend (Railway)

### Opción 1: Reiniciar el Servicio (Más Rápido)

Si Railway está conectado al repositorio y los cambios ya están en el repo:

1. **Dashboard de Railway** → Tu proyecto
2. **"Deploy"** → **"Redeploy"**
3. Esperar 2-3 minutos
4. ✅ Verificar logs que aparezca:
   ```
   ✅ Monitoreo de notificaciones activado (cada 2 minutos)
   ```

### Opción 2: Push Manual (Si no tienes Git)

**Archivos modificados del backend:**
```
server/routes/activities.js
server/routes/tasks.js
server/routes/notes.js
server/services/notificationMonitor.js
```

**Pasos:**
1. Subir estos 4 archivos manualmente a Railway (si es posible)
2. O copiar el código directamente en el editor de Railway
3. Reiniciar el servicio

### Opción 3: Git Push (Recomendado)

Si tienes Git configurado:

```bash
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0"

# Agregar cambios
git add server/routes/activities.js
git add server/routes/tasks.js
git add server/routes/notes.js
git add server/services/notificationMonitor.js

# Commit
git commit -m "feat: implement event-driven push notifications v1.7.0"

# Push
git push origin main
```

Railway detectará el push y desplegará automáticamente.

### ✅ Verificación Backend

**1. Verificar que el servidor arrancó:**
```bash
# En Railway logs:
✅ Monitoreo de notificaciones activado (cada 2 minutos)
```

**2. Probar endpoint de tokens:**
```bash
# Con tu sesión activa:
GET https://web-production-10bfc.up.railway.app/api/push-tokens/list
```

**3. Compartir algo y ver logs:**
```bash
# Deberías ver en logs:
📅 Enviando notificación inmediata: actividad "..." compartida con X usuario(s)
📤 Enviando notificación a X dispositivo(s) con tokens válidos
✅ Notificaciones enviadas
```

## 📱 Deployment Mobile

### Compilar APK v1.7.0

El build debería estar en proceso. Si no:

```powershell
cd mobile
$env:EAS_NO_VCS='1'; eas build -p android --profile preview --non-interactive
```

**Tiempo:** 10-15 minutos

### Verificar Build

**Ver builds:**
```powershell
cd mobile
eas build:list --limit 1
```

**O visitar:**
```
https://expo.dev/accounts/[tu-cuenta]/projects/app-trabajo-terreno-mobile/builds
```

### Descargar e Instalar

**1. Descargar APK** desde el link que proporciona EAS

**2. En dispositivos:**
   - Desinstalar versión anterior
   - Instalar APK v1.7.0
   - Abrir app
   - Otorgar permisos

**3. Verificar token:**
Deberías ver en logs:
```
🔔 Registrando token de notificaciones push...
🎫 Token de push obtenido: ExponentPushToken[xxxxxx]
✅ Token registrado en el backend correctamente
```

## 🧪 Testing Completo

### Test 1: Notificación Inmediata (PRINCIPAL)

**Objetivo:** Verificar que las notificaciones llegan en < 5 segundos

**Pasos:**

**Dispositivo A (Oscar):**
1. Abrir app
2. Crear nueva actividad: "Test Push v1.7.0"
3. Compartirla con Pablo
4. Guardar

**Dispositivo B (Pablo):**
1. **CERRAR completamente la app** (deslizar desde recientes)
2. Mirar la pantalla del dispositivo
3. ⏱️ Contar segundos...

**Resultado esperado:**
- ✅ Notificación aparece en **5-10 segundos**
- ❌ Si tarda 2 minutos = problema, está usando cron

**Backend logs esperados:**
```
📅 Enviando notificación inmediata: actividad "Test Push v1.7.0" compartida con 1 usuario(s)
📤 Enviando notificación a 1 dispositivo(s) con tokens válidos
✅ Notificaciones enviadas. Resultados: { data: [...] }
```

### Test 2: Compartir en Actualización

**Objetivo:** Verificar que detecta shares agregados después

**Pasos:**

**Dispositivo A (Oscar):**
1. Crear actividad "Sin compartir"
2. NO compartir con nadie
3. Guardar
4. Editar la actividad
5. Agregar a Pablo en "Compartir con"
6. Guardar

**Dispositivo B (Pablo):**
1. App cerrada
2. ⏱️ Esperar 5-10 segundos
3. ✅ Notificación debe llegar

**Backend logs esperados:**
```
📅 Enviando notificación inmediata: actividad "Sin compartir" compartida con 1 nuevo(s) usuario(s)
```

### Test 3: Múltiples Usuarios

**Objetivo:** Verificar envío a múltiples destinatarios

**Pasos:**

**Dispositivo A (Oscar):**
1. Crear tarea "Reunión Equipo"
2. Compartir con: Pablo, [otro usuario], [otro usuario]
3. Guardar

**Dispositivos B, C, D:**
1. Apps cerradas
2. ✅ TODOS deben recibir notificación en 5-10 segundos

**Backend logs esperados:**
```
✅ Enviando notificación inmediata: tarea "Reunión Equipo" compartida con 3 usuario(s)
📤 Enviando notificación a 3 dispositivo(s) con tokens válidos
```

### Test 4: Token Registration al Login

**Objetivo:** Verificar registro automático

**Pasos:**
1. Cerrar sesión en la app
2. Iniciar sesión nuevamente
3. Ver logs

**Logs esperados:**
```
🔔 Registrando token de notificaciones push...
📱 Estado de permisos actual: granted
✅ Permisos de notificación otorgados
🎫 Token de push obtenido: ExponentPushToken[xxxxxx]
✅ Token registrado en el backend correctamente
```

### Test 5: Cron Respaldo

**Objetivo:** Verificar que el cron sigue funcionando

**Pasos:**
1. Esperar a que pasen 2 minutos desde el arranque del servidor
2. Ver logs del servidor

**Logs esperados cada 2 minutos:**
```
🔍 [14:30:00] Verificando actualizaciones...
✅ [14:30:02] Verificación completada
```

Si encuentra algo:
```
📅 [CRON] Actividad compartida detectada: "..." con X usuarios
```

## ❌ Troubleshooting

### Problema: Notificaciones tardan 2 minutos

**Causa:** El envío inmediato está fallando, usa cron como respaldo

**Solución:**
1. Revisar logs del backend para ver el error:
   ```
   Error enviando notificación: [detalles]
   ```
2. Verificar que el servidor tenga conexión a Expo Push API
3. Verificar que los tokens sean válidos (`ExponentPushToken`)

### Problema: "No hay tokens válidos de Expo Push"

**Causa:** Tokens son `local-device-...`

**Solución:**
1. Verificar que `google-services.json` esté en `mobile/`
2. Compilar APK v1.7.0 sin carpeta `android/`
3. Desinstalar app actual
4. Instalar APK nuevo
5. Verificar token nuevamente

### Problema: Token no se registra al login

**Causa:** Error en AuthContext

**Solución:**
1. Ver logs de la app móvil
2. Buscar errores en:
   ```
   Error registrando push token: [detalles]
   ```
3. Verificar permisos de notificación otorgados
4. Reiniciar app

### Problema: Backend no envía notificaciones

**Causa:** Monitor no está activo o hay error

**Solución:**
1. Verificar logs del servidor:
   ```
   ✅ Monitoreo de notificaciones activado (cada 2 minutos)
   ```
2. Si no aparece, reiniciar el servidor
3. Verificar que no haya errores en el arranque

## 📊 Métricas de Éxito

Después del deployment, deberías ver:

### Backend Logs (cada share):
```
📅 Enviando notificación inmediata: actividad "X" compartida con Y usuario(s)
📤 Enviando notificación a Y dispositivo(s) con tokens válidos
✅ Notificaciones enviadas. Resultados: {...}
```

### Mobile Logs (al abrir app):
```
🔔 Registrando token de notificaciones push...
🎫 Token de push obtenido: ExponentPushToken[...]
✅ Token registrado en el backend correctamente
```

### Latencia:
- ⚡ **< 5 segundos**: Excelente
- ⏱️ **5-15 segundos**: Bueno
- ⏳ **2 minutos**: Problema (usando cron)

### Tasa de Entrega:
- ✅ **> 95%**: Excelente
- ⚠️ **80-95%**: Revisar tokens
- ❌ **< 80%**: Problema serio

## 🎯 Checklist Final

### Backend:
- [ ] Código desplegado en Railway
- [ ] Servidor reiniciado
- [ ] Logs muestran: "Monitoreo de notificaciones activado"
- [ ] Endpoint `/api/push-tokens/list` funciona
- [ ] Test de compartir muestra logs de envío inmediato

### Mobile:
- [ ] APK v1.7.0 (versionCode 26) compilado
- [ ] APK descargado
- [ ] Instalado en todos los dispositivos
- [ ] Token registrado correctamente
- [ ] Token es `ExponentPushToken[...]` (no local)

### Testing:
- [ ] Test 1: Notificación inmediata (< 5 seg) ✅
- [ ] Test 2: Compartir en actualización ✅
- [ ] Test 3: Múltiples usuarios ✅
- [ ] Test 4: Token registration al login ✅
- [ ] Test 5: Cron respaldo funciona ✅

### Configuración:
- [ ] Optimización de batería desactivada
- [ ] Permisos de notificación otorgados
- [ ] Firebase configurado (`google-services.json`)
- [ ] Backend conectado a Expo Push API

## 📝 Rollback Plan

Si algo sale mal:

### Backend:
1. **Railway**: Ir a "Deployments" → Seleccionar deployment anterior → "Redeploy"
2. Esperar 2-3 minutos
3. Verificar que funcione

### Mobile:
1. **Reinstalar versión anterior** (v1.6.1)
2. El backend v1.7.0 es compatible con clientes v1.6.1
3. Funcionalidad básica garantizada

## 🎉 Resultado Esperado

Una vez completado el deployment:

✅ **Notificaciones push funcionan COMPLETAMENTE**
✅ **Latencia < 5 segundos** (vs 2 minutos antes)
✅ **100% de cobertura** (crear + actualizar)
✅ **Funciona con app cerrada**
✅ **Token registration robusto**
✅ **Respaldo automático con cron**

---

**Versión:** 1.7.0
**Fecha:** 2025-10-08
**Tiempo estimado deployment:** 20-30 minutos
**Prioridad:** Alta
**Breaking changes:** Ninguno (compatible con versiones anteriores)
