import { Navigate, useLocation } from 'react-router-dom';
import { getRol, hasSession, mustChangePassword } from '../utils/session';

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();

  if (!hasSession()) {
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword() && location.pathname !== '/cambiar-contrasena') {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  if (allowedRoles?.length) {
    const rol = getRol();
    if (!allowedRoles.includes(rol)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
