# Diagnóstico de Notificaciones - App Trabajo en Terreno

## ✅ Cambios Implementados (Versión 1.4.9)

### 1. Configuración en `app.json`
- ✅ Agregado plugin `expo-notifications` con configuración completa
- ✅ Agregado `adaptiveIcon` para Android
- ✅ Configuración de notificaciones con icono y color
- ✅ Versión actualizada a 1.4.9 (versionCode 20)

### 2. Servicio de Notificaciones Mejorado
- ✅ Dos canales de notificación: "default" y "high_priority"
- ✅ Mejor logging para diagnóstico
- ✅ Alertas visuales si los permisos no están otorgados
- ✅ Configuración MAX importance para Android
- ✅ Vibración y sonido habilitados
- ✅ Visibilidad en lockscreen configurada

### 3. Botón de Prueba
- ✅ Agregado botón de prueba en HomeScreen (ícono de campana verde)
- ✅ Método `sendTestNotification()` para verificar funcionamiento

## 🔍 Cómo Diagnosticar Problemas

### Paso 1: Verificar Permisos
1. Abre la app
2. Ve a **Configuración del dispositivo > Apps > App Trabajo en Terreno > Notificaciones**
3. Verifica que las notificaciones estén **ACTIVADAS**
4. Verifica que todos los canales estén activados

### Paso 2: Probar Notificaciones
1. En la pantalla de inicio, toca el **ícono de campana verde** (al lado del botón de logout)
2. Deberías ver:
   - Un alert diciendo "Prueba enviada"
   - Una notificación aparecer inmediatamente
3. Si no aparece, revisa los logs en la consola

### Paso 3: Revisar Logs
Conecta el dispositivo y ejecuta:
```bash
adb logcat | grep -E "(Notification|🔔|📤|✅|❌)"
```

Busca estos mensajes:
- `🔔 Creando canal de notificaciones para Android...`
- `✅ Canales de notificaciones creados correctamente`
- `📱 Estado de permisos actual: granted`
- `📤 Enviando notificación: ...`
- `✅ Notificación enviada con ID: ...`

### Paso 4: Verificar Configuración del Dispositivo
1. **No Molestar**: Verifica que el modo "No Molestar" esté desactivado
2. **Ahorro de energía**: Desactiva optimización de batería para la app
3. **Permisos de notificación**: Deben estar otorgados

## 🐛 Problemas Comunes

### No aparecen notificaciones cuando la app está cerrada
**Solución**: Las notificaciones actuales son locales, solo funcionan cuando la app está ejecutándose en segundo plano. Para notificaciones verdaderas push, se necesita:
- Configurar Firebase Cloud Messaging (FCM)
- Implementar backend para enviar push notifications
- Obtener token de dispositivo y enviarlo al servidor

### No aparecen notificaciones cuando la app está abierta
**Causa**: El handler está configurado correctamente para mostrarlas
**Solución**: 
1. Usar el botón de prueba
2. Revisar permisos
3. Verificar logs para errores

### Error: "Channel not found"
**Solución**: Los canales se crean al iniciar la app. Reinstala la app completamente.

### Las notificaciones no hacen sonido
**Solución**:
1. Verifica que el volumen del dispositivo esté alto
2. En configuración de la app, verifica que el sonido esté activado
3. Verifica que el canal "Notificaciones Generales" tenga sonido activado

## 📱 Comandos Útiles

### Ver todas las notificaciones del sistema
```bash
adb shell dumpsys notification
```

### Limpiar todas las notificaciones
```bash
adb shell pm clear com.apptrabajoenterreno.mobile
```

### Ver logs en tiempo real
```bash
adb logcat *:E
```

## 🔧 Próximos Pasos (Mejoras Futuras)

Para implementar verdaderas push notifications:

1. **Configurar Firebase**
   - Crear proyecto en Firebase Console
   - Descargar `google-services.json`
   - Configurar en la app

2. **Backend**
   - Instalar `expo-server-sdk`
   - Guardar tokens de dispositivos
   - Endpoint para enviar notificaciones

3. **Frontend**
   - Obtener token de Expo Push Notifications
   - Enviar token al backend al registrarse
   - Configurar handlers para diferentes tipos de notificaciones

## 📞 Soporte

Si las notificaciones siguen sin funcionar después de seguir estos pasos:
1. Revisa los logs completos
2. Verifica que la versión instalada sea 1.4.9 o superior
3. Prueba en un dispositivo diferente
4. Reinstala la app completamente
