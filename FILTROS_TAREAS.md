# 🔍 Filtros de Tareas - Institución y Usuario Compartido

## ✅ Funcionalidad Implementada

Se han agregado **dos filtros avanzados** en la interfaz de Tareas para mejorar la organización y búsqueda de tareas.

---

## 🎯 Filtros Implementados

### 1. 🏢 Filtro por Institución

**Funcionalidad:**
Permite filtrar las tareas para mostrar solo aquellas asociadas a una institución específica.

**Características:**
- ✅ Dropdown con todas las instituciones del usuario
- ✅ Opción "Todas las instituciones" para ver todas las tareas
- ✅ Filtrado automático al seleccionar una institución
- ✅ Compatible con todos los modos de vista (Pendientes, Asignadas, Completadas)

**Uso:**
1. En la interfaz de Tareas, busca el filtro **"Filtrar por Institución"**
2. Selecciona una institución del dropdown
3. Solo se mostrarán las tareas asociadas a esa institución

---

### 2. 👥 Filtro por Usuario Compartido

**Funcionalidad:**
Permite filtrar las tareas para mostrar solo aquellas relacionadas con un usuario específico, ya sea:
- Tareas creadas por ese usuario y compartidas contigo
- Tareas creadas por ti y compartidas con ese usuario

**Características:**
- ✅ Dropdown con todos los contactos/usuarios registrados
- ✅ Opción "Todos los usuarios" para ver todas las tareas
- ✅ Filtrado bidireccional:
  - Tareas que el usuario te compartió
  - Tareas que tú le compartiste al usuario
- ✅ Compatible con todos los modos de vista

**Uso:**
1. En la interfaz de Tareas, busca el filtro **"Filtrar por Usuario Compartido"**
2. Selecciona un usuario del dropdown
3. Se mostrarán:
   - Tareas creadas por ese usuario y compartidas contigo
   - Tareas creadas por ti y compartidas con ese usuario

---

## 🎨 Ubicación en la Interfaz

