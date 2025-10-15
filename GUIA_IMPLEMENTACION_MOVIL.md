# 📱 Guía de Implementación - App Móvil

## ✅ COMPLETADO - Archivos Base Creados

- ✅ `mobile/src/constants/activityColors.js` - 10 colores para actividades
- ✅ `mobile/src/utils/timeCounter.js` - Contador de tiempo con colores
- ✅ `mobile/src/config/calendarLocale.js` - Calendario en español
- ✅ `mobile/src/screens/RawMaterialsScreen.js` - Pantalla de Fichas Técnicas
- ✅ `mobile/src/config/api.js` - API para rawMaterials

---

## 🔄 PENDIENTE - Modificaciones a Archivos Existentes

### 1. TasksScreen.js - Agregar Contador y Filtros

**Ubicación:** `mobile/src/screens/TasksScreen.js`

#### Paso 1.1: Agregar imports (líneas 1-6)
```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, Modal, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // AGREGAR ESTA LÍNEA
import { tasksAPI, contactsAPI, institutionsAPI, usersAPI } from '../config/api'; // MODIFICAR: agregar usersAPI
import { useAuth } from '../contexts/AuthContext';
import { getTimeElapsed, getTimeElapsedColor, getTimeElapsedBgColor } from '../utils/timeCounter'; // AGREGAR ESTA LÍNEA
```

#### Paso 1.2: Agregar estados de filtro (después de línea 16)
```javascript
const [viewMode, setViewMode] = useState('pending'); // 'pending', 'completed', 'assigned'
const [filterInstitution, setFilterInstitution] = useState('all'); // AGREGAR
const [filterUser, setFilterUser] = useState('all'); // AGREGAR
const [userInstitutions, setUserInstitutions] = useState([]); // AGREGAR
```

#### Paso 1.3: Agregar carga de instituciones de usuario (después de loadInstitutions)
```javascript
const loadUserInstitutions = async () => {
  try {
    const response = await usersAPI.getUserInstitutions();
    setUserInstitutions(response.data);
  } catch (error) {
    console.error('Error al cargar instituciones del usuario:', error);
  }
};
```

#### Paso 1.4: Actualizar useEffect inicial (línea 30-34)
```javascript
useEffect(() => {
  loadTasks();
  loadContacts();
  loadInstitutions();
  loadUserInstitutions(); // AGREGAR ESTA LÍNEA
}, []);
```

#### Paso 1.5: Modificar función getFilteredTasks (líneas 243-256)
```javascript
const getFilteredTasks = () => {
  let filtered = tasks;

  // Filtro por modo de vista
  if (viewMode === 'pending') {
    filtered = filtered.filter(t => t.status === 'pendiente');
  } else if (viewMode === 'completed') {
    filtered = filtered.filter(t => t.status === 'completada');
  } else if (viewMode === 'assigned') {
    filtered = filtered.filter(t => isSharedWithMe(t));
  }

  // Filtro por institución
  if (filterInstitution !== 'all') {
    filtered = filtered.filter(t => {
      const taskInstitutionId = t.institution?._id || t.institution;
      return taskInstitutionId === filterInstitution;
    });
  }

  // Filtro por usuario compartido
  if (filterUser !== 'all') {
    filtered = filtered.filter(t => {
      const creatorId = (t.createdBy?._id || t.createdBy)?.toString();
      const currentUserId = (user?._id || user?.id)?.toString();
      
      // Tareas creadas por el usuario seleccionado y compartidas conmigo
      const createdByUserAndSharedWithMe = creatorId === filterUser && 
        t.sharedWith?.some(u => (u?._id || u)?.toString() === currentUserId);
      
      // Tareas creadas por mí y compartidas con el usuario seleccionado
      const createdByMeAndSharedWithUser = creatorId === currentUserId && 
        t.sharedWith?.some(u => (u?._id || u)?.toString() === filterUser);
      
      return createdByUserAndSharedWithMe || createdByMeAndSharedWithUser;
    });
  }

  return filtered;
};
```

