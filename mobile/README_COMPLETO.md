# 📱 App Trabajo en Terreno - Versión Móvil

Aplicación móvil Android desarrollada con **React Native + Expo** que se conecta a la misma API que la versión web, permitiendo sincronización total de datos en tiempo real.

## 🚀 Características

- ✅ **Sincronización en tiempo real** con la versión web
- ✅ **Todas las funcionalidades** de la plataforma web
- ✅ **Mismo sistema de permisos** por usuario
- ✅ **Autenticación segura** con JWT
- ✅ **Interfaz optimizada** para móvil

## 📋 Pantallas Implementadas

1. **Autenticación** - Login y Registro
2. **Inicio** - Dashboard con estadísticas
3. **Contactos** - CRUD completo
4. **Actividades** - CRUD + compartir
5. **Tareas** - CRUD + compartir + checklist
6. **Reclamos** - CRUD + compartir + actualizaciones
7. **Contratos** - Visualización (sin subir Excel)
8. **Stock** - Consulta (sin subir Excel)
9. **Notas** - CRUD + compartir

## 🛠️ Tecnologías

- React Native + Expo
- React Navigation
- Axios
- Expo Secure Store

## 📦 Instalación Rápida

```bash
cd mobile
SETUP.bat
```

O manualmente:

```bash
npm install
npm install -g expo-cli eas-cli
```

## 🔧 Configuración

Editar `app.json` con la URL de tu API:

```json
"extra": {
  "apiUrl": "https://tu-backend.up.railway.app/api"
}
```

## 📱 Generar APK

Ver **BUILD_APK_INSTRUCTIONS.md** para instrucciones completas.

**Comando rápido:**

```bash
eas login
eas build -p android --profile preview
```

Espera 10-20 minutos y descarga el APK del link proporcionado.

## 🔄 Sincronización

Todo lo que se crea en la app móvil se ve instantáneamente en la web y viceversa:

- ✅ Actividades
- ✅ Tareas
- ✅ Reclamos
- ✅ Contactos
- ✅ Notas
- ✅ Todo sincronizado en tiempo real

## ✅ Listo para Usar

La app está completamente funcional. Solo necesitas:

1. Ejecutar `SETUP.bat`
2. Configurar la URL de la API en `app.json`
3. Ejecutar `eas build -p android --profile preview`
4. Instalar el APK generado

Para más detalles, consulta **BUILD_APK_INSTRUCTIONS.md**
