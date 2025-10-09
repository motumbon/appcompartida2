# 🔧 Solución: Error al Subir Contratos

## ❌ Problema Identificado

**Error:** `ERR_CONNECTION_RESET` al subir archivo Excel de contratos en la web

**Causa Raíz:**
- Railway tiene un **límite de 30 segundos** de timeout por request
- Railway tiene un **límite de ~10MB** por request body en el plan gratuito/hobby
- El procesamiento de archivos Excel grandes tarda más de 30 segundos
- La conexión se cierra antes de que el servidor termine de procesar

## ✅ Soluciones Implementadas

### 1. **Timeout Aumentado en el Servidor**

Agregado en `server/index.js`:
```javascript
// Aumentar timeout para uploads de archivos grandes (5 minutos)
server.timeout = 300000; // 5 minutos
server.keepAliveTimeout = 65000; // 65 segundos
server.headersTimeout = 66000; // 66 segundos
```

**Efecto:**
- El servidor ahora espera hasta 5 minutos para procesar el archivo
- No cierra la conexión prematuramente

### 2. **Logging Detallado**

Agregado en `server/routes/contracts.js`:
- Logs de tiempo de procesamiento en cada fase
- Logs de tamaño de archivo
- Logs de errores más descriptivos

**Ejemplo de logs:**
```
📄 Iniciando upload de contratos - Archivo: contratos.xlsx, Tamaño: 3.45MB
⏱️ [120ms] Archivo recibido, procesando...
⏱️ [450ms] Leyendo Excel...
⏱️ [890ms] Excel leído, 3 hojas
⏱️ [1200ms] Items mapeados: 5432
⏱️ [1350ms] Items filtrados: 5123 (excluidos: 309)
⏱️ [1450ms] Eliminando contratos anteriores...
⏱️ [2100ms] Contratos anteriores eliminados
⏱️ [2150ms] Dividiendo 5123 items en 6 chunks
⏱️ [3200ms] Chunk 1/6 guardado con 1000 items
...
✅ Upload completado en 12340ms (12.34s)
```

### 3. **Respuesta con Estadísticas**

El endpoint ahora devuelve:
```json
{
  "message": "Contratos actualizados exitosamente",
  "contract": {...},
  "stats": {
    "totalItems": 5123,
    "processingTime": "12.34s",
    "chunks": 6
  }
}
```

## 🚀 Deployment

### Opción 1: Railway Auto-Deploy (Si está conectado a Git)

```bash
git add .
git commit -m "fix: aumentar timeout y mejorar logs para upload de contratos"
git push origin main
```

Railway detectará el push y desplegará automáticamente.

### Opción 2: Deploy Manual en Railway

1. **Railway Dashboard** → Tu proyecto
2. **"Deploy"** → **"Redeploy"**
3. Esperar 2-3 minutos

### Opción 3: Copiar Código Manualmente

Si no tienes Git, copia los cambios de estos archivos a Railway:
- `server/index.js` (líneas 190-211)
- `server/routes/contracts.js` (todo el archivo)

## 🧪 Testing

### Test 1: Archivo Pequeño (< 1MB)
1. Subir archivo Excel pequeño
2. Debería completarse en < 5 segundos
3. ✅ Verificar que aparezcan los contratos

### Test 2: Archivo Mediano (1-5MB)
1. Subir archivo Excel mediano
2. Debería completarse en 10-30 segundos
3. ✅ Verificar estadísticas en la respuesta

### Test 3: Archivo Grande (5-10MB)
1. Subir archivo Excel grande
2. Puede tardar 30-120 segundos
3. ✅ Ahora debería completarse sin error

## 📊 Límites de Railway

| Plan | Request Timeout | Body Size | Recomendación |
|------|----------------|-----------|---------------|
| **Free/Hobby** | 30s (sin config) | ~10MB | Archivos < 5MB |
| **Pro** | Configurable | ~50MB | Archivos < 20MB |

## ⚠️ Limitaciones Actuales

**Aunque aumentamos el timeout del servidor a 5 minutos, Railway puede seguir cerrando la conexión a los 30 segundos en el plan gratuito.**

### Soluciones Alternativas si el Problema Persiste:

#### Opción A: Reducir Tamaño del Archivo Excel

**Antes de subir:**
1. Abrir Excel
2. Filtrar solo datos necesarios
3. Eliminar columnas no usadas
4. Guardar como nuevo archivo

**Objetivo:** Archivo < 3MB

#### Opción B: Dividir el Archivo

Si tienes muchos contratos:
1. Dividir Excel en 2 archivos más pequeños
2. Subir primero la mitad
3. Luego subir la otra mitad (esto sobrescribirá, así que no es ideal)

#### Opción C: Optimizar Datos en Excel

1. Eliminar filas vacías
2. Eliminar hojas no usadas
3. Remover formatos complejos
4. Guardar como `.xlsx` (no `.xls`)

#### Opción D: Upgrade a Railway Pro

**Railway Pro ($20/mes):**
- Timeout configurable (hasta 10 minutos)
- Body size hasta 50MB
- Más CPU y RAM
- Procesamiento más rápido

**Configuración en Railway Pro:**
```bash
# En railway.toml o variables de entorno
RAILWAY_TIMEOUT=600  # 10 minutos
```

