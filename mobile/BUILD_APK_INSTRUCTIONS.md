# 📱 Instrucciones para Generar APK - App Trabajo en Terreno

## 🎯 Requisitos Previos

### 1. Instalar Node.js
- Descargar de: https://nodejs.org/
- Versión recomendada: 18.x o superior
- Verificar instalación:
```bash
node --version
npm --version
```

### 2. Instalar Expo CLI
```bash
npm install -g expo-cli
npm install -g eas-cli
```

### 3. Crear cuenta en Expo
- Ir a: https://expo.dev/signup
- Crear cuenta gratuita
- Iniciar sesión:
```bash
eas login
```

---

## 📋 Pasos para Generar el APK

### Paso 1: Navegar a la carpeta del proyecto móvil
```bash
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Configurar la URL de la API
Editar `app.json` y actualizar la URL de tu backend en Railway:
```json
"extra": {
  "apiUrl": "https://web-production-10bfc.up.railway.app/api"
}
```

### Paso 4: Configurar EAS Build
Inicializar el proyecto con EAS:
```bash
eas build:configure
```

Esto creará automáticamente el archivo `eas.json` si no existe.

### Paso 5: Generar el APK

**Opción A: Build en la nube de Expo (Recomendado)**
```bash
eas build -p android --profile preview
```

- El proceso tomará entre 10-20 minutos
- Recibirás un link para descargar el APK cuando termine
- El APK estará disponible en tu dashboard de Expo: https://expo.dev/accounts/[tu-usuario]/projects/app-trabajo-terreno-mobile/builds

**Opción B: Build local (Requiere Android Studio)**
```bash
eas build -p android --profile preview --local
```

### Paso 6: Descargar e instalar el APK
1. Una vez completado el build, recibirás un link
2. Descargar el archivo `.apk`
3. Transferir el APK a tu dispositivo Android
4. Activar "Instalar desde fuentes desconocidas" en configuración
5. Instalar el APK

---

## 🔧 Configuración de eas.json (Ya está creado)

El archivo `eas.json` debería verse así:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 🚀 Funcionalidades de la App Móvil

✅ **Autenticación**
- Login
- Registro

✅ **Pantalla de Inicio**
- Dashboard con estadísticas
- Accesos rápidos

✅ **Contactos**
- Crear, editar y eliminar contactos
- Ver contactos registrados como usuarios

✅ **Actividades**
- Crear y compartir actividades
- Ver actividades propias y compartidas
- Editar y eliminar actividades

✅ **Tareas**
- Crear tareas con prioridades
- Checklist de tareas
- Marcar como completadas
- Compartir con usuarios

✅ **Reclamos**
- Gestionar reclamos de clientes
- Estados: Abierto, En Proceso, Cerrado
- Agregar actualizaciones
- Compartir con equipo

✅ **Contratos**
- Visualizar contratos
- Buscar por cliente o número
- Ver detalles y estado
- (No permite subir Excel desde móvil)

✅ **Stock (Status BO)**
- Consultar stock en tiempo real
- Buscar productos
- Ver cantidad disponible
- Indicadores de stock bajo/sin stock
- (No permite subir Excel desde móvil)

✅ **Notas**
- Crear notas personales
- Compartir con usuarios
- Editar y eliminar
- Ver notas compartidas contigo

---

## 🔄 Sincronización Web ↔ Móvil

La aplicación móvil se conecta a la **misma API** que la versión web, por lo que:

- ✅ **Crear actividad en web** → Se ve en móvil
- ✅ **Crear tarea en móvil** → Se ve en web
- ✅ **Compartir nota en móvil** → El usuario la ve en web
- ✅ **Actualizar reclamo en web** → Se actualiza en móvil
- ✅ **Datos siempre sincronizados en tiempo real**

---

## 📱 Permisos de Usuario

La app móvil respeta los **mismos permisos** configurados en el panel de administración:

- Si un usuario no tiene permiso para "Tareas", no verá esa pestaña
- Si no tiene permiso para "Stock", no verá esa interfaz
- Los permisos se configuran desde la versión web (Admin → Usuarios)

---

## 🛠️ Solución de Problemas

### Error: "EXPO_TOKEN not found"
```bash
eas login
```

### Error: "Project ID not configured"
Editar `app.json` y agregar tu Project ID de Expo:
```json
"extra": {
  "eas": {
    "projectId": "tu-project-id-aqui"
  }
}
```

### Error al instalar dependencias
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### La app no se conecta a la API
1. Verificar que la URL en `app.json` es correcta
2. Asegurarse de que el backend en Railway está corriendo
3. Verificar conexión a internet del dispositivo

---

## 📦 Archivos Generados

Después del build, tendrás:
- **APK**: `app-trabajo-terreno-v1.0.0.apk` (30-50 MB aprox.)
- **Ubicación**: Link en Expo Dashboard o carpeta local si build local

---

## 🔐 Seguridad

- ✅ Token JWT almacenado seguramente con `expo-secure-store`
- ✅ Conexión HTTPS a la API
- ✅ Misma seguridad que la versión web
- ✅ No se guardan contraseñas en el dispositivo

---

## 📊 Tamaño del APK

- **Tamaño esperado**: 30-50 MB
- **Primera instalación**: 35-55 MB
- **Requiere Android**: 5.0 (Lollipop) o superior

---

## 🎨 Personalización

Para cambiar el icono de la app:
1. Reemplazar `assets/icon.png` (1024x1024 px)
2. Reemplazar `assets/adaptive-icon.png` (1024x1024 px)
3. Reconstruir el APK

---

## ✅ Checklist Final

Antes de generar el APK, verificar:

- [ ] URL de la API correcta en `app.json`
- [ ] Cuenta de Expo creada y login hecho
- [ ] Dependencias instaladas (`npm install`)
- [ ] Backend en Railway funcionando
- [ ] Versión actualizada en `app.json`

---

## 🚀 Comando Rápido (Todo en Uno)

```bash
cd "c:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile"
npm install
eas login
eas build -p android --profile preview
```

Luego espera 10-20 minutos y descarga el APK del link que te proporcionará.

---

## 📞 Soporte

Si tienes problemas:
1. Revisar logs del build en Expo Dashboard
2. Verificar que todas las dependencias están instaladas
3. Comprobar que el backend está accesible desde internet
4. Verificar permisos de Android habilitados

---

## 🎉 ¡Listo!

Una vez instalado el APK en tu dispositivo Android, podrás:
- Iniciar sesión con tus credenciales
- Ver y crear actividades, tareas, notas, etc.
- Todo sincronizado con la versión web en tiempo real
- Trabajar desde cualquier lugar

**Nota importante**: La primera vez que abras la app, puede tomar unos segundos en cargar mientras se conecta a la API.
