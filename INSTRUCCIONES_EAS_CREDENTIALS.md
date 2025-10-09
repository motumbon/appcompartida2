# 🔑 Instrucciones para eas credentials

## Cuando aparezca el menú interactivo:

### Paso 1: Seleccionar Platform
```
? Select platform › 
  ❯ Android
    iOS
```
**Selecciona:** `Android` (Enter)

---

### Paso 2: Seleccionar Profile
```
? Select a build profile › 
  ❯ production
    preview
    development
```
**Selecciona:** `production` (Enter)

---

### Paso 3: Configurar Google Service Account
```
? What do you want to do? › 
  ❯ Google Service Account
    Push Notifications: FCM server key
    Keystore
    ...
```
**Selecciona:** `Google Service Account` (flecha arriba/abajo, Enter)

---

### Paso 4: Upload JSON
```
? What do you want to do? › 
  ❯ Upload a new JSON key
    Remove
    ...
```
**Selecciona:** `Upload a new JSON key` (Enter)

---

### Paso 5: Buscar el archivo
Te pedirá la ruta del archivo.

**Escribe:**
```
C:\Users\pablo\Downloads\app-trabajo-en-terreno-firebase-adminsdk-fbsvc-ae8baf4c1c.json
```

O navega usando el selector de archivos.

---

### Paso 6: Confirmar
```
✅ Google Service Account uploaded successfully
```

**Si aparece esto, presiona Ctrl+C para salir del menú.**

---

## Si aparece error de "path"

Copia el archivo a la carpeta del proyecto primero:

```powershell
Copy-Item "C:\Users\pablo\Downloads\app-trabajo-en-terreno-firebase-adminsdk-fbsvc-ae8baf4c1c.json" "C:\Users\pablo\OneDrive\Escritorio\Proyectos de Aplicaciones\App Trabajo en terreno 2.0\mobile\google-service-account.json"
```

Luego usa la ruta:
```
./google-service-account.json
```

---

**Después de subir exitosamente, continúa con la compilación del APK.**