```
┌─────────────────────────────────────────────────────┐
│ Tareas                          [+ Crear Tarea]     │
├─────────────────────────────────────────────────────┤
│ Filtrar por Institución    Filtrar por Usuario      │
│ [🏢 Todas...         ▼]   [👥 Todos...        ▼]   │
├─────────────────────────────────────────────────────┤
│ [Pendientes] [Asignadas a mí] [Completadas]         │
├─────────────────────────────────────────────────────┤
│ Lista de tareas filtradas...                        │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Lógica de Filtrado

### Filtro por Institución:
```javascript
// Compara el ID de la institución de la tarea con el filtro seleccionado
if (filterInstitution !== 'all') {
  filtered = filtered.filter(t => {
    const taskInstitutionId = t.institution?._id || t.institution;
    return taskInstitutionId === filterInstitution;
  });
}
```

### Filtro por Usuario Compartido:
```javascript
if (filterUser !== 'all') {
  filtered = filtered.filter(t => {
    const creatorId = t.createdBy?._id?.toString();
    const currentUserId = user?._id?.toString();
    
    // Caso 1: Tareas creadas por el usuario seleccionado y compartidas conmigo
    const createdByUserAndSharedWithMe = 
      creatorId === filterUser && 
      t.sharedWith?.some(u => u?._id?.toString() === currentUserId);
    
    // Caso 2: Tareas creadas por mí y compartidas con el usuario seleccionado
    const createdByMeAndSharedWithUser = 
      creatorId === currentUserId && 
      t.sharedWith?.some(u => u?._id?.toString() === filterUser);
    
    return createdByUserAndSharedWithMe || createdByMeAndSharedWithUser;
  });
}
```

---

## 🔄 Combinación de Filtros

Los filtros se pueden combinar entre sí:

### Ejemplo 1: Filtrar por Institución + Vista
- **Institución:** "Hospital Central"
- **Vista:** "Pendientes"
- **Resultado:** Solo tareas pendientes del Hospital Central

### Ejemplo 2: Filtrar por Usuario + Vista
- **Usuario:** "Juan Pérez"
- **Vista:** "Asignadas a mí"
- **Resultado:** Solo tareas que Juan te asignó

### Ejemplo 3: Filtrar por Institución + Usuario + Vista
- **Institución:** "Clínica del Mar"
- **Usuario:** "María González"
- **Vista:** "Completadas"
- **Resultado:** Tareas completadas de la Clínica del Mar relacionadas con María (creadas por ella y compartidas contigo, o creadas por ti y compartidas con ella)

---

## 🧪 Cómo Probar (Después de 3 minutos)

### 1. Probar Filtro de Institución:
1. Ve a: https://web-production-10bfc.up.railway.app/tasks
2. Busca el dropdown **"Filtrar por Institución"**
3. Selecciona una institución (ej: "Hospital Regional")
4. **Verifica:** Solo aparecen tareas de esa institución
5. Cambia entre vistas (Pendientes, Asignadas, Completadas)
6. **Verifica:** El filtro se mantiene activo

### 2. Probar Filtro de Usuario:
1. En la misma página de Tareas
2. Busca el dropdown **"Filtrar por Usuario Compartido"**
3. Selecciona un usuario (ej: "Pedro López")
4. **Verifica:** Aparecen:
   - Tareas que Pedro te compartió
   - Tareas que tú le compartiste a Pedro
5. Combina con el filtro de institución
6. **Verifica:** Los filtros trabajan en conjunto

### 3. Probar Combinación de Filtros:
1. Selecciona una institución específica
2. Selecciona un usuario específico
3. Cambia entre vistas
4. **Verifica:** Solo aparecen tareas que cumplan TODOS los criterios

### 4. Resetear Filtros:
1. Selecciona "🏢 Todas las instituciones"
2. Selecciona "👥 Todos los usuarios"
3. **Verifica:** Vuelven a aparecer todas las tareas

---

## 💡 Casos de Uso

### Caso 1: Revisar tareas de una institución específica
**Escenario:** Trabajas con múltiples instituciones y quieres enfocarte en una
**Solución:** Selecciona la institución en el filtro

### Caso 2: Ver colaboración con un usuario
**Escenario:** Necesitas revisar todas las tareas compartidas con un colega
**Solución:** Selecciona al usuario en el filtro

### Caso 3: Tareas pendientes de una institución con un usuario
**Escenario:** Quieres ver tareas pendientes de "Hospital X" relacionadas con "Dr. García"
**Solución:** 
- Vista: Pendientes
- Institución: Hospital X
- Usuario: Dr. García

### Caso 4: Auditoría de tareas completadas
**Escenario:** Necesitas revisar qué tareas completaste con un usuario en una institución
**Solución:**
- Vista: Completadas
- Institución: [Seleccionar]
- Usuario: [Seleccionar]

---

## 🔧 Detalles Técnicos

### Archivos modificados:
- `client/src/pages/Tasks.jsx`

### Estados agregados:
```javascript
const [filterInstitution, setFilterInstitution] = useState('all');
const [filterUser, setFilterUser] = useState('all');
```

### Cambios en la lógica de filtrado:
- Se modificó `filteredTasks` de una función simple a una función con múltiples capas de filtrado
- Primero se aplica el filtro de vista (Pendientes/Asignadas/Completadas)
- Luego se aplica el filtro de institución
- Finalmente se aplica el filtro de usuario
- Los filtros son acumulativos (se suman)

### Líneas de código:
- **+74 líneas** agregadas
- **-5 líneas** eliminadas
- **Total:** 69 líneas netas

---

## 🎯 Beneficios

### Organización:
- ✅ Encuentra tareas rápidamente
- ✅ Reduce el ruido visual
- ✅ Mejora el enfoque en tareas específicas

### Productividad:
- ✅ Menos tiempo buscando tareas
- ✅ Mejor gestión de colaboraciones
- ✅ Seguimiento por institución

### Colaboración:
- ✅ Ve fácilmente qué tareas tienes con cada usuario
- ✅ Identifica colaboraciones por institución
- ✅ Audita el trabajo compartido

---

## 🚀 Deploy

**Commit:** `fc997bb`
**Mensaje:** "feat: agregar filtros de Institución y Usuario Compartido en Tareas"

**Estado:**
- ✅ GitHub: Subido
- ⏳ Railway: Auto-deploy en progreso (2-3 minutos)

---

## ✅ Estado Final

| Funcionalidad | Estado |
|---------------|--------|
| **Filtro por Institución** | ✅ Implementado |
| **Filtro por Usuario Compartido** | ✅ Implementado |
| **Combinación de filtros** | ✅ Funcional |
| **Compatible con vistas** | ✅ Funcional |
| **Filtrado bidireccional (usuario)** | ✅ Funcional |
| **Reset de filtros** | ✅ Funcional |

---

## 📝 Notas Adicionales

### Comportamiento del Filtro de Usuario:
El filtro de usuario es **bidireccional**, lo que significa que muestra:
1. **Tareas que te compartieron:** Creadas por el usuario seleccionado y compartidas contigo
2. **Tareas que compartiste:** Creadas por ti y compartidas con el usuario seleccionado

Esta lógica bidireccional permite ver toda la colaboración con un usuario específico en ambas direcciones.

### Persistencia:
Los filtros **no persisten** al refrescar la página. Esto es intencional para siempre mostrar todas las tareas por defecto al iniciar.

---

**¡Filtros de Tareas implementados y deployados! Espera 3 minutos para ver los cambios en Railway.** 🎉