#### Paso 1.6: Agregar funciones auxiliares para filtros
```javascript
// Obtener instituciones con tareas
const getInstitutionsWithTasks = () => {
  const institutionIds = new Set();
  const institutionsMap = new Map();
  
  tasks.forEach(task => {
    if (task.institution) {
      const instId = task.institution._id || task.institution;
      const instName = task.institution.name || userInstitutions.find(i => i._id === instId)?.name;
      if (instId && instName) {
        institutionIds.add(instId);
        institutionsMap.set(instId, { _id: instId, name: instName });
      }
    }
  });
  
  return Array.from(institutionsMap.values());
};

// Obtener usuarios con tareas compartidas
const getUsersWithSharedTasks = () => {
  const userIds = new Set();
  const usersMap = new Map();
  const currentUserId = (user?._id || user?.id)?.toString();
  
  tasks.forEach(task => {
    const creatorId = (task.createdBy?._id || task.createdBy)?.toString();
    
    // Si la tarea fue creada por otro usuario y compartida conmigo
    if (creatorId !== currentUserId && task.sharedWith?.some(u => (u?._id || u)?.toString() === currentUserId)) {
      const creator = task.createdBy;
      const creatorName = creator.username || creator.name;
      if (creatorId && creatorName) {
        userIds.add(creatorId);
        usersMap.set(creatorId, { _id: creatorId, name: creatorName });
      }
    }
    
    // Si la tarea fue creada por mí y compartida con otros
    if (creatorId === currentUserId && task.sharedWith && task.sharedWith.length > 0) {
      task.sharedWith.forEach(sharedUser => {
        const sharedUserId = (sharedUser?._id || sharedUser)?.toString();
        const sharedUserName = sharedUser.username || sharedUser.name;
        if (sharedUserId && sharedUserId !== currentUserId && sharedUserName) {
          userIds.add(sharedUserId);
          usersMap.set(sharedUserId, { _id: sharedUserId, name: sharedUserName });
        }
      });
    }
  });
  
  return Array.from(usersMap.values());
};
```

#### Paso 1.7: Agregar componente de filtros en el render (antes de la lista de tareas)
```javascript
{/* Filtros */}
<View style={styles.filtersContainer}>
  <Text style={styles.filtersTitle}>Filtros</Text>
  
  {/* Filtro por Institución */}
  <View style={styles.filterItem}>
    <Text style={styles.filterLabel}>Institución:</Text>
    <Picker
      selectedValue={filterInstitution}
      onValueChange={(value) => setFilterInstitution(value)}
      style={styles.picker}
    >
      <Picker.Item label="🏢 Todas las instituciones" value="all" />
      {getInstitutionsWithTasks().map((inst) => (
        <Picker.Item key={inst._id} label={inst.name} value={inst._id} />
      ))}
    </Picker>
  </View>

  {/* Filtro por Usuario */}
  <View style={styles.filterItem}>
    <Text style={styles.filterLabel}>Usuario Compartido:</Text>
    <Picker
      selectedValue={filterUser}
      onValueChange={(value) => setFilterUser(value)}
      style={styles.picker}
    >
      <Picker.Item label="👥 Todos los usuarios" value="all" />
      {getUsersWithSharedTasks().map((u) => (
        <Picker.Item key={u._id} label={u.name} value={u._id} />
      ))}
    </Picker>
  </View>
</View>
```

#### Paso 1.8: Agregar contador de tiempo en renderTask
Buscar donde se renderiza cada tarea y agregar:
```javascript
{/* Contador de tiempo */}
{task.createdAt && (() => {
  const { days, hours } = getTimeElapsed(task.createdAt);
  const bgColor = getTimeElapsedBgColor(days);
  const textColor = getTimeElapsedColor(days);
  return (
    <View style={[styles.timeCounter, { backgroundColor: bgColor }]}>
      <Ionicons name="time-outline" size={14} color={textColor} />
      <Text style={[styles.timeCounterText, { color: textColor }]}>
        {days}d {hours}h
      </Text>
    </View>
  );
})()}
```

