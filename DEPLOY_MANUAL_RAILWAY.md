# 🚀 Deploy Manual en Railway - Guía Paso a Paso

## 📦 Archivos Modificados para Subir

### Backend (7 archivos):

1. ✅ **server/index.js** - Timeouts aumentados + event-driven notifications
2. ✅ **server/routes/activities.js** - Push notifications inmediatas
3. ✅ **server/routes/tasks.js** - Push notifications inmediatas
4. ✅ **server/routes/notes.js** - Push notifications inmediatas
5. ✅ **server/routes/contracts.js** - Timeouts y logging mejorado
6. ✅ **server/services/notificationMonitor.js** - Monitor mejorado
7. ✅ **server/routes/pushTokens.js** - Endpoint de debug

## 🔧 Opción 1: Deploy Usando Railway Dashboard (MÁS FÁCIL)

### Paso 1: Acceder a Railway

1. Ve a: **https://railway.app**
2. **Login** con tu cuenta
3. Selecciona tu proyecto: **"web-production-10bfc"** (o el nombre de tu proyecto)

### Paso 2: Conectar Repositorio (Si no está conectado)

**Si tu proyecto NO está conectado a GitHub:**

1. En Railway Dashboard → **Settings**
2. Buscar **"Source"** o **"Deploy"**
3. Si dice **"No repository connected"**:
   - Necesitas subir los archivos manualmente
   - O conectar a GitHub (requiere crear repo primero)

**Para conectar a GitHub:**
```bash
# Necesitas Git instalado
# O crear repo manualmente en GitHub y subir archivos
```

### Paso 3: Trigger Manual Deploy

**Si el proyecto está conectado a un repo:**

1. En Railway Dashboard → **Deployments**
2. Click en **"Deploy"** o **"Redeploy"**
3. Railway detectará los cambios automáticamente
4. Esperar 2-3 minutos

**Si NO está conectado:**
- Sigue al **Paso 4** (Deploy Manual con CLI)

### Paso 4: Verificar Deploy

1. En Railway → **Logs**
2. Buscar líneas:
   ```
   ✅ MongoDB conectado exitosamente
   🔔 Monitoreo de notificaciones activado (cada 2 minutos)
   ⏱️ Timeouts configurados: request=300s, keepAlive=65s
   ```

3. Si aparecen → ✅ **Deploy exitoso**

## 🔧 Opción 2: Instalar Git y Hacer Deploy (RECOMENDADO A LARGO PLAZO)

### Paso 1: Instalar Git

**Descarga e instala:**
1. Ve a: **https://git-scm.com/download/win**
2. Descarga **"64-bit Git for Windows Setup"**
3. Ejecuta el instalador
4. Acepta todas las opciones por defecto
5. Click **"Install"**

### Paso 2: Configurar Git (Primera vez)

Abre PowerShell y ejecuta:

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Paso 3: Inicializar Repositorio

```powershell
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0"

# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Crear primer commit
git commit -m "feat: event-driven push notifications + fix upload contratos"
```

### Paso 4: Conectar a Railway

**En Railway Dashboard:**
1. **Settings** → **Source**
2. **"Connect Repository"**
3. Autorizar GitHub
4. Crear nuevo repositorio o seleccionar existente

**O crear repo en GitHub primero:**
1. Ve a: **https://github.com/new**
2. Nombre: `app-trabajo-terreno`
3. Click **"Create repository"**
4. Copia los comandos que aparecen

**En tu PowerShell:**
```powershell
git remote add origin https://github.com/TU-USUARIO/app-trabajo-terreno.git
git branch -M main
git push -u origin main
```

### Paso 5: Deploy Automático

Desde ahora, cada vez que quieras hacer deploy:

```powershell
git add .
git commit -m "descripcion de cambios"
git push
```

Railway detectará el push y desplegará automáticamente.

## 🔧 Opción 3: Deploy Manual Archivo por Archivo (SI NO PUEDES USAR GIT)

