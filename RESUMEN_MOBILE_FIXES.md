# 📱 Resumen de Correcciones Mobile - v1.0.7

## ✅ **IMPLEMENTADO**

### **1. Contactos - Modal Arreglado ✅**
- **Problema:** El modal no se visualizaba correctamente
- **Solución:** Cambiado `maxHeight: '85%'` a `height: '85%'`
- **Estado:** ✅ FUNCIONAL

### **2. Contactos - Instituciones Vinculables ✅**
- **Nueva funcionalidad:** Botón "Mis Instituciones" en el header
- **Modal implementado:** 
  - Listar instituciones vinculadas (con opción de desvincular)
  - Listar todas las instituciones disponibles (con opción de vincular)
- **API endpoints usados:**
  - `usersAPI.getUserInstitutions()` - Obtener vinculadas
  - `institutionsAPI.getAll()` - Obtener todas
  - `usersAPI.linkInstitution(id)` - Vincular
  - `usersAPI.unlinkInstitution(id)` - Desvincular
- **Estado:** ✅ FUNCIONAL

### **3. Actividades - Instituciones en Picker ✅**
- **Problema:** Aparecía "Ninguna" aunque había instituciones
- **Solución:** 
  - Agregado `loadInstitutions()` que llama a `usersAPI.getUserInstitutions()`
  - El picker ahora muestra las instituciones vinculadas correctamente
- **Estado:** ✅ FUNCIONAL

### **4. Actividades - Edición con Doble Tap ✅**
- **Nueva funcionalidad:** Tocar dos veces rápidamente una actividad para editarla
- **Implementación:**
  - Estado `lastTap` para detectar doble tap
  - Función `handleDoubleTap()` con delay de 300ms
  - Función `handleEdit()` que carga datos de la actividad en el formulario
  - Modal distingue entre "Nueva Actividad" y "Editar Actividad"
- **Estado:** ✅ FUNCIONAL

### **5. Actividades - Fecha y Hora ✅**
- **Nuevos campos agregados:**
  - `scheduledDate` (formato: YYYY-MM-DD)
  - `scheduledTime` (formato: HH:MM)
- **Guardado:** Se combinan en formato ISO para enviar al backend
- **Estado:** ✅ FUNCIONAL (básico - ver mejoras pendientes)

---

## ⚠️ **PENDIENTE DE IMPLEMENTAR**

### **6. Tareas - Checkboxes (Checklist) ⏳**
**Funcionalidad en Web:**
- Crear ítems de checklist con texto
- Marcar/desmarcar ítems completados
- Eliminar ítems del checklist
- Persistencia en backend

**Lo que falta en Mobile:**
1. Agregar campo `checklist: []` al formData
2. Input para agregar nuevos ítems
3. Lista de ítems con checkboxes
4. Botón para eliminar ítems
5. Funciones:
   - `addChecklistItem()`
   - `removeChecklistItem(index)`
   - `handleToggleCheckItem(task, itemIndex)`

**Prioridad:** 🔥 ALTA

### **7. Calendario - Acceso desde Mobile ⏳**
**Opciones de implementación:**

#### **Opción A: Tab en barra inferior**
- Agregar icono de calendario en `src/navigation/AppNavigator.js`
- Crear `CalendarScreen.js`
- Usar librería: `react-native-calendars`
- Mostrar actividades con `scheduledDate`

#### **Opción B: Vista dentro de Actividades**
- Agregar tab "Calendario" junto a "Lista", "Pendientes", "Completadas"
- Usar `react-native-calendars`
- Implementar selección de fecha para crear actividad

**Funcionalidades requeridas:**
- Ver actividades en calendario
- Crear actividad seleccionando fecha
- Editar actividad al tocar en el calendario
- Indicadores visuales (pendiente/completada)

**Prioridad:** 🟡 MEDIA

### **8. Actividades - Mejoras en Fecha/Hora ⏳**
**Problemas actuales:**
- Input manual de fecha (propenso a errores)
- Input manual de hora (formato 24h puede confundir)

