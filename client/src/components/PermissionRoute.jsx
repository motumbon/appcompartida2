import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PermissionRoute = ({ children, permission }) => {
  const { user, isAdmin } = useAuth();

  // Si es admin, permitir acceso a todo
  if (isAdmin) {
    return children;
  }

  // Si no requiere permiso específico, permitir
  if (!permission) {
    return children;
  }

  // Verificar si el usuario tiene el permiso
  const hasPermission = user?.permissions?.[permission] !== false;

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PermissionRoute;
