# 🚀 Deploy Manual - Railway Dashboard

Ya que el link de Railway CLI requiere interacción, aquí están las instrucciones para hacer el deploy manualmente usando el Dashboard de Railway.

## ✅ Método Más Rápido: Trigger Redeploy

### Opción 1: Si tu proyecto está conectado a GitHub/GitLab

1. **Ve a Railway Dashboard:** https://railway.app
2. **Selecciona proyecto:** "modest-wonder"
3. **Click en "Deployments"**
4. **Click en "Deploy" → "Redeploy"**
5. Railway tomará el código del repositorio conectado
6. ✅ Esperar 2-3 minutos

**IMPORTANTE:** Esto solo funciona si tus cambios ya están en GitHub/GitLab.

---

## 🔧 Método Alternativo: Instalar Git y Subir Cambios

Como Railway necesita que el código esté en un repositorio, la solución más práctica es:

### Paso 1: Instalar Git (10 minutos)

1. **Descarga Git:**
   - Ve a: https://git-scm.com/download/win
   - Descarga "64-bit Git for Windows Setup"
   - Ejecuta el instalador
   - Acepta todas las opciones por defecto
   - Click "Install"

2. **Reinicia PowerShell** (cierra y abre de nuevo)

3. **Configura Git:**
   ```powershell
   git config --global user.name "Pablo Yevenes"
   git config --global user.email "pabloyevenes.qf@gmail.com"
   ```

### Paso 2: Inicializar Repositorio

```powershell
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0"

# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Crear commit
git commit -m "feat: push notifications event-driven + fix upload contratos"
```

### Paso 3: Conectar a Railway

**Opción A: Crear repositorio en GitHub primero**

1. Ve a: https://github.com/new
2. Nombre: `app-trabajo-terreno`
3. Privado o Público (tu elección)
4. NO agregues README, .gitignore, ni licencia
5. Click "Create repository"

6. Copia y ejecuta los comandos que aparecen:
   ```powershell
   git remote add origin https://github.com/TU-USUARIO/app-trabajo-terreno.git
   git branch -M main
   git push -u origin main
   ```

7. En Railway Dashboard:
   - Settings → Source
   - Connect Repository
   - Selecciona tu nuevo repositorio
   - Railway hará deploy automáticamente

**Opción B: Conectar directamente desde Railway**

1. Railway Dashboard → "modest-wonder"
2. Settings → Source
3. "Connect Repository"
4. Crear nuevo repositorio en GitHub (Railway te guiará)
5. Railway hará deploy automáticamente

---

## 🎯 Método Actual: Deploy con Railway CLI (Sin Git)

Ya tienes Railway CLI instalado. El problema es que necesitas vincular manualmente el proyecto.

### Intenta esto:

```powershell
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0"

# Link al proyecto (modo interactivo)
railway link

# Cuando pregunte, selecciona:
# - Project: modest-wonder
# - Service: (el servicio del backend, probablemente "web" o "server")

# Una vez vinculado:
railway up
```

**Problema:** El `railway link` es interactivo y puede ser complicado desde aquí.

---

## ⚡ Solución INMEDIATA (Sin Git, Sin CLI)

Si necesitas hacer deploy YA MISMO sin instalar nada:

### Opción: Redeploy desde Railway Dashboard

1. **Ve a:** https://railway.app
2. **Login**
3. **Selecciona:** "modest-wonder"
4. **Click:** "Deployments" (en el menú lateral)
5. **Click:** Botón "Deploy" o "Redeploy"

**PERO:** Esto solo funciona si tu código ya está en un repositorio conectado.

### Si NO está conectado a repo:

1. Railway Dashboard → "modest-wonder"
2. Settings → "Source"
3. Si dice "No repository connected":
   - Necesitas conectar un repo primero
   - **Solución:** Instalar Git (Método Alternativo arriba)

---

## 📊 Resumen de Opciones

| Opción | Tiempo | Requiere | Dificultad | Recomendado |
|--------|--------|----------|------------|-------------|
| **Redeploy Dashboard** | 2 min | Repo conectado | Fácil | ✅ Si ya tienes repo |
| **Instalar Git + GitHub** | 15 min | Git, GitHub | Media | ✅✅ **MEJOR A LARGO PLAZO** |
| **Railway CLI** | 5 min | Railway CLI | Media | ⚠️ Requiere link manual |

---

## 🎯 MI RECOMENDACIÓN

**Instala Git (15 minutos una sola vez)**

¿Por qué?
- Deploy futuro será 1 comando: `git push`
- Historial de cambios
- Rollback fácil si algo falla
- Trabajo en equipo
- Estándar de la industria

**Paso a paso:**

1. **Descarga Git:** https://git-scm.com/download/win
2. **Instala** (acepta todo por defecto)
3. **Reinicia PowerShell**
4. **Ejecuta:**
   ```powershell
   cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0"
   git init
   git add .
   git commit -m "inicial"
   ```
5. **Conecta a Railway** desde Dashboard → Settings → Source
6. **Push:**
   ```powershell
   git push
   ```

---

## 🆘 Si Necesitas Deploy URGENTE

**Mientras instalas Git, puedes:**

1. Railway Dashboard → modest-wonder
2. Click "Redeploy" (si está disponible)
3. O esperar a conectar GitHub (15 min)

**Los cambios que hice:**
- ✅ `server/index.js` - Timeouts aumentados
- ✅ `server/routes/contracts.js` - Fix upload
- ✅ `server/routes/activities.js` - Push inmediatas
- ✅ `server/routes/tasks.js` - Push inmediatas
- ✅ `server/routes/notes.js` - Push inmediatas
- ✅ `server/services/notificationMonitor.js` - Mejorado

**Necesitan estar en Railway para que funcionen.**

---

## 📞 Dime Qué Prefieres

1. **Instalar Git ahora** (te guío paso a paso) - 15 minutos
2. **Usar Railway CLI** (intento hacer el link por ti) - 5 minutos
3. **Ver si puedo hacer Redeploy** desde Dashboard - 2 minutos

¿Cuál eliges? 🚀