**Mejoras sugeridas:**
- **Date Picker nativo:**
  ```javascript
  import DateTimePicker from '@react-native-community/datetimepicker';
  ```
- **Separar en dos pickers:**
  - Uno para fecha
  - Uno para hora
- **Formato más amigable:**
  - Fecha: Selector con calendario visual
  - Hora: Selector con formato 12h (AM/PM) o 24h según preferencia

**Prioridad:** 🟢 BAJA (funciona pero no es óptimo)

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **Tareas Checklist (PRIORITARIO):**
- [ ] Leer estructura del checklist en `client/src/pages/Tasks.jsx`
- [ ] Agregar estado `checklist` y `newCheckItem` en TasksScreen
- [ ] Agregar sección "Checklist" en el modal
- [ ] Input para agregar nuevo ítem + botón
- [ ] Renderizar lista de ítems con checkboxes
- [ ] Implementar toggle de checkbox
- [ ] Implementar eliminar ítem
- [ ] Actualizar `handleSubmit()` para incluir checklist
- [ ] Agregar estilos para los checkboxes
- [ ] Probar crear tarea con checklist
- [ ] Probar marcar/desmarcar ítems
- [ ] Probar eliminar ítems

### **Calendario:**
- [ ] Decidir: ¿Tab independiente o dentro de Actividades?
- [ ] Instalar `react-native-calendars`
- [ ] Crear CalendarScreen o vista calendario
- [ ] Cargar actividades con `scheduledDate`
- [ ] Renderizar marcadores en fechas con actividades
- [ ] Implementar onDayPress para crear/ver actividad
- [ ] Agregar leyenda de colores (pendiente/completada)
- [ ] Testear navegación y funcionalidad

### **Mejoras Fecha/Hora:**
- [ ] Instalar `@react-native-community/datetimepicker`
- [ ] Reemplazar TextInput de fecha por DateTimePicker
- [ ] Reemplazar TextInput de hora por DateTimePicker
- [ ] Ajustar formatos de fecha/hora
- [ ] Validar guardado correcto

---

## 🔧 **INSTRUCCIONES DE IMPLEMENTACIÓN**

### **Para Tareas con Checklist:**

1. **Actualizar TasksScreen.js:**
```javascript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  priority: 'media',
  checklist: [],  // ← AGREGAR
  // ...
});
const [newCheckItem, setNewCheckItem] = useState('');  // ← AGREGAR

// Función para agregar ítem
const addChecklistItem = () => {
  if (newCheckItem.trim()) {
    setFormData({
      ...formData,
      checklist: [...formData.checklist, { text: newCheckItem.trim(), completed: false }]
    });
    setNewCheckItem('');
  }
};

// Función para eliminar ítem
const removeChecklistItem = (index) => {
  setFormData({
    ...formData,
    checklist: formData.checklist.filter((_, i) => i !== index)
  });
};

// Función para toggle de ítem (en tarea ya creada)
const handleToggleCheckItem = async (task, itemIndex) => {
  try {
    const updatedChecklist = [...task.checklist];
    updatedChecklist[itemIndex] = {
      ...updatedChecklist[itemIndex],
      completed: !updatedChecklist[itemIndex].completed
    };
    await tasksAPI.update(task._id, { checklist: updatedChecklist });
    loadTasks();
  } catch (error) {
    Alert.alert('Error', 'No se pudo actualizar el checklist');
  }
};
```

