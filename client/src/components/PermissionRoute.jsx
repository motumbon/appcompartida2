import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PermissionRoute = ({ children, permission }) => {
  const { user, isAdmin } = useAuth();

  console.log('PermissionRoute - Verificando permiso:', permission);
  console.log('Usuario:', user?.username);
  console.log('IsAdmin:', isAdmin);
  console.log('Permisos del usuario:', user?.permissions);

  // Si es admin, permitir acceso a todo
  if (isAdmin) {
    console.log('✅ Acceso permitido - Usuario es admin');
    return children;
  }

  // Si no requiere permiso específico, permitir
  if (!permission) {
    console.log('✅ Acceso permitido - No requiere permiso específico');
    return children;
  }

  // Verificar si el usuario tiene el permiso
  const hasPermission = user?.permissions?.[permission] !== false;

  console.log(`Permiso "${permission}":`, user?.permissions?.[permission]);
  console.log('¿Tiene permiso?:', hasPermission);

  if (!hasPermission) {
    console.log('❌ Acceso denegado - Redirigiendo a inicio');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Acceso permitido');
  return children;
};

export default PermissionRoute;
