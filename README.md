# App Trabajo en Terreno 2.0

Aplicación completa de gestión con múltiples interfaces para:
- Gestión de Contactos
- Gestión de Actividades
- Gestión de Tareas
- Seguimiento de Reclamos
- Gestión de Contratos

## Características

- ✅ Sistema de autenticación con JWT
- ✅ Usuario administrador predefinido
- ✅ Gestión de usuarios e instituciones
- ✅ Integración con Google Calendar
- ✅ Carga de archivos Excel
- ✅ Aplicación web responsive
- ✅ Aplicación móvil para Android
- ✅ Persistencia de datos con MongoDB

## Instalación

### Prerequisitos
- Node.js v18 o superior
- MongoDB instalado y corriendo
- Git

### Pasos

1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd "App Trabajo en terreno 2.0"
```

2. Instalar dependencias (esto también creará automáticamente el archivo .env)
```bash
npm run install-all
```

**Nota:** El script de instalación crea automáticamente el archivo `.env` con una clave JWT segura y aleatoria.

3. Asegúrate de que MongoDB esté corriendo
```bash
# Windows
mongod

# Mac/Linux
sudo service mongod start
```

4. Iniciar la aplicación en modo desarrollo
```bash
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Usuario Administrador

Por defecto, el sistema crea un usuario administrador:
- **Usuario:** administrador
- **Contraseña:** 1234567

## Despliegue en Railway

1. Crear cuenta en Railway.app
2. Conectar el repositorio de GitHub
3. Configurar las variables de entorno en Railway
4. Railway detectará automáticamente la configuración

## Construcción de la App Android

```bash
cd mobile
npm install
npm run build:android
```

## Estructura del Proyecto

```
├── server/              # Backend (Node.js + Express)
│   ├── models/         # Modelos de MongoDB
│   ├── routes/         # Rutas de la API
│   ├── middleware/     # Middleware de autenticación
│   └── index.js        # Punto de entrada del servidor
├── client/             # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas de la aplicación
│   │   ├── contexts/   # Context API para estado global
│   │   └── App.jsx     # Componente principal
│   └── package.json
└── mobile/             # Aplicación móvil (React Native)
