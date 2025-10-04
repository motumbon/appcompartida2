# 🚀 Inicio Rápido - 3 Pasos

## ✅ Paso 1: Instalar Dependencias

```bash
npm run install-all
```

Este comando instala todo lo necesario y crea automáticamente el archivo `.env` con configuraciones seguras.

## ✅ Paso 2: Iniciar MongoDB

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
sudo service mongod start
```

## ✅ Paso 3: Iniciar la Aplicación

```bash
npm run dev
```

## 🌐 Acceder a la Aplicación

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

## 👤 Credenciales de Prueba

- **Usuario:** administrador
- **Contraseña:** 1234567

---

## 📱 Aplicación Móvil (Opcional)

```bash
cd mobile
npm install
npm start
```

Escanea el código QR con la app **Expo Go** en tu Android.

---

## 📚 Documentación Completa

- **GETTING_STARTED.md** - Guía detallada paso a paso
- **DEPLOYMENT.md** - Despliegue en Railway
- **mobile/README.md** - Guía de la app móvil

---

## ⚠️ Problemas Comunes

### No se creó el archivo .env
```bash
npm run setup
```

### MongoDB no está corriendo
Verifica que MongoDB esté instalado y ejecutándose.

### Error de puerto ocupado
Cambia el puerto en el archivo `.env` que se creó en la raíz del proyecto.

---

## 🎉 ¡Listo!

Tu aplicación está corriendo. Explora las diferentes interfaces:
- 📇 Contactos
- 📅 Actividades  
- ✅ Tareas
- ⚠️ Reclamos
- 📄 Contratos
- 👥 Administración (solo admin)
