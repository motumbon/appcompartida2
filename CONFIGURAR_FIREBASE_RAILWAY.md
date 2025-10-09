# 🔑 Configurar Firebase Service Account en Railway

## ⚠️ CRÍTICO: Este paso es OBLIGATORIO

Sin esto, el backend NO podrá enviar notificaciones push.

---

## Paso 1: Obtener el Contenido del Service Account JSON

El archivo está en:
```
C:\Users\pablo\Downloads\app-trabajo-en-terreno-firebase-adminsdk-fbsvc-ae8baf4c1c.json
```

**Abre el archivo** con Notepad y copia TODO el contenido (debe empezar con `{` y terminar con `}`).

---

## Paso 2: Ir a Railway Dashboard

1. Ve a: https://railway.app/
2. Login
3. Selecciona proyecto: **modest-wonder**
4. Click en el servicio: **web** (backend)

---

## Paso 3: Agregar Variable de Entorno

1. Click en la pestaña **"Variables"**
2. Click en **"+ New Variable"**
3. **Name:** `FIREBASE_SERVICE_ACCOUNT_JSON`
4. **Value:** Pega TODO el contenido del archivo JSON
   ```json
   {
     "type": "service_account",
     "project_id": "app-trabajo-en-terreno",
     "private_key_id": "...",
     ...
   }
   ```
5. Click **"Add"**

---

## Paso 4: Redesploy

Después de agregar la variable:

1. Railway hará **redeploy automático**
2. Espera 2-3 minutos
3. Ver logs para verificar

---

## Paso 5: Verificar en Logs

Ve a la pestaña **"Deployments"** → Click en el deployment activo → **"View Logs"**

**Buscar esta línea:**
```
✅ Firebase Admin SDK inicializado correctamente
```

**Si ves:**
```
⚠️ Firebase Admin SDK no disponible, usando solo Expo SDK
```
→ La variable de entorno NO se configuró correctamente.

---

## Paso 6: Probar Notificaciones

Después de ver "Firebase Admin SDK inicializado correctamente":

1. **Dispositivo A:** Compartir actividad
2. **Ver logs del backend:**
   ```
   📅 Enviando notificación inmediata...
   📤 Enviando notificación a 1 dispositivo(s)...
   📦 Enviando 1 mensajes via Firebase Admin SDK
   ✅ Mensaje enviado: projects/app-trabajo-en-terreno/messages/...
   ✅ Notificaciones enviadas exitosamente: 1/1
   ```

3. **Dispositivo B:** Debe recibir notificación push

---

## ❌ Troubleshooting

### Error: "Firebase Admin SDK no disponible"

**Causa:** Variable de entorno no configurada

**Solución:**
1. Verifica que la variable se llame EXACTAMENTE: `FIREBASE_SERVICE_ACCOUNT_JSON`
2. Verifica que el JSON sea válido (sin caracteres extra)
3. Redeploy manualmente si es necesario

### Error: "Invalid service account"

**Causa:** JSON corrupto o incompleto

**Solución:**
1. Abre el archivo original nuevamente
2. Copia TODO el contenido (desde `{` hasta `}`)
3. Pega en la variable
4. Guarda y redeploy

---

## 🎯 Checklist

- [ ] Archivo JSON copiado completo
- [ ] Variable `FIREBASE_SERVICE_ACCOUNT_JSON` creada en Railway
- [ ] Redeploy completado
- [ ] Logs muestran "Firebase Admin SDK inicializado correctamente"
- [ ] Test de notificación exitoso

---

**Una vez completado esto, las notificaciones push funcionarán correctamente.** 🎉
