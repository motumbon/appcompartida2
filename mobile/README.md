# App Trabajo en Terreno - Aplicación Móvil Android

Aplicación móvil desarrollada con React Native y Expo para gestión de actividades, tareas, reclamos y contratos.

## Prerequisitos

- Node.js 18 o superior
- npm o yarn
- Cuenta de Expo (para compilar el APK)
- Android Studio (opcional, para emulador)

## Instalación

```bash
cd mobile
npm install
```

## Configuración

### 1. Configurar URL de la API

Edita el archivo `app.json` y actualiza la URL de la API:

```json
"extra": {
  "apiUrl": "https://tu-url-de-railway.up.railway.app/api"
}
```

Para desarrollo local:
```json
"extra": {
  "apiUrl": "http://tu-ip-local:5000/api"
}
```

**Nota:** No uses `localhost` o `127.0.0.1` cuando pruebes en un dispositivo físico. Usa la IP de tu computadora en la red local.

## Desarrollo

### Iniciar en modo desarrollo

```bash
npm start
```

Esto abrirá Expo Dev Tools en tu navegador.

### Probar en Android

#### Opción A: Dispositivo físico (Recomendado)

1. Instala la app "Expo Go" desde Google Play Store
2. Escanea el código QR que aparece en la terminal o navegador
3. La app se cargará en tu dispositivo

#### Opción B: Emulador Android

1. Instala Android Studio
2. Configura un emulador Android (AVD)
3. Inicia el emulador
4. En la terminal, ejecuta:

```bash
npm run android
```

## Construir APK para Android

### 1. Instalar EAS CLI

```bash
npm install -g eas-cli
```

### 2. Iniciar sesión en Expo

```bash
eas login
```

Si no tienes cuenta, créala en [expo.dev](https://expo.dev)

### 3. Configurar el proyecto

```bash
eas build:configure
```

Esto creará el archivo `eas.json` si no existe.

### 4. Compilar APK

Para generar un APK (Android Package) que puedas instalar directamente:

```bash
npm run build:apk
```

O usando EAS CLI directamente:

```bash
eas build -p android --profile preview
```

Este comando:
- Sube tu código a los servidores de Expo
- Compila la aplicación en la nube
- Genera un archivo APK descargable

### 5. Descargar el APK

Una vez completada la compilación (toma 10-20 minutos):

1. Recibirás un enlace de descarga en la terminal
2. También puedes ver tus builds en [expo.dev/builds](https://expo.dev/builds)
3. Descarga el APK a tu dispositivo Android
4. Instala el APK (necesitas habilitar "Instalar apps de fuentes desconocidas")

## Compilar para Producción (Google Play Store)

Para generar un AAB (Android App Bundle) para subir a Google Play:

```bash
eas build -p android --profile production
```

Necesitarás:
- Una cuenta de Google Play Developer ($25 USD una sola vez)
- Configurar firmas y certificados
- Seguir las políticas de Google Play

## Estructura del Proyecto

```
mobile/
├── App.js                    # Punto de entrada
├── app.json                  # Configuración de Expo
├── eas.json                  # Configuración de EAS Build
├── package.json              # Dependencias
└── src/
    ├── config/
    │   └── api.js           # Configuración de API
    ├── contexts/
    │   └── AuthContext.js   # Context de autenticación
    ├── navigation/
    │   └── AppNavigator.js  # Navegación principal
    └── screens/
        ├── LoginScreen.js
        ├── RegisterScreen.js
        ├── HomeScreen.js
        ├── ActivitiesScreen.js
        ├── TasksScreen.js
        ├── ComplaintsScreen.js
        └── ContractsScreen.js
```

## Características

- ✅ Autenticación de usuarios
- ✅ Visualización de actividades
- ✅ Gestión de tareas
- ✅ Seguimiento de reclamos
- ✅ Consulta de contratos
- ✅ Sincronización en tiempo real con el backend
- ✅ Almacenamiento seguro de credenciales
- ✅ Actualización pull-to-refresh

## Usuarios de Prueba

- **Usuario:** administrador
- **Contraseña:** 1234567

## Troubleshooting

### No se conecta al backend

1. Verifica que la URL de la API sea correcta en `app.json`
2. Si usas un dispositivo físico, asegúrate de que esté en la misma red que tu servidor
3. Usa la IP local de tu computadora, no `localhost`

### Error al compilar el APK

1. Verifica que tu cuenta de Expo esté activa
2. Asegúrate de tener buena conexión a internet
3. Revisa los logs en [expo.dev/builds](https://expo.dev/builds)

### La app se cierra al abrir

1. Verifica los logs en Expo Go o el emulador
2. Asegúrate de que todas las dependencias estén instaladas
3. Limpia cache: `expo start -c`

## Actualizar la App

Para aplicar cambios y regenerar el APK:

1. Modifica el código
2. Incrementa la versión en `app.json`
3. Vuelve a compilar: `npm run build:apk`
4. Descarga e instala el nuevo APK

## Publicar Actualizaciones OTA (Over-The-Air)

Expo permite actualizaciones sin recompilar:

```bash
eas update --branch production
```

Los usuarios recibirán la actualización automáticamente sin descargar un nuevo APK.

## Recursos

- [Documentación de Expo](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Go App](https://expo.dev/client)

## Soporte

Para problemas o preguntas, consulta la documentación oficial de Expo o abre un issue en el repositorio.
