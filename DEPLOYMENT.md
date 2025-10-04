# Guía de Despliegue en Railway

## Configuración Inicial

### 1. Preparar el Repositorio en GitHub

```bash
# Inicializar Git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: App Trabajo en Terreno 2.0"

# Crear repositorio en GitHub y conectarlo
git remote add origin <URL_DE_TU_REPOSITORIO>
git branch -M main
git push -u origin main
```

### 2. Crear Cuenta en Railway

1. Visita [Railway.app](https://railway.app)
2. Regístrate con tu cuenta de GitHub
3. Autoriza el acceso a tus repositorios

### 3. Desplegar el Proyecto

#### Opción A: Desde GitHub (Recomendado)

1. En Railway, haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Selecciona el repositorio de tu proyecto
4. Railway detectará automáticamente que es un proyecto Node.js

#### Opción B: Desde CLI de Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Iniciar sesión
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up
```

### 4. Configurar Variables de Entorno

En el Dashboard de Railway, ve a tu proyecto y configura las siguientes variables de entorno:

```
PORT=5000
MONGODB_URI=<URL_DE_TU_BASE_DE_DATOS_MONGODB>
JWT_SECRET=<GENERA_UNA_CLAVE_SECRETA_SEGURA>
NODE_ENV=production
```

### 5. Configurar MongoDB

#### Opción A: MongoDB Atlas (Recomendado)

1. Crea una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Crea un usuario de base de datos
4. Configura Network Access (0.0.0.0/0 para acceso público)
5. Obtén la URL de conexión y agrégala como `MONGODB_URI`

Ejemplo de URL:
```
mongodb+srv://usuario:password@cluster.mongodb.net/app-trabajo-terreno?retryWrites=true&w=majority
```

#### Opción B: MongoDB en Railway

1. En Railway, haz clic en "New" → "Database" → "Add MongoDB"
2. Railway generará automáticamente la variable `MONGODB_URI`

### 6. Configurar Dominio (Opcional)

1. En Railway, ve a Settings → Domains
2. Genera un dominio público gratuito (*.up.railway.app)
3. O conecta tu dominio personalizado

### 7. Verificar el Despliegue

Una vez desplegado:

1. Railway te proporcionará una URL pública
2. Accede a la URL para verificar que la aplicación funciona
3. Prueba el login con:
   - **Usuario:** administrador
   - **Contraseña:** 1234567

## Configuración del Frontend

El frontend está configurado para usar variables de entorno de Vite. Asegúrate de que en producción apunte a la URL correcta de tu API.

Railway sirve automáticamente los archivos estáticos compilados del cliente desde la carpeta `client/dist`.

## Solución de Problemas

### La aplicación no inicia

- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Railway Dashboard
- Asegúrate de que MongoDB esté accesible

### Error de conexión a MongoDB

- Verifica que la URL de MongoDB sea correcta
- Asegúrate de que Network Access esté configurado correctamente en MongoDB Atlas
- Verifica que el usuario de base de datos tenga los permisos necesarios

### Frontend no se carga

- Ejecuta `npm run build` localmente para verificar que compila sin errores
- Verifica que los archivos estén en `client/dist`
- Revisa la consola del navegador para errores

## Actualizaciones

Para actualizar la aplicación desplegada:

```bash
# Hacer cambios en el código
git add .
git commit -m "Descripción de los cambios"
git push

# Railway detectará los cambios y redesplegará automáticamente
```

## Monitoreo

Railway proporciona:
- **Logs en tiempo real**: Para debugging
- **Métricas de uso**: CPU, Memoria, Network
- **Reinicio automático**: En caso de fallos

## Costos

Railway ofrece:
- **Nivel gratuito**: $5 de crédito mensual
- **Pro Plan**: $20/mes con más recursos

Para este proyecto, el nivel gratuito debería ser suficiente para desarrollo y pruebas.
