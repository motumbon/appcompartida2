# 📦 Cómo Instalar MongoDB en Windows

## Opción A: MongoDB Atlas (Cloud - Recomendado) ⭐

### Ventajas:
- ✅ No requiere instalación local
- ✅ Gratis hasta 512 MB
- ✅ Accesible desde cualquier lugar
- ✅ Backups automáticos
- ✅ Configuración en 5 minutos

### Pasos:

1. **Crear cuenta:**
   - Ve a: https://www.mongodb.com/cloud/atlas/register
   - Regístrate con tu email o Google

2. **Crear cluster gratuito:**
   - Click en "Build a Database"
   - Selecciona "FREE" (M0 Sandbox)
   - Elige región: "São Paulo" o la más cercana
   - Click "Create"

3. **Configurar seguridad:**
   - **Username:** Crea un usuario (ej: `admin`)
   - **Password:** Crea una contraseña segura (guárdala)
   - Click "Create User"

4. **Configurar acceso de red:**
   - Click "Add IP Address"
   - Selecciona "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Obtener connection string:**
   - Click en "Connect"
   - Selecciona "Connect your application"
   - Copia la URL (se ve así):
     ```
     mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

6. **Actualizar tu proyecto:**
   - Abre el archivo `.env` en la raíz del proyecto
   - Reemplaza la línea `MONGODB_URI` con tu URL
   - **IMPORTANTE:** Reemplaza `<password>` con tu contraseña real
   - Ejemplo:
     ```
     MONGODB_URI=mongodb+srv://admin:MiPassword123@cluster0.xxxxx.mongodb.net/app-trabajo-terreno?retryWrites=true&w=majority
     ```

7. **Reiniciar la aplicación:**
   ```bash
   npm run dev
   ```

---

## Opción B: MongoDB Local (Instalación en Windows)

### Ventajas:
- ✅ Funciona sin internet
- ✅ Control total
- ✅ Más rápido (local)

### Desventajas:
- ❌ Requiere instalación
- ❌ Ocupa espacio en disco (~500 MB)
- ❌ Necesitas mantenerlo actualizado

### Pasos:

1. **Descargar MongoDB:**
   - Ve a: https://www.mongodb.com/try/download/community
   - Selecciona:
     - Version: Latest (actual)
     - Platform: Windows
     - Package: MSI
   - Click "Download"

2. **Instalar MongoDB:**
   - Ejecuta el archivo `.msi` descargado
   - Selecciona "Complete" installation
   - **IMPORTANTE:** Marca "Install MongoDB as a Service"
   - Deja las opciones por defecto
   - Click "Install"

3. **Verificar instalación:**
   ```powershell
   mongod --version
   ```

4. **Iniciar MongoDB:**
   
   MongoDB debería iniciar automáticamente como servicio. Si no:
   
   ```powershell
   # Iniciar servicio
   net start MongoDB
   
   # Verificar que está corriendo
   mongo --eval "db.version()"
   ```

5. **Tu archivo .env ya está configurado:**
   ```
   MONGODB_URI=mongodb://localhost:27017/app-trabajo-terreno
   ```

6. **Reiniciar la aplicación:**
   ```bash
   npm run dev
   ```

---

## 🔧 Solución de Problemas

### MongoDB Atlas: "Authentication failed"
- Verifica que reemplazaste `<password>` con tu contraseña real
- Asegúrate de que no haya espacios extra
- La contraseña debe estar URL-encoded si tiene caracteres especiales

### MongoDB Local: "mongod no se reconoce"
- MongoDB no está en el PATH
- Reinicia tu terminal/PowerShell
- O agrega MongoDB al PATH manualmente

### No puedo conectar a MongoDB
- Verifica que el servicio esté corriendo
- Revisa el archivo `.env`
- Mira los logs en la terminal del servidor

---

## 📊 Comparación

| Característica | Atlas (Cloud) | Local |
|----------------|---------------|-------|
| Instalación | ⭐⭐⭐⭐⭐ Fácil | ⭐⭐⭐ Media |
| Velocidad | ⭐⭐⭐⭐ Rápida | ⭐⭐⭐⭐⭐ Muy rápida |
| Acceso remoto | ✅ Sí | ❌ No |
| Costo | ✅ Gratis (512MB) | ✅ Gratis |
| Mantenimiento | ✅ Automático | ❌ Manual |

---

## 🎯 Recomendación

Para desarrollo y pruebas: **MongoDB Atlas** (más fácil y rápido de configurar)

Para producción o uso intensivo: **MongoDB Local** (más control y velocidad)

---

## ✅ Verificar que Funciona

Una vez configurado MongoDB (Atlas o Local):

1. Inicia la aplicación:
   ```bash
   npm run dev
   ```

2. Deberías ver en la terminal:
   ```
   ✅ MongoDB conectado exitosamente
   🚀 Servidor corriendo en puerto 5000
   ```

3. Abre http://localhost:5173 y prueba registrar un usuario

---

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa los logs en la terminal
2. Verifica tu archivo `.env`
3. Asegúrate de que MongoDB esté corriendo
4. Consulta la documentación oficial: https://docs.mongodb.com/
