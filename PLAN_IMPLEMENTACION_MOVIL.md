# 📱 Plan de Implementación - App Móvil

## ✅ Mejoras a Implementar

### 1. **ActivitiesScreen.js** 
- [ ] Rango de días (fecha inicio - fecha fin)
- [ ] Calendario en español
- [ ] Selector de 10 colores para actividades

### 2. **TasksScreen.js**
- [ ] Contador de días y horas (con colores)
- [ ] Filtro por institución
- [ ] Filtro por usuario compartido

### 3. **ComplaintsScreen.js**
- [ ] Contador de días y horas (con colores)

### 4. **RawMaterialsScreen.js** (NUEVO)
- [ ] Nueva pantalla para Fichas Técnicas
- [ ] Navegación por categorías
- [ ] Ver PDFs
- [ ] Descargar PDFs

### 5. **Navigation**
- [ ] Agregar ruta a Fichas Técnicas

---

## 🎨 Colores para Actividades (10 colores)

```javascript
const ACTIVITY_COLORS = [
  { name: 'Azul', hex: '#3b82f6', dot: 'blue' },
  { name: 'Verde', hex: '#10b981', dot: 'green' },
  { name: 'Rojo', hex: '#ef4444', dot: 'red' },
  { name: 'Amarillo', hex: '#f59e0b', dot: 'yellow' },
  { name: 'Morado', hex: '#8b5cf6', dot: 'purple' },
  { name: 'Rosa', hex: '#ec4899', dot: 'pink' },
  { name: 'Naranja', hex: '#f97316', dot: 'orange' },
  { name: 'Cian', hex: '#06b6d4', dot: 'cyan' },
  { name: 'Índigo', hex: '#6366f1', dot: 'indigo' },
  { name: 'Teal', hex: '#14b8a6', dot: 'teal' }
];
```

---

## ⏱️ Contador de Tiempo (Colores)

```javascript
const getTimeElapsedColor = (days) => {
  if (days <= 2) return '#10b981'; // Verde
  if (days <= 15) return '#f59e0b'; // Amarillo
  if (days <= 30) return '#f97316'; // Naranja
  return '#ef4444'; // Rojo
};
```

---

## 🌍 Calendario en Español

```javascript
import { LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';
```

---

## 📁 Estructura de Archivos

```
mobile/src/
├── screens/
│   ├── ActivitiesScreen.js ✏️ (Modificar)
│   ├── TasksScreen.js ✏️ (Modificar)
│   ├── ComplaintsScreen.js ✏️ (Modificar)
│   └── RawMaterialsScreen.js ✨ (Crear)
├── navigation/
│   └── AppNavigator.js ✏️ (Modificar)
└── config/
    └── api.js ✏️ (Agregar rawMaterialsAPI)
```

---

## 🔄 Orden de Implementación

1. ✅ Crear PLAN_IMPLEMENTACION_MOVIL.md
2. Actualizar ActivitiesScreen.js (rango, español, colores)
3. Actualizar TasksScreen.js (contador, filtros)
4. Actualizar ComplaintsScreen.js (contador)
5. Crear RawMaterialsScreen.js
6. Actualizar AppNavigator.js
7. Actualizar api.js
8. Testing y ajustes

---

## ⏰ Tiempo Estimado

- **ActivitiesScreen:** ~30 min
- **TasksScreen:** ~20 min
- **ComplaintsScreen:** ~15 min
- **RawMaterialsScreen:** ~45 min
- **Navigation:** ~10 min
- **Testing:** ~20 min

**Total:** ~2.5 horas de implementación