#### Paso 1.9: Agregar estilos
```javascript
// Agregar al final de StyleSheet.create:
filtersContainer: {
  backgroundColor: '#fff',
  padding: 12,
  marginBottom: 8,
  borderRadius: 8,
  marginHorizontal: 16
},
filtersTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1e293b',
  marginBottom: 12
},
filterItem: {
  marginBottom: 12
},
filterLabel: {
  fontSize: 14,
  fontWeight: '500',
  color: '#64748b',
  marginBottom: 4
},
picker: {
  backgroundColor: '#f8fafc',
  borderRadius: 8
},
timeCounter: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  alignSelf: 'flex-start'
},
timeCounterText: {
  fontSize: 12,
  fontWeight: '600'
}
```

---

### 2. ComplaintsScreen.js - Agregar Contador

**Ubicación:** `mobile/src/screens/ComplaintsScreen.js`

#### Paso 2.1: Agregar import
```javascript
import { getTimeElapsed, getTimeElapsedColor, getTimeElapsedBgColor } from '../utils/timeCounter';
```

#### Paso 2.2: Agregar contador en el render de reclamos (igual que TasksScreen)
```javascript
{/* Contador de tiempo */}
{complaint.createdAt && (() => {
  const { days, hours } = getTimeElapsed(complaint.createdAt);
  const bgColor = getTimeElapsedBgColor(days);
  const textColor = getTimeElapsedColor(days);
  return (
    <View style={[styles.timeCounter, { backgroundColor: bgColor }]}>
      <Ionicons name="time-outline" size={14} color={textColor} />
      <Text style={[styles.timeCounterText, { color: textColor }]}>
        {days}d {hours}h
      </Text>
    </View>
  );
})()}
```

#### Paso 2.3: Agregar estilos (mismos que TasksScreen)

---

### 3. ActivitiesScreen.js - Rango de Días, Español y Colores

**Ubicación:** `mobile/src/screens/ActivitiesScreen.js`

#### Paso 3.1: Agregar imports
```javascript
import '../config/calendarLocale'; // AGREGAR: Configurar calendario en español
import { ACTIVITY_COLORS, getColorByName } from '../constants/activityColors'; // AGREGAR
import { Picker } from '@react-native-picker/picker'; // SI NO ESTÁ
```

#### Paso 3.2: Modificar estados del formulario (línea 26-34)
```javascript
const [formData, setFormData] = useState({
  subject: '',
  comment: '',
  status: 'pendiente',
  institution: '',
  sharedWith: [],
  scheduledDateStart: '', // CAMBIAR de scheduledDate
  scheduledDateEnd: '',   // AGREGAR
  scheduledTime: '',
  color: 'blue' // AGREGAR
});
```

#### Paso 3.3: Agregar estados para rango de fechas
```javascript
const [startDateDay, setStartDateDay] = useState('');
const [startDateMonth, setStartDateMonth] = useState('');
const [startDateYear, setStartDateYear] = useState('');
const [endDateDay, setEndDateDay] = useState('');
const [endDateMonth, setEndDateMonth] = useState('');
const [endDateYear, setEndDateYear] = useState('');
```

#### Paso 3.4: Actualizar useEffect para fechas
```javascript
// Fecha de inicio
useEffect(() => {
  if (startDateYear && startDateMonth && startDateDay) {
    const newDate = `${startDateYear}-${startDateMonth.padStart(2, '0')}-${startDateDay.padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, scheduledDateStart: newDate }));
  }
}, [startDateYear, startDateMonth, startDateDay]);

