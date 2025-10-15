// 🎨 Colores para actividades (mismos que en la web)
export const ACTIVITY_COLORS = [
  { id: 'blue', name: 'Azul', hex: '#3b82f6', dotColor: 'blue' },
  { id: 'green', name: 'Verde', hex: '#10b981', dotColor: 'green' },
  { id: 'red', name: 'Rojo', hex: '#ef4444', dotColor: 'red' },
  { id: 'yellow', name: 'Amarillo', hex: '#f59e0b', dotColor: 'yellow' },
  { id: 'purple', name: 'Morado', hex: '#8b5cf6', dotColor: 'purple' },
  { id: 'pink', name: 'Rosa', hex: '#ec4899', dotColor: 'pink' },
  { id: 'orange', name: 'Naranja', hex: '#f97316', dotColor: 'orange' },
  { id: 'cyan', name: 'Cian', hex: '#06b6d4', dotColor: 'cyan' },
  { id: 'indigo', name: 'Índigo', hex: '#6366f1', dotColor: 'indigo' },
  { id: 'teal', name: 'Teal', hex: '#14b8a6', dotColor: 'teal' }
];

export const getColorByName = (colorName) => {
  const color = ACTIVITY_COLORS.find(c => c.id === colorName);
  return color || ACTIVITY_COLORS[0]; // Azul por defecto
};
