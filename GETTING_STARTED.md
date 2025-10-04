# Guía de Inicio Rápido - App Trabajo en Terreno 2.0

Esta guía te ayudará a poner en marcha la aplicación completa en tu entorno local.

## 📋 Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) - [Descargar](https://nodejs.org/)
- **MongoDB** - [Descargar](https://www.mongodb.com/try/download/community)
- **Git** - [Descargar](https://git-scm.com/)
- **Un editor de código** (recomendado: VS Code)

## 🚀 Instalación Rápida

### Paso 1: Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm run install-all
```

Este comando:
- ✅ Instalará todas las dependencias del backend y frontend
- ✅ Creará automáticamente el archivo `.env` con una clave JWT segura
- ✅ Configurará el archivo `.env` del cliente

**Nota:** El archivo `.env` se genera automáticamente con configuraciones seguras. No necesitas crearlo manualmente.

### Paso 2: Iniciar MongoDB

Asegúrate de que MongoDB esté corriendo en tu sistema:

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
sudo service mongod start
```

O si instalaste MongoDB Compass, simplemente ábrelo y conéctate a `localhost:27017`.

### Paso 3: Iniciar la Aplicación

En la carpeta raíz del proyecto, ejecuta:

```bash
npm run dev
```

Este comando iniciará simultáneamente:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

## 🌐 Acceder a la Aplicación Web

1. Abre tu navegador
2. Ve a http://localhost:5173
3. Inicia sesión con las credenciales de administrador:
   - **Usuario:** administrador
   - **Contraseña:** 1234567

## 📱 Configurar Aplicación Móvil

### 1. Navegar a la carpeta mobile

```bash
cd mobile
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la URL de la API

Edita `mobile/app.json` y actualiza la URL:

```json
"extra": {
  "apiUrl": "http://TU_IP_LOCAL:5000/api"
}
```

Para encontrar tu IP local:
- **Windows:** `ipconfig` (busca IPv4)
- **Mac/Linux:** `ifconfig` (busca inet)

### 4. Instalar Expo CLI globalmente

```bash
npm install -g expo-cli
```

### 5. Iniciar la app móvil

```bash
npm start
```

### 6. Probar en tu dispositivo

1. Instala "Expo Go" desde Google Play Store
2. Escanea el código QR que aparece en la terminal
3. La app se cargará en tu dispositivo

## 📊 Estructura de las Interfaces

### Aplicación Web

La aplicación web incluye las siguientes interfaces:

1. **Inicio de Sesión / Registro**
   - Login con usuario o email
   - Registro con validación de Gmail
   - Usuario administrador predefinido

2. **Dashboard (Inicio)**
   - Estadísticas generales
   - Accesos rápidos a todas las secciones

3. **Interfaz Contactos**
   - Agregar contactos (usuarios registrados o no)
   - Sugerencias automáticas para usuarios registrados
   - Vincular/desvincular instituciones

4. **Interfaz Actividades**
   - Crear actividades con asunto y comentario
   - Compartir con otros usuarios
   - Vista de lista y calendario
   - Opción de registrar en calendario de Google

5. **Interfaz Tareas**
   - Crear tareas con prioridad y fecha límite
   - Asignar a usuarios
   - Seguimiento de estado
   - Filtros por estado

6. **Interfaz Seguimiento de Reclamos**
   - Agregar reclamos de clientes
   - Seguimiento con actualizaciones
   - Gestión de estado y prioridad

7. **Interfaz Contratos**
   - Cargar archivos Excel con contratos
   - Visualización en tabla
   - Solo accesible para administradores

8. **Panel de Administración** (solo para administrador)
   - Gestión de usuarios
   - Gestión de instituciones

### Aplicación Móvil

La aplicación móvil incluye:

1. **Pantalla de Login/Registro**
2. **Dashboard con estadísticas**
3. **Visualización de Actividades**
4. **Visualización de Tareas**
5. **Visualización de Reclamos**
6. **Visualización de Contratos**

## 🔧 Comandos Útiles

### Backend

```bash
# Iniciar solo el backend
npm run server

# Ver logs del servidor
# Los logs aparecerán en la terminal
```

### Frontend

```bash
# Iniciar solo el frontend
npm run client

# Compilar para producción
npm run build
```

### Aplicación Móvil

```bash
# Iniciar en modo desarrollo
cd mobile && npm start

# Compilar APK para Android
cd mobile && npm run build:apk
```

## 🐛 Solución de Problemas Comunes

### No se creó el archivo .env

**Solución:**
```bash
npm run setup
```

Este comando creará el archivo `.env` manualmente si no se generó durante la instalación.

### Error: No se puede conectar a MongoDB

**Solución:**
1. Verifica que MongoDB esté corriendo
2. Confirma que la URL en `.env` sea correcta (por defecto: `mongodb://localhost:27017/app-trabajo-terreno`)
3. Prueba la conexión usando MongoDB Compass

### Error: Puerto 5000 ya en uso

**Solución:**
1. Cambia el puerto en `.env`
2. O cierra la aplicación que está usando el puerto 5000

### La aplicación web no carga estilos

**Solución:**
```bash
cd client
npm install
npm run dev
```

### La app móvil no se conecta al backend

**Solución:**
1. Verifica que uses tu IP local, no `localhost`
2. Asegúrate de que ambos dispositivos estén en la misma red
3. Verifica que el firewall no esté bloqueando la conexión

### Error: "Cannot find module"

**Solución:**
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules
rm -rf client/node_modules
npm run install-all
```

## 📖 Funcionalidades Principales

### Para Usuarios Regulares

✅ Crear y gestionar contactos  
✅ Crear actividades individuales o compartidas  
✅ Gestionar tareas con prioridades  
✅ Ver y dar seguimiento a reclamos  
✅ Consultar contratos  
✅ Vincular instituciones a su perfil

### Para Administradores

✅ Todo lo anterior, más:  
✅ Ver y eliminar usuarios del sistema  
✅ Agregar/editar/eliminar instituciones  
✅ Cargar archivos Excel con contratos

## 🌐 Despliegue en Producción

Para desplegar la aplicación en Railway, consulta el archivo `DEPLOYMENT.md`.

## 📱 Generar APK para Android

Para crear un archivo APK instalable:

1. Ve a la carpeta mobile
2. Instala EAS CLI: `npm install -g eas-cli`
3. Inicia sesión: `eas login`
4. Compila: `npm run build:apk`

Consulta `mobile/README.md` para más detalles.

## 📚 Recursos Adicionales

- **Backend:** Express.js + MongoDB + JWT
- **Frontend Web:** React + Vite + TailwindCSS
- **Mobile:** React Native + Expo
- **Autenticación:** JWT tokens
- **Base de datos:** MongoDB

## 💡 Siguientes Pasos

1. ✅ Inicia la aplicación en modo desarrollo
2. ✅ Crea algunos contactos de prueba
3. ✅ Agrega actividades y tareas
4. ✅ Prueba la app móvil en tu dispositivo
5. ✅ Configura MongoDB Atlas para producción
6. ✅ Despliega en Railway (ver DEPLOYMENT.md)
7. ✅ Compila el APK para Android

## 🤝 Soporte

Si encuentras algún problema:

1. Revisa esta guía
2. Consulta los archivos README específicos
3. Verifica los logs del servidor y cliente
4. Asegúrate de tener todas las dependencias instaladas

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**¡Listo para comenzar!** 🎉

Ahora puedes empezar a usar la aplicación y personalizarla según tus necesidades.
