# 📤 Guía para Subir a GitHub y Desplegar en Railway

## 📋 Prerequisitos

1. **Git instalado** - Si no lo tienes: https://git-scm.com/download/win
2. **Cuenta de GitHub** - Ya tienes el repositorio: https://github.com/motumbon/appcompartida2.git
3. **Cuenta de Railway** - Crear en: https://railway.app

---

## 🚀 Paso 1: Subir a GitHub

### Opción A: Usando Git Bash o Terminal

Abre Git Bash o PowerShell en la carpeta del proyecto y ejecuta:

```bash
# Inicializar repositorio Git
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: App Trabajo en Terreno 2.0 completa"

# Conectar con tu repositorio remoto
git remote add origin https://github.com/motumbon/appcompartida2.git

# Subir a GitHub (rama main)
git branch -M main
git push -u origin main
```

Si te pide credenciales:
- **Username:** tu usuario de GitHub
- **Password:** usa un Personal Access Token (no tu contraseña)
  - Crear token en: https://github.com/settings/tokens

### Opción B: Usando GitHub Desktop

1. Descarga GitHub Desktop: https://desktop.github.com/
2. Abre GitHub Desktop
3. File → Add Local Repository
4. Selecciona la carpeta del proyecto
5. Click en "Publish repository"
6. Usa la URL: https://github.com/motumbon/appcompartida2.git

---

## 🚂 Paso 2: Configurar Railway

### A. Crear Proyecto en Railway

1. Ve a: https://railway.app
2. Inicia sesión con GitHub
3. Click en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Busca y selecciona: **motumbon/appcompartida2**
6. Railway detectará automáticamente que es un proyecto Node.js

### B. Configurar Variables de Entorno

En el dashboard de Railway, ve a tu proyecto → **Variables**:

```env
PORT=5000
MONGODB_URI=mongodb+srv://admin:Valita502.@motumbon.umtrefn.mongodb.net/app-trabajo-terreno?retryWrites=true&w=majority&appName=motumbon
JWT_SECRET=97969369761b47e1ec96541ae745e9477173f6cc85b90f3e82961b8
NODE_ENV=production
```

**⚠️ IMPORTANTE:** 
- Usa tu connection string de MongoDB Atlas
- El JWT_SECRET debe ser el mismo que usas localmente
- NODE_ENV debe ser "production"

### C. Configurar el Build

Railway debería detectar automáticamente la configuración gracias a los archivos:
- `railway.json`
- `nixpacks.toml`
- `Procfile`

Si necesitas ajustar manualmente:
- **Build Command:** `npm run install-all && npm run build`
- **Start Command:** `npm start`

### D. Desplegar

1. Railway comenzará a construir automáticamente
2. Espera 5-10 minutos
3. Una vez completado, Railway te dará una URL pública

---

## 🌐 Paso 3: Obtener tu URL de Producción

1. En Railway, ve a tu proyecto
2. Click en **"Settings"** → **"Domains"**
3. Click en **"Generate Domain"**
4. Railway te dará una URL como: `https://tu-app.up.railway.app`

---

## 📱 Paso 4: Actualizar la App Móvil

Una vez que tengas la URL de Railway:

1. Abre: `mobile/app.json`
2. Actualiza la URL de la API:

```json
"extra": {
  "apiUrl": "https://tu-app.up.railway.app/api"
}
```

3. Recompila la app móvil:

```bash
cd mobile
npm run build:apk
```

---

## ✅ Verificar el Despliegue

1. Abre la URL de Railway en tu navegador
2. Deberías ver la pantalla de login
3. Inicia sesión con:
   - Usuario: `administrador`
   - Contraseña: `1234567`

---

## 🔧 Solución de Problemas

### Error: "Cannot connect to MongoDB"

**Solución:**
1. Ve a MongoDB Atlas
2. Network Access → Add IP Address
3. Selecciona "Allow Access from Anywhere" (0.0.0.0/0)

### Error: "Application failed to start"

**Solución:**
1. Revisa los logs en Railway
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que MONGODB_URI sea correcta

### Error: "Module not found"

**Solución:**
1. Verifica que `package.json` tenga todas las dependencias
2. Railway debería ejecutar `npm install` automáticamente
3. Revisa los logs de build en Railway

---

## 📊 Monitoreo

Railway proporciona:
- **Logs en tiempo real** - Para debugging
- **Métricas** - CPU, Memoria, Network
- **Reinicio automático** - Si la app falla

---

## 💰 Costos

Railway ofrece:
- **$5 USD de crédito gratis** por mes
- Suficiente para desarrollo y pruebas
- Si necesitas más, el plan Pro es $20/mes

---

## 🔄 Actualizar la Aplicación

Para subir cambios futuros:

```bash
# Hacer cambios en el código
git add .
git commit -m "Descripción de los cambios"
git push

# Railway detectará los cambios y redesplegará automáticamente
```

---

## 📝 Checklist Final

- [ ] Código subido a GitHub
- [ ] Proyecto creado en Railway
- [ ] Variables de entorno configuradas
- [ ] MongoDB Atlas accesible desde cualquier IP
- [ ] Aplicación desplegada exitosamente
- [ ] URL pública funcionando
- [ ] Login funciona correctamente
- [ ] App móvil actualizada con nueva URL

---

## 🆘 Ayuda Adicional

- **Railway Docs:** https://docs.railway.app/
- **GitHub Docs:** https://docs.github.com/
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/

---

**¡Listo para desplegar!** 🚀

Sigue estos pasos en orden y tu aplicación estará en producción en menos de 30 minutos.
