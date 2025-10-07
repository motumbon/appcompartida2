# Guía de Diseño Responsivo - App Trabajo en Terreno

## 📱 Optimización para Tablets y Orientación

La aplicación ha sido optimizada para funcionar en:
- ✅ Smartphones (modo vertical y horizontal)
- ✅ Tablets (modo vertical y horizontal)
- ✅ Diferentes tamaños de pantalla

## 🔧 Cambios Implementados

### 1. Configuración Global (app.json)
```json
{
  "orientation": "default"  // Permite ambas orientaciones
}
```

### 2. Hook Responsivo (useResponsive.js)
Hook personalizado que detecta:
- **isLandscape**: Si está en modo horizontal
- **isTablet**: Si es una tablet (min 600px)
- **isSmallDevice**: Si es un dispositivo pequeño (<375px)
- **breakpoints**: xs, sm, md, lg
- **wp()**: Width percentage - ancho relativo
- **hp()**: Height percentage - alto relativo

### 3. Pantallas Optimizadas

#### ✅ LoginScreen
- Layout centrado y responsive
- Ancho máximo de 500px en tablets
- ScrollView para teclados pequeños
- Tipografías escalables

#### ✅ HomeScreen
- Grid de estadísticas adaptable
- Columnas en modo horizontal/tablets grandes
- Iconos y textos escalables
- Layout de 2 columnas en landscape

## 📐 Patrón de Implementación

### Paso 1: Importar el Hook
```javascript
import { useResponsive } from '../hooks/useResponsive';

export default function MyScreen() {
  const { isLandscape, isTablet, wp, hp } = useResponsive();
  // ...
}
```

### Paso 2: Adaptar Layout
```javascript
// Calcular si usar columnas
const useColumns = isLandscape || (isTablet && width > 900);

// Ancho del contenido
const contentWidth = isLandscape && isTablet ? wp(50) : isTablet ? wp(70) : '100%';
```

### Paso 3: Estilos Condicionales
```javascript
<View style={[styles.container, isTablet && styles.containerTablet]}>
  <Text style={[styles.title, isTablet && styles.titleTablet]}>
    Título
  </Text>
  <Ionicons size={isTablet ? 28 : 20} />
</View>
```

### Paso 4: Estilos Responsive
```javascript
const styles = StyleSheet.create({
  // Estilos base (móvil)
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
  },
  
  // Estilos para tablet
  containerTablet: {
    padding: 24,
  },
  titleTablet: {
    fontSize: 24,
  },
});
```

## 🎨 Recomendaciones de Diseño

### Tipografía
| Elemento | Móvil | Tablet |
|----------|-------|--------|
| Título principal | 24-28px | 32-36px |
| Subtítulo | 18-20px | 22-24px |
| Texto normal | 14-16px | 16-18px |
| Texto pequeño | 12px | 14px |

### Espaciado
| Elemento | Móvil | Tablet |
|----------|-------|--------|
| Padding contenedor | 16px | 24px |
| Padding botón | 15px | 18-20px |
| Margen entre elementos | 8-12px | 12-16px |

### Iconos
| Contexto | Móvil | Tablet |
|----------|-------|--------|
| Tab bar | 20-24px | 24-28px |
| Botones | 20px | 24-28px |
| Decorativos | 16-20px | 20-24px |

## 📱 Layout Patterns

### Pattern 1: Lista Simple
```javascript
<ScrollView style={styles.container}>
  <FlatList
    data={items}
    numColumns={isTablet && isLandscape ? 2 : 1}
    key={isTablet && isLandscape ? 'two-columns' : 'one-column'}
  />
</ScrollView>
```

### Pattern 2: Grid Adaptativo
```javascript
<View style={[
  styles.grid,
  useColumns && styles.gridColumns
]}>
  {/* Items del grid */}
</View>

// Estilos
gridColumns: {
  flexDirection: 'row',
  flexWrap: 'wrap',
}
```

### Pattern 3: Modal Centrado
```javascript
<Modal>
  <View style={styles.modalOverlay}>
    <View style={[
      styles.modalContent,
      { width: isTablet ? wp(60) : wp(90), maxWidth: 600 }
    ]}>
      {/* Contenido */}
    </View>
  </View>
</Modal>
```

### Pattern 4: Formularios
```javascript
<View style={[
  styles.formContainer,
  { width: isTablet ? wp(70) : '100%', maxWidth: 500 }
]}>
  <TextInput style={[styles.input, isTablet && styles.inputTablet]} />
</View>
```

## 🚀 Próximos Pasos

Las siguientes pantallas necesitan optimización:
- [ ] RegisterScreen
- [ ] ContactsScreen
- [ ] ActivitiesScreen
- [ ] TasksScreen
- [ ] ComplaintsScreen
- [ ] ContractsScreen
- [ ] StockScreen
- [ ] NotesScreen

## 🧪 Testing

### Cómo Probar
1. **Android Studio Emulator**: Cambiar orientación con Ctrl+F11
2. **Dispositivo físico**: Rotar el dispositivo
3. **Diferentes tamaños**: Probar en phone y tablet

### Checklist de Testing
- [ ] La app rota correctamente
- [ ] No hay contenido cortado
- [ ] Los textos son legibles
- [ ] Los botones son accesibles
- [ ] Las imágenes escalan correctamente
- [ ] Los modales se centran bien
- [ ] El keyboard no oculta campos importantes

## 📚 Referencias

- **React Native Dimensions**: https://reactnative.dev/docs/dimensions
- **React Native Responsive**: https://github.com/marudy/react-native-responsive-screen
- **Material Design Responsive**: https://material.io/design/layout/responsive-layout-grid.html

## 🔥 Tips

1. **Siempre usar ScrollView** en pantallas con contenido largo
2. **Usar maxWidth** para limitar el ancho en tablets grandes
3. **Centrar contenido** en tablets horizontales
4. **Aumentar touch targets** en tablets (min 44px)
5. **Probar en dispositivo real** siempre que sea posible
