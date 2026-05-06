import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import ArbitroDashboard from './pages/ArbitroDashboard';
import CompleteSignupPage from './pages/CompleteSignupPage';
import DelegadoDashboard from './pages/DelegadoDashboard';
import Galeria from './pages/Galeria';
import InscripcionPage from './pages/InscripcionPage';
import JugadorDashboard from './pages/JugadorDashboard';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import PartidoDetalle from './pages/PartidoDetalle';
import PendingApprovalPage from './pages/PendingApprovalPage';
import SalonDeLaFama from './pages/SalonDeLaFama';
import SignupPage from './pages/SignupPage';
import TorneoActivo from './pages/TorneoActivo';
import Torneos from './pages/Torneos';
import './styles/app-shell.css';

function App() {
  return (
    <div className="app-shell">
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/inscripcion" element={<InscripcionPage />} />
        <Route path="/torneos" element={<Torneos />} />
        <Route path="/torneos/2026" element={<TorneoActivo />} />
        <Route path="/torneos/2026/partido/:matchKey" element={<PartidoDetalle />} />
        <Route path="/salon-de-la-fama" element={<SalonDeLaFama />} />
        <Route path="/galeria" element={<Galeria />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/complete-signup" element={<CompleteSignupPage />} />
        <Route path="/pending" element={<PendingApprovalPage />} />

        {/* Protegidas */}
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
        <Route
          path="/dashboard/jugador"
          element={(
            <ProtectedRoute allowedRoles={['JUGADOR']}>
              <JugadorDashboard />
            </ProtectedRoute>
          )}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
