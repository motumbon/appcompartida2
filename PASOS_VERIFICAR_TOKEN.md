# 🔍 Cómo Verificar Si Firebase Está Funcionando

## Opción 1: Verificar desde la App Móvil (MÁS FÁCIL)

### Paso 1: Abrir la App
1. Abre **App Trabajo en Terreno** en tu tablet
2. **Cierra la app completamente** (desliza desde recientes)
3. **Vuelve a abrir la app**

### Paso 2: Ver en Pantalla
Cuando la app se abre, en los primeros segundos debería aparecer en los logs internos:

**Token Válido (Firebase OK):**
```
🎫 Token de push obtenido: ExponentPushToken[xxxxxxxxxxxxxx]
✅ Token registrado en el backend correctamente
```

**Token Local (Firebase NO funciona):**
```
⚠️ No se pudo obtener token de Expo (requiere Firebase)
📲 Usando sistema de notificaciones locales con polling
🔑 Token local generado: local-device-xxxxx
```

### Interpretación:

✅ **Si ves "ExponentPushToken"**:
- Firebase está funcionando
- Las notificaciones deberían llegar con app cerrada
- El problema es optimización de batería

❌ **Si ves "local-device-"**:
- Firebase NO está funcionando
- Necesitas reinstalar el APK v1.6.0

---

## Opción 2: Verificar con adb (Si tienes cable USB)

### Requisitos:
- Cable USB
- Tablet conectada a la PC
- Depuración USB activada en la tablet

### Pasos:

1. **Conecta la tablet con USB**

2. **Abre PowerShell y ejecuta:**
```powershell
adb logcat -c  # Limpiar logs
```

3. **Abre la app en la tablet**

4. **Ver los logs:**
```powershell
adb logcat | Select-String "Token"
```

5. **Busca líneas como:**
```
Token de push obtenido: ExponentPushToken[...]  ← VÁLIDO ✅
Token local generado: local-device-...          ← INVÁLIDO ❌
```

---

## Opción 3: Prueba Práctica Directa

### Paso 1: Configurar Dispositivos

**Dispositivo A** (por ejemplo, el de Oscar):
- Debe tener la app instalada
- Debe estar logueado

**Dispositivo B** (tu tablet):
- Debe tener la app instalada (v1.6.0)
- Debe estar logueado
- **CERRAR completamente la app**

### Paso 2: Compartir Algo

**Desde Dispositivo A:**
1. Crear una actividad nueva
2. Compartirla contigo (Pablo)

### Paso 3: Esperar y Verificar

**En tu Dispositivo B:**
1. NO abrir la app
2. Esperar 2-3 minutos
3. Ver si aparece notificación en la bandeja del sistema

**Resultado:**
- ✅ **SI aparece**: Firebase está funcionando
- ❌ **NO aparece**: Firebase NO está funcionando o hay problema de permisos

---

## Opción 4: Verificar Configuración de Batería

Independiente del token, verifica esto:

### Paso 1: Desactivar Optimización de Batería

1. **Configuración** → **Batería**
2. **Optimización de batería** o **Battery optimization**
3. Cambiar filtro a **"Todas las apps"**
4. Buscar **"App Trabajo en Terreno"**
5. Seleccionar **"No optimizar"** o **"Don't optimize"**

### Paso 2: Verificar Permisos

1. **Configuración** → **Apps**
2. **App Trabajo en Terreno**
3. **Notificaciones**
4. Verificar que TODO esté activado:
   - ✅ Mostrar notificaciones
   - ✅ Sonido
   - ✅ Vibración
   - ✅ Mostrar en pantalla bloqueada

### Paso 3: Modo No Molestar

1. Verifica que **NO** esté activo el modo "No Molestar"
2. O que la app esté en las excepciones

---

## 🎯 Resumen Rápido

### ¿Qué necesito saber?

**1. ¿Tu token es válido?**
   - Abre la app
   - Si aparece "ExponentPushToken" → ✅ SÍ
   - Si aparece "local-device-" → ❌ NO

**2. ¿Optimización de batería desactivada?**
   - Configuración → Batería → App Trabajo → No optimizar
   
**3. ¿Permisos de notificación activos?**
   - Configuración → Apps → App Trabajo → Notificaciones → Todo ON

---

## 🛠️ Solución Según Resultado

### Si Token es "local-device-" (Firebase NO funciona):

1. **Desinstalar app completamente:**
   - Configuración → Apps → App Trabajo en Terreno → Desinstalar
   
2. **Verificar que google-services.json existe:**
   ```powershell
   dir "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile\google-services.json"
   ```
   
3. **Si NO existe, descárgalo de Firebase Console:**
   - https://console.firebase.google.com/
   - Selecciona proyecto "App Trabajo en Terreno"
   - Configuración del proyecto → Tus apps
   - Descarga google-services.json
   
4. **Compilar APK nuevo:**
   ```powershell
   cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
   $env:EAS_NO_VCS='1'; eas build -p android --profile preview
   ```
   
5. **Instalar APK nuevo**

6. **Verificar token de nuevo**

### Si Token es "ExponentPushToken" (Firebase SÍ funciona):

El problema es configuración del dispositivo:

1. **Desactivar optimización de batería** (ver arriba)
2. **Activar todos los permisos de notificación** (ver arriba)
3. **Desactivar "No Molestar"**
4. **Reiniciar el dispositivo**
5. **Probar de nuevo**

---

## 📱 Comando Rápido de Prueba

Si tienes adb, ejecuta esto para ver el token:

```powershell
# Limpiar y capturar logs
adb logcat -c
Start-Sleep -Seconds 2

# Abre la app en la tablet

Start-Sleep -Seconds 5

# Ver token
adb logcat -d | Select-String "Token"
```

Busca líneas con:
- ✅ "ExponentPushToken" = Firebase OK
- ❌ "local-device-" = Firebase NO OK

---

## ✅ Checklist Final

Marca lo que ya verificaste:

- [ ] App instalada versión 1.6.0
- [ ] google-services.json existe en mobile/
- [ ] Token es "ExponentPushToken[...]" (no "local-device-")
- [ ] Permisos de notificación otorgados
- [ ] Optimización de batería desactivada
- [ ] Modo "No Molestar" desactivado
- [ ] Probado compartir algo y esperar 2-3 minutos
- [ ] Notificación aparece con app cerrada

Si TODOS están marcados y aún no funciona:
- Problema puede ser del servidor (monitor no activo)
- Problema de red (firewall bloqueando)
- Problema de FCM (Firebase no configurado bien)

---

## 🆘 Ayuda Adicional

Si después de verificar todo sigue sin funcionar, necesito saber:

1. ¿Qué tipo de token tienes? (ExponentPushToken o local-device)
2. ¿Optimización de batería está desactivada?
3. ¿La notificación de prueba manual funciona? (botón en la app)
4. ¿Qué versión de APK tienes instalada? (debe ser 1.6.0)
5. ¿google-services.json existe en la carpeta mobile/?

Con esa información puedo darte la solución exacta. 🚀