2. **Agregar UI en el Modal:**
```javascript
{/* Después de descripción */}
<Text style={styles.label}>Checklist</Text>
<View style={styles.checklistContainer}>
  <View style={styles.checklistInputRow}>
    <TextInput
      style={[styles.input, { flex: 1, marginBottom: 0 }]}
      value={newCheckItem}
      onChangeText={setNewCheckItem}
      placeholder="Agregar ítem..."
      onSubmitEditing={addChecklistItem}
    />
    <TouchableOpacity 
      style={styles.addCheckButton}
      onPress={addChecklistItem}
    >
      <Ionicons name="add" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
  
  {formData.checklist.map((item, index) => (
    <View key={index} style={styles.checklistItem}>
      <TouchableOpacity 
        style={styles.checkbox}
        onPress={() => {
          const updated = [...formData.checklist];
          updated[index].completed = !updated[index].completed;
          setFormData({ ...formData, checklist: updated });
        }}
      >
        {item.completed && <Ionicons name="checkmark" size={18} color="#3b82f6" />}
      </TouchableOpacity>
      <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>
        {item.text}
      </Text>
      <TouchableOpacity onPress={() => removeChecklistItem(index)}>
        <Ionicons name="close-circle" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  ))}
</View>
```

3. **Agregar estilos:**
```javascript
checklistContainer: {
  marginBottom: 16,
},
checklistInputRow: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 12,
},
addCheckButton: {
  backgroundColor: '#3b82f6',
  width: 48,
  height: 48,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
checklistItem: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f9fafb',
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
  gap: 12,
},
checkbox: {
  width: 24,
  height: 24,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: '#3b82f6',
  justifyContent: 'center',
  alignItems: 'center',
},
checklistText: {
  flex: 1,
  fontSize: 14,
  color: '#1f2937',
},
checklistTextCompleted: {
  textDecorationLine: 'line-through',
  color: '#9ca3af',
},
```

### **Para Calendario (Opción más simple - Vista en Actividades):**

1. **Instalar librería:**
```bash
npm install react-native-calendars
```

2. **Agregar vista Calendario en ActivitiesScreen:**
```javascript
import { Calendar } from 'react-native-calendars';

// En el estado
const [viewMode, setViewMode] = useState('list'); // agregar 'calendar'

// En el JSX
{viewMode === 'calendar' && (
  <Calendar
    markedDates={getMarkedDates()}
    onDayPress={(day) => {
      setFormData({ ...formData, scheduledDate: day.dateString });
      setModalVisible(true);
    }}
    theme={{
      todayTextColor: '#3b82f6',
      selectedDayBackgroundColor: '#3b82f6',
    }}
  />
)}

// Función helper
const getMarkedDates = () => {
  const marked = {};
  filteredActivities.forEach(activity => {
    if (activity.scheduledDate) {
      const date = activity.scheduledDate.split('T')[0];
      marked[date] = {
        marked: true,
        dotColor: activity.status === 'completada' ? '#10b981' : '#f59e0b'
      };
    }
  });
  return marked;
};
```

---

## 🚀 **SIGUIENTE APK: v1.0.7**

**Incluirá:**
- ✅ Modal de contactos arreglado
- ✅ Instituciones vinculables
- ✅ Actividades editables (doble tap)
- ✅ Fecha y hora en actividades
- ✅ Picker de instituciones funcional
- ⏳ **FALTA:** Checklist en tareas
- ⏳ **FALTA:** Calendario

**Para generar APK después de implementar checklist y calendario:**
```bash
cd mobile
set EAS_NO_VCS=1 && eas build -p android --profile preview
```

---

## 📊 **Estado General**

| Funcionalidad | Web | Mobile Actual | Mobile Target |
|---------------|-----|---------------|---------------|
| Contactos - Modal | ✅ | ✅ | ✅ |
| Contactos - Instituciones | ✅ | ✅ | ✅ |
| Actividades - Editar | ✅ | ✅ | ✅ |
| Actividades - Fecha/Hora | ✅ | ✅⚠️ | ✅ (mejorar UI) |
| Actividades - Instituciones | ✅ | ✅ | ✅ |
| Actividades - Calendario | ✅ | ❌ | ⏳ |
| Tareas - Checklist | ✅ | ❌ | ⏳ |

**Leyenda:**
- ✅ Implementado y funcional
- ✅⚠️ Implementado pero mejorable
- ⏳ En progreso / Pendiente
- ❌ No implementado

---

**Última actualización:** 2025-10-06 16:37:00
**Versión actual:** 1.0.6
**Próxima versión:** 1.0.7 (con checklist y calendario)