// Fecha de fin
useEffect(() => {
  if (endDateYear && endDateMonth && endDateDay) {
    const newDate = `${endDateYear}-${endDateMonth.padStart(2, '0')}-${endDateDay.padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, scheduledDateEnd: newDate }));
  }
}, [endDateYear, endDateMonth, endDateDay]);
```

#### Paso 3.5: Modificar handleSubmit para crear actividades en rango
```javascript
const handleSubmit = async () => {
  if (!formData.subject) {
    Alert.alert('Error', 'El asunto es requerido');
    return;
  }

  try {
    const baseData = {
      subject: formData.subject,
      comment: formData.comment,
      status: formData.status,
      institution: formData.institution || undefined,
      sharedWith: selectedUsers,
      color: formData.color || 'blue'
    };

    // Si hay rango de fechas, crear múltiples actividades
    if (formData.scheduledDateStart && formData.scheduledDateEnd && formData.scheduledTime) {
      const start = new Date(formData.scheduledDateStart);
      const end = new Date(formData.scheduledDateEnd);
      
      if (end < start) {
        Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }

      // Crear actividad para cada día del rango
      const promises = [];
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dataToSend = {
          ...baseData,
          scheduledDate: `${dateStr}T${formData.scheduledTime}`
        };
        promises.push(activitiesAPI.create(dataToSend));
      }

      await Promise.all(promises);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      Alert.alert('Éxito', `${days} actividades creadas correctamente`);
    } else if (formData.scheduledDateStart && formData.scheduledTime) {
      // Una sola actividad
      const dataToSend = {
        ...baseData,
        scheduledDate: `${formData.scheduledDateStart}T${formData.scheduledTime}`
      };
      
      if (editingActivity) {
        await activitiesAPI.update(editingActivity._id, dataToSend);
        Alert.alert('Éxito', 'Actividad actualizada correctamente');
      } else {
        await activitiesAPI.create(dataToSend);
        Alert.alert('Éxito', 'Actividad creada correctamente');
      }
    } else {
      Alert.alert('Error', 'Debes seleccionar al menos una fecha y hora');
      return;
    }
    
    handleCloseModal();
    loadActivities();
  } catch (error) {
    Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar la actividad');
  }
};
```

#### Paso 3.6: Agregar selector de color en el modal
```javascript
{/* Selector de Color */}
<Text style={styles.label}>Color</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
  {ACTIVITY_COLORS.map((color) => (
    <TouchableOpacity
      key={color.id}
      style={[
        styles.colorButton,
        { backgroundColor: color.hex },
        formData.color === color.id && styles.colorButtonSelected
      ]}
      onPress={() => setFormData({ ...formData, color: color.id })}
    >
      {formData.color === color.id && (
        <Ionicons name="checkmark" size={20} color="#fff" />
      )}
    </TouchableOpacity>
  ))}
</ScrollView>
```

#### Paso 3.7: Agregar pickers para rango de fechas en el modal
```javascript
{/* Fecha de Inicio */}
<Text style={styles.label}>Fecha de Inicio</Text>
<View style={styles.dateRow}>
  <Picker style={styles.datePicker} selectedValue={startDateDay} onValueChange={setStartDateDay}>
    <Picker.Item label="Día" value="" />
    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
      <Picker.Item key={day} label={String(day)} value={String(day)} />
    ))}
  </Picker>
  <Picker style={styles.datePicker} selectedValue={startDateMonth} onValueChange={setStartDateMonth}>
    <Picker.Item label="Mes" value="" />
    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
      <Picker.Item key={month} label={String(month)} value={String(month)} />
    ))}
  </Picker>
  <Picker style={styles.datePicker} selectedValue={startDateYear} onValueChange={setStartDateYear}>
    <Picker.Item label="Año" value="" />
    {[2024, 2025, 2026].map(year => (
      <Picker.Item key={year} label={String(year)} value={String(year)} />
    ))}
  </Picker>
</View>

{/* Fecha de Fin */}
<Text style={styles.label}>Fecha de Fin (opcional)</Text>
<View style={styles.dateRow}>
  <Picker style={styles.datePicker} selectedValue={endDateDay} onValueChange={setEndDateDay}>
    <Picker.Item label="Día" value="" />
    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
      <Picker.Item key={day} label={String(day)} value={String(day)} />
    ))}
  </Picker>
  <Picker style={styles.datePicker} selectedValue={endDateMonth} onValueChange={setEndDateMonth}>
    <Picker.Item label="Mes" value="" />
    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
      <Picker.Item key={month} label={String(month)} value={String(month)} />
    ))}
  </Picker>
  <Picker style={styles.datePicker} selectedValue={endDateYear} onValueChange={setEndDateYear}>
    <Picker.Item label="Año" value="" />
    {[2024, 2025, 2026].map(year => (
      <Picker.Item key={year} label={String(year)} value={String(year)} />
    ))}
  </Picker>
</View>
```

#### Paso 3.8: Modificar el Calendar para usar colores
```javascript
<Calendar
  markedDates={{
    ...activitiesMarkedDates,
    [selectedDate]: {
      ...activitiesMarkedDates[selectedDate],
      selected: true,
      selectedColor: '#3b82f6'
    }
  }}
  onDayPress={(day) => setSelectedDate(day.dateString)}
  theme={{
    todayTextColor: '#3b82f6',
    selectedDayBackgroundColor: '#3b82f6',
    dotColor: '#3b82f6',
    selectedDotColor: '#ffffff'
  }}
/>
```

#### Paso 3.9: Actualizar activitiesMarkedDates para usar colores
```javascript
const activitiesMarkedDates = {};
activitiesWithDates.forEach((activity) => {
  const dateStr = activity.scheduledDate.split('T')[0];
  const activityColor = getColorByName(activity.color || 'blue');
  
  if (!activitiesMarkedDates[dateStr]) {
    activitiesMarkedDates[dateStr] = { 
      dots: [],
      marked: true
    };
  }
  
  activitiesMarkedDates[dateStr].dots.push({
    color: activityColor.hex,
    selectedDotColor: activityColor.hex
  });
});
```

#### Paso 3.10: Agregar estilos
```javascript
colorScroll: {
  marginBottom: 12
},
colorButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  marginRight: 8,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: 'transparent'
},
colorButtonSelected: {
  borderColor: '#fff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4
}
```

---

### 4. Agregar Navegación para Fichas Técnicas

**Ubicación:** Buscar el archivo de navegación (probablemente `AppNavigator.js` o `MainNavigator.js`)

```javascript
// Importar la nueva pantalla
import RawMaterialsScreen from '../screens/RawMaterialsScreen';

// Agregar la ruta (dentro del Tab.Navigator o Stack.Navigator)
<Tab.Screen 
  name="RawMaterials" 
  component={RawMaterialsScreen}
  options={{
    title: 'Fichas Técnicas',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="flask" size={size} color={color} />
    )
  }}
/>
```

---

## 📦 Dependencias Necesarias

Asegúrate de tener instaladas estas dependencias:

```bash
cd mobile
npm install @react-native-picker/picker
npm install expo-file-system
npm install expo-sharing
npm install moment
```

---

## 🧪 Testing

Después de implementar todos los cambios:

1. **Actividades:**
   - [ ] Crear actividad con rango de días
   - [ ] Verificar calendario en español
   - [ ] Seleccionar diferentes colores
   - [ ] Verificar que se crean múltiples actividades

2. **Tareas:**
   - [ ] Verificar contador de tiempo
   - [ ] Filtrar por institución
   - [ ] Filtrar por usuario compartido

3. **Reclamos:**
   - [ ] Verificar contador de tiempo

4. **Fichas Técnicas:**
   - [ ] Navegar por categorías
   - [ ] Ver PDF
   - [ ] Descargar PDF

---

## 🚀 Próximos Pasos

1. Implementar cambios en TasksScreen.js (Paso 1)
2. Implementar cambios en ComplaintsScreen.js (Paso 2)
3. Implementar cambios en ActivitiesScreen.js (Paso 3)
4. Agregar navegación (Paso 4)
5. Instalar dependencias
6. Testing completo
7. Build y deploy

---

## 📝 Notas Importantes

- **Rango de Fechas:** Cuando el usuario selecciona un rango, se crean múltiples actividades (una por día)
- **Colores:** Los 10 colores son los mismos que en la web
- **Contador:** Verde (0-2d), Amarillo (3-15d), Naranja (15-30d), Rojo (+30d)
- **Filtros:** Solo muestran instituciones y usuarios con tareas existentes
- **PDFs:** Se descargan localmente y se pueden abrir con apps del sistema

---

¿Necesitas ayuda con algún paso específico? Avísame y te guío en detalle.
