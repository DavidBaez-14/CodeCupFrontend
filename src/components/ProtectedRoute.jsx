import { Navigate } from 'react-router-dom';
import { getRol, hasSession } from '../utils/session';

function ProtectedRoute({ children, allowedRoles }) {
  if (!hasSession()) {
    return <Navigate to="/login" replace />;
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
