import moment from 'moment';

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {string} createdAt - Fecha de creación
 * @returns {{days: number, hours: number}} - Días y horas transcurridas
 */
export const getTimeElapsed = (createdAt) => {
  if (!createdAt) return { days: 0, hours: 0 };
  
  const now = moment();
  const created = moment(createdAt);
  const days = now.diff(created, 'days');
  const hours = now.diff(created, 'hours') % 24;
  
  return { days, hours };
};

/**
 * Obtiene el color según los días transcurridos
 * @param {number} days - Días transcurridos
 * @returns {string} - Color hexadecimal
 */
export const getTimeElapsedColor = (days) => {
  if (days <= 2) return '#10b981'; // Verde
  if (days <= 15) return '#f59e0b'; // Amarillo
  if (days <= 30) return '#f97316'; // Naranja
  return '#ef4444'; // Rojo
};

/**
 * Obtiene el color de fondo según los días transcurridos
 * @param {number} days - Días transcurridos
 * @returns {string} - Color hexadecimal
 */
export const getTimeElapsedBgColor = (days) => {
  if (days <= 2) return '#d1fae5'; // Verde claro
  if (days <= 15) return '#fef3c7'; // Amarillo claro
  if (days <= 30) return '#ffedd5'; // Naranja claro
  return '#fee2e2'; // Rojo claro
};