### Paso 1: Preparar Archivos

En tu carpeta del proyecto, identifica los archivos modificados:

**Backend:**
```
server/
  ├── index.js (modificado)
  ├── routes/
  │   ├── activities.js (modificado)
  │   ├── tasks.js (modificado)
  │   ├── notes.js (modificado)
  │   ├── contracts.js (modificado)
  │   └── pushTokens.js (modificado)
  └── services/
      └── notificationMonitor.js (modificado)
```

### Paso 2: Usar Railway CLI (Alternativa)

**Instalar Railway CLI:**

```powershell
# Usando npm (si tienes Node.js instalado)
npm install -g @railway/cli

# O usando PowerShell
iwr https://railway.app/install.ps1 | iex
```

**Autenticar:**
```powershell
railway login
```

**Link al proyecto:**
```powershell
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0"
railway link
```

**Deploy:**
```powershell
railway up
```

### Paso 3: Verificar

```powershell
railway logs
```

## 📋 Checklist de Verificación

### Antes del Deploy:
- [ ] Backup de archivos originales (por si acaso)
- [ ] Archivos modificados identificados
- [ ] Railway Dashboard accesible

### Durante el Deploy:
- [ ] Logs muestran "Building..."
- [ ] No hay errores de sintaxis
- [ ] Build completa exitosamente

### Después del Deploy:
- [ ] Servidor reiniciado
- [ ] Logs muestran "MongoDB conectado"
- [ ] Logs muestran "Timeouts configurados"
- [ ] Logs muestran "Monitoreo activado"
- [ ] API responde: GET https://web-production-10bfc.up.railway.app/api/health

## 🧪 Testing Post-Deploy

### Test 1: Verificar que el servidor arrancó

```powershell
# En PowerShell
Invoke-RestMethod -Uri "https://web-production-10bfc.up.railway.app/api/health"
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### Test 2: Probar upload de contratos

1. Abrir versión web: https://web-production-10bfc.up.railway.app
2. Login
3. Ir a **Contratos**
4. Subir archivo Excel
5. ✅ Debería completarse sin `ERR_CONNECTION_RESET`

### Test 3: Probar notificaciones push

1. Desde un dispositivo, compartir una actividad
2. En otro dispositivo (app cerrada)
3. ⏱️ Notificación debe llegar en < 10 segundos
4. Ver logs de Railway para confirmar:
   ```
   📅 Enviando notificación inmediata: actividad "..." compartida con X usuario(s)
   ```

## ❌ Troubleshooting

### Error: "No repository connected"

**Causa:** Railway no está conectado a ningún repo

**Solución:**
1. Instalar Git (Opción 2)
2. O usar Railway CLI (Opción 3)
3. O subir archivos manualmente en Railway Dashboard

### Error: "Build failed"

**Causa:** Error de sintaxis en algún archivo

**Solución:**
1. Ver logs en Railway
2. Identificar archivo con error
3. Revisar sintaxis
4. Volver a hacer deploy

### Error: "Deployment timeout"

**Causa:** Railway tardó mucho en hacer deploy

**Solución:**
1. Intentar de nuevo
2. Verificar conexión a internet
3. Verificar estado de Railway: https://railway.app/status

## 🎯 Recomendación Final

**Para ahora (deploy inmediato):**
- Usa **Opción 1** (Railway Dashboard) si tu proyecto está conectado a un repo
- O instala **Railway CLI** (Opción 3) para hacer `railway up`

**Para el futuro (mejor workflow):**
- Instala **Git** (Opción 2)
- Conecta a GitHub
- Usa `git push` para deploys automáticos

---

## 📞 Siguiente Paso

**¿Qué opción prefieres?**

1. **Manual en Railway Dashboard** - Te guío paso a paso
2. **Instalar Git ahora** - Te ayudo con la instalación
3. **Instalar Railway CLI** - Más rápido, sin Git

Dime cuál eliges y continúo con las instrucciones específicas. 🚀
