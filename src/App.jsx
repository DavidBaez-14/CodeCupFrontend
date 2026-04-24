import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ArbitroDashboard from './pages/ArbitroDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DelegadoDashboard from './pages/DelegadoDashboard';
import Galeria from './pages/Galeria';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import InscripcionPage from './pages/InscripcionPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SalonDeLaFama from './pages/SalonDeLaFama';
import Torneos from './pages/Torneos';
import './styles/app-shell.css';

function App() {
  return (
    <div className="app-shell">
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/inscripcion" element={<InscripcionPage />} />
        <Route path="/torneos" element={<Torneos />} />
        <Route path="/salon-de-la-fama" element={<SalonDeLaFama />} />
        <Route path="/galeria" element={<Galeria />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        {/* Protected */}
        <Route
          path="/cambiar-contrasena"
          element={(
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard/admin"
          element={(
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <AdminDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard/arbitro"
          element={(
            <ProtectedRoute allowedRoles={['ARBITRO']}>
              <ArbitroDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard/delegado"
          element={(
            <ProtectedRoute allowedRoles={['DELEGADO']}>
              <DelegadoDashboard />
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
