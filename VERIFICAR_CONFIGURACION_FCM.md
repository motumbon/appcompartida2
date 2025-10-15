# 🔍 Verificar Configuración de FCM V1 para Push Notifications

## Opción 1: Desde Expo Dashboard (Más Fácil)

1. **Ve a:** https://expo.dev/

2. **Login** con tu cuenta

3. **Busca tu proyecto:** "app-trabajo-terreno-mobile"

4. **Click en:** "Credentials" en el menú lateral

5. **Selecciona:** "Android"

6. **Busca la sección:** "Push Notifications (FCM V1)"

7. **Verifica que diga:**
   ```
   Google Service Account Key
   ✓ Configured
   Client Email: firebase-adminsdk-fbsvc@app-trabajo-en-terreno.iam.gserviceaccount.com
   ```

**Si dice "None" o "Not configured":**
- ❌ La configuración NO se guardó
- Necesitas repetir el proceso con `eas credentials`

**Si dice "Configured":**
- ✅ La configuración SÍ se guardó
- Espera 5-10 minutos para que propague
- Reinstala la app y prueba

---

## Opción 2: Desde Terminal (Comando Interactivo)

```powershell
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
eas credentials
```

**Selecciona:**
- Android
- production

**Busca en la pantalla:**
```
Push Notifications (FCM V1): Google Service Account Key For FCM V1
  Client Email: firebase-adminsdk-fbsvc@...
  Project Id: app-trabajo-en-terreno
  Updated: X minutes ago
```

**Si ves esto:**
- ✅ Configurado correctamente
- Presiona Ctrl+C para salir

**Si dice "None assigned yet":**
- ❌ NO está configurado
- Repite el proceso

---

## 🎯 Después de Verificar

### Si ESTÁ Configurado (✅):

1. **Espera 5-10 minutos** (propagación en servidores Expo)

2. **En TODOS los dispositivos:**
   - Desinstalar app
   - Reinstalar: https://expo.dev/artifacts/eas/p6zXjhHQnUzPY2XbBj7cF5.apk
   - Login

3. **Probar:**
   - Dispositivo B: Cerrar app
   - Dispositivo A: Compartir actividad
   - Ver logs del backend

**Logs esperados después de 10 min + reinstalar:**
```
✅ Notificaciones enviadas exitosamente: 1/1
```

### Si NO Está Configurado (❌):

Repite el proceso:

```powershell
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
eas credentials
```

- Android → production
- "Manage your Google Service Account Key for Push Notifications (FCM V1)"
- "Set up a Google Service Account Key for Push Notifications (FCM V1)"
- Selecciona el Service Account existente
- Confirma

---

## 📱 Link Directo al Dashboard

**Ve aquí para verificar visualmente:**

https://expo.dev/accounts/[TU_USERNAME]/projects/app-trabajo-terreno-mobile/credentials

**Reemplaza `[TU_USERNAME]` con tu nombre de usuario de Expo.**

---

**Primero verifica en el Dashboard de Expo, es más visual y claro.** 🌐
