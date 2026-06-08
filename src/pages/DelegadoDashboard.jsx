import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import PerfilDeportivoGuard from '../components/PerfilDeportivoGuard';
import RoleHeaderActions from '../components/RoleHeaderActions';
import { useToast } from '../components/Toast';
import { getMiEquipo, listSolicitudesPendientes } from '../api/supercopa';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getNombre, getToken } from '../utils/session';
import MiEquipoTab from './delegado/MiEquipoTab';
import PagosTab from './delegado/PagosTab';
import SolicitudesTab from './delegado/SolicitudesTab';
import TorneosTab from './delegado/TorneosTab';
import '../styles/admin.css';
import '../styles/role-shell.css';
import '../styles/delegado.css';
import '../styles/admin-torneo.css';
import '../styles/toast.css';

const TABS = [
  { id: 'torneos', label: 'Torneos' },
  { id: 'equipo', label: 'Mi Equipo' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'solicitudes', label: 'Solicitudes' },
];

function DelegadoDashboard() {
  const navigate = useNavigate();
  const nombre = getNombre() || 'Delegado';
  const token = getToken();

  const [activeTab, setActiveTab] = useState('equipo');
  const [tieneEquipo, setTieneEquipo] = useState(false);
  const [pendientesCount, setPendientesCount] = useState(0);
  const { Toast, toast } = useToast();

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
  };

  useEffect(() => {
    let alive = true;
    getMiEquipo(token)
      .then((eq) => { if (alive) setTieneEquipo(!!eq?.id); })
      .catch(() => { if (alive) setTieneEquipo(false); });
    return () => { alive = false; };
  }, [token]);

  useEffect(() => {
    let alive = true;
    listSolicitudesPendientes(token)
      .then((data) => { if (alive && Array.isArray(data)) setPendientesCount(data.length); })
      .catch(() => {});
    return () => { alive = false; };
  }, [token, activeTab]);

  const refreshEquipoFlag = () => {
    getMiEquipo(token).then((eq) => setTieneEquipo(!!eq?.id)).catch(() => {});
  };

  return (
    <PerfilDeportivoGuard>
    <main className="role-shell delegado-shell">
      <header className="role-topbar delegado-topbar">
        <div className="role-brand">
          <img src={brandLogo} alt="" />
          <div>
            <p className="brand-title"><em>Code</em> Cup</p>
            <p className="brand-sub">Panel de delegado</p>
          </div>
        </div>
        <div className="role-user">
          <RoleHeaderActions allowRoleRequest />
          <button className="logout-btn" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      {/* Hero — mockup upgrade */}
      <div className="dg-hero">
        <div className="dg-hero-inner">
          <span className="dg-role-tag">Delegado</span>
          <h1 className="dg-hero-greeting">Hola, <em>{nombre.split(' ')[0]}</em></h1>
          <p className="dg-hero-sub">
            Gestiona tu equipo, inscríbete a torneos abiertos y carga tus pagos.
            Tu equipo aparece como inscrito apenas envíes el comprobante.
          </p>
        </div>
        <div className="dg-hero-divider" />
      </div>

      <nav className="delegado-tabs" aria-label="Pestañas de delegado">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`delegado-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'solicitudes' && pendientesCount > 0 && (
              <span className="tab-badge">{pendientesCount}</span>
            )}
          </button>
        ))}
      </nav>

      <section className="role-content delegado-content">
        {activeTab === 'torneos' && (
          <TorneosTab tieneEquipo={tieneEquipo} onInscripcion={refreshEquipoFlag} toast={toast} />
        )}
        {activeTab === 'equipo' && (
          <MiEquipoTab onEquipoCreado={refreshEquipoFlag} toast={toast} />
        )}
        {activeTab === 'pagos' && <PagosTab toast={toast} />}
        {activeTab === 'solicitudes' && <SolicitudesTab toast={toast} />}
      </section>

      <footer className="dg-page-footer">© 2026 · Code Cup · UFPS Cúcuta</footer>

      <Toast />
    </main>
    </PerfilDeportivoGuard>
  );
}

export default DelegadoDashboard;