## 📝 Logs del Backend

### Ver logs en Railway:

1. **Railway Dashboard** → Tu proyecto
2. **"View Logs"**
3. Buscar líneas como:
   ```
   📄 Iniciando upload de contratos...
   ✅ Upload completado en XXXms
   ```

### Si ves error de timeout:

```
❌ Error al procesar archivo (tiempo: 30000ms): timeout
```

**Significa:** Railway cerró la conexión a los 30 segundos

**Solución:** Reducir tamaño del archivo o upgrade a Pro

## 🎯 Checklist de Verificación

### Después del Deploy:

- [ ] Servidor reiniciado en Railway
- [ ] Logs muestran: "⏱️ Timeouts configurados"
- [ ] Test con archivo pequeño (< 1MB) funciona
- [ ] Test con archivo mediano (1-3MB) funciona
- [ ] Ver logs detallados en Railway

### Si persiste el error:

- [ ] Verificar tamaño del archivo Excel
- [ ] Intentar con archivo más pequeño
- [ ] Verificar que el archivo no esté corrupto
- [ ] Verificar conexión a internet estable
- [ ] Considerar upgrade a Railway Pro

## 💡 Tips para Optimizar Upload

### 1. Preparar Excel Correctamente

✅ **Hacer:**
- Mantener solo hoja "DDBB"
- Eliminar filas vacías al final
- Eliminar columnas no usadas
- Formato simple (sin colores/bordes complejos)

❌ **Evitar:**
- Múltiples hojas innecesarias
- Fórmulas complejas
- Imágenes/gráficos en el archivo
- Formato `.xls` (usar `.xlsx`)

### 2. Verificar Tamaño Antes de Subir

**En Windows:**
1. Click derecho en el archivo
2. "Propiedades"
3. Ver "Tamaño"

**Ideal:** < 3MB
**Máximo recomendado:** 5MB
**Límite técnico:** 50MB (pero Railway puede cerrar conexión)

### 3. Comprimir si es Muy Grande

```bash
# Usar 7-Zip o WinRAR
# Comprimir como .zip
# Railway puede manejar archivos comprimidos
```

(Pero necesitarías modificar el endpoint para descomprimir primero)

## 🆘 Troubleshooting

### Error: "El archivo es demasiado grande"

**Causa:** Archivo > 50MB

**Solución:**
1. Reducir número de filas
2. Eliminar columnas no necesarias
3. Dividir en múltiples archivos

### Error: "El procesamiento tardó demasiado"

**Causa:** Procesamiento > 30 segundos (Railway free)

**Solución:**
1. Reducir tamaño del archivo
2. Optimizar Excel (eliminar filas/columnas vacías)
3. Upgrade a Railway Pro

### Error: "Network Error" o "ERR_CONNECTION_RESET"

**Causa:** Railway cerró la conexión

**Solución:**
1. Verificar que el deploy se completó
2. Verificar logs del servidor
3. Intentar con archivo más pequeño
4. Verificar conexión a internet

### Error: "No se encontró la hoja DDBB"

**Causa:** El archivo Excel no tiene hoja llamada "DDBB"

**Solución:**
1. Abrir Excel
2. Verificar que existe hoja "DDBB"
3. Renombrar hoja si tiene otro nombre

## 📈 Métricas de Performance

### Tiempos Esperados (aprox):

| Filas | Tamaño | Tiempo Procesamiento |
|-------|--------|---------------------|
| 100 | < 100KB | 1-2 segundos |
| 500 | 200-500KB | 3-5 segundos |
| 1000 | 500KB-1MB | 5-10 segundos |
| 5000 | 2-5MB | 15-30 segundos |
| 10000+ | 5-10MB | 30-120 segundos ⚠️ |

**⚠️ Nota:** Con Railway free, procesos > 30s pueden fallar

## ✅ Resultado Esperado

Después del deploy:

1. **Archivos pequeños (< 3MB):**
   - ✅ Funcionan perfectamente
   - ⏱️ Completan en < 20 segundos

2. **Archivos medianos (3-5MB):**
   - ✅ Deberían funcionar
   - ⏱️ Pueden tardar 20-40 segundos
   - ⚠️ Pueden fallar en Railway free si tardan > 30s

3. **Archivos grandes (> 5MB):**
   - ⚠️ Pueden fallar en Railway free
   - ✅ Funcionan en Railway Pro
   - ⏱️ Pueden tardar 1-2 minutos

## 🎉 Mejoras Implementadas

1. ✅ **Timeout aumentado** (5 minutos vs 30 segundos)
2. ✅ **Logs detallados** con tiempos de cada fase
3. ✅ **Mejor manejo de errores** con mensajes claros
4. ✅ **Estadísticas en respuesta** (items, tiempo, chunks)
5. ✅ **Optimización de procesamiento**

---

**Versión:** 1.0
**Fecha:** 2025-10-08
**Estado:** ✅ **IMPLEMENTADO - LISTO PARA DEPLOY**
**Prioridad:** 🔴 **ALTA**

**Si el problema persiste después del deploy, considera reducir el tamaño del archivo Excel o upgrade a Railway Pro.**
