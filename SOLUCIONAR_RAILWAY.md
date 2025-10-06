# 🔧 Solucionar Problema de Conexión con Railway

## ❌ Problema Actual

La app móvil muestra **"Sin conexión al servidor"** porque Railway no está respondiendo.

---

## 🔍 Paso 1: Verificar Estado de Railway

### Opción A: Ejecutar Script de Verificación

Doble click en: `check-railway.bat`

Este script verificará si Railway está funcionando.

### Opción B: Verificar Manualmente en el Navegador

Abre estas URLs en tu navegador:

1. **URL principal:** https://web-production-10bfc.up.railway.app
2. **Health check:** https://web-production-10bfc.up.railway.app/api/health
3. **Auth endpoint:** https://web-production-10bfc.up.railway.app/api/auth

**¿Qué deberías ver?**
- Si ves JSON o la página web → ✅ Railway funciona
- Si ves "Not Found" o "Application Error" → ❌ Railway tiene problemas

---

## 🛠️ Paso 2: Soluciones según el Problema

### ❌ Si Railway muestra "Application Error" o "Not Found":

#### **Solución A: Verificar Logs en Railway**

1. Ve a: https://railway.app/
2. Login con GitHub
3. Abre tu proyecto
4. Click en "Deployments"
5. Click en el último deployment
6. Revisa los **Logs** para ver errores

**Errores comunes:**
- `Cannot find module` → Faltan dependencias
- `MongoError` → Problema con MongoDB
- `Port already in use` → Problema de puerto

#### **Solución B: Redeployar Manualmente**

En Railway:
1. Settings → Deploy
2. Click "Redeploy"
3. Espera 3-5 minutos
4. Verifica la URL nuevamente

#### **Solución C: Verificar Variables de Entorno**

En Railway → Settings → Variables, verifica que existan:

```
PORT=5000
MONGODB_URI=mongodb+srv://admin:Valita502.@motumbon.umtrefn.mongodb.net/app-trabajo-terreno?retryWrites=true&w=majority&appName=motumbon
JWT_SECRET=97969369761b47e1ec96541ae745e9477173f6cc85b90f3e82961b8
NODE_ENV=production
```

Si falta alguna, agrégala y redeployea.

---

### ✅ Si Railway funciona pero la app móvil no conecta:

#### **Problema: URL Incorrecta en el APK**

La URL hardcoded podría ser incorrecta. Vamos a crear una versión con la URL correcta.

1. Abre Railway y copia la URL exacta de tu deployment
2. Edita `mobile/src/config/api.js` línea 6
3. Cambia la URL por la correcta
4. Regenera el APK

---

## 🚀 Paso 3: Solución Alternativa - Correr Backend Localmente

Si Railway sigue sin funcionar, puedes correr el backend en tu PC y probar la app móvil:

### **1. Iniciar Backend Local:**

```bash
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0"
npm start
```

El servidor correrá en: `http://localhost:5000`

### **2. Obtener tu IP Local:**

```bash
ipconfig
```

Busca "IPv4 Address" (ej: `192.168.1.100`)

### **3. Actualizar URL en la App Móvil:**

Edita `mobile/src/config/api.js`:

```javascript
const BASE_API_URL = 'http://TU_IP_LOCAL:5000';  // ej: http://192.168.1.100:5000
```

### **4. Regenerar APK:**

```bash
cd mobile
set EAS_NO_VCS=1 && eas build -p android --profile preview
```

**NOTA:** Tu teléfono debe estar en la **misma red WiFi** que tu PC.

---

## 🔄 Paso 4: Verificar MongoDB Atlas

El problema también podría ser MongoDB:

1. Ve a: https://cloud.mongodb.com/
2. Login
3. Network Access → IP Access List
4. **Verifica que esté:** `0.0.0.0/0` (Permitir desde cualquier lugar)
5. Si no está, agrégalo:
   - Click "Add IP Address"
   - "Allow Access from Anywhere"
   - Confirm

---

## 📋 Checklist de Diagnóstico

Marca cada paso que hayas verificado:

### Railway:
- [ ] Railway está accesible en el navegador
- [ ] Los logs no muestran errores
- [ ] Variables de entorno están configuradas
- [ ] Último deployment fue exitoso
- [ ] URL de Railway es correcta

### MongoDB:
- [ ] MongoDB Atlas permite conexiones (0.0.0.0/0)
- [ ] Connection string es correcto
- [ ] Base de datos existe

### App Móvil:
- [ ] URL en `api.js` es correcta
- [ ] Teléfono tiene internet
- [ ] APK es la última versión
- [ ] No hay firewall bloqueando

---

## 🆘 Si Nada Funciona

### **Última Opción: Nuevo Deploy en Railway**

1. **Eliminar proyecto actual en Railway**
2. **Crear nuevo proyecto:**
   - New Project → Deploy from GitHub
   - Seleccionar repo `motumbon/appcompartida2`
3. **Agregar variables de entorno** (ver arriba)
4. **Esperar deployment** (5-10 minutos)
5. **Copiar nueva URL**
6. **Actualizar app móvil** con nueva URL
7. **Regenerar APK**

---

## 📞 Información de Contacto

**URL actual de Railway:** https://web-production-10bfc.up.railway.app

**GitHub Repo:** https://github.com/motumbon/appcompartida2

**MongoDB:** mongodb+srv://admin:Valita502.@motumbon.umtrefn.mongodb.net/

---

## 🎯 Próximos Pasos

1. **Ejecuta** `check-railway.bat` para diagnosticar
2. **Sigue** las soluciones según el resultado
3. **Regenera** el APK con la URL correcta
4. **Prueba** la app móvil nuevamente

Si Railway no funciona después de todo esto, usa la **Solución Alternativa** (backend local) para probar la app mientras investigas Railway.
