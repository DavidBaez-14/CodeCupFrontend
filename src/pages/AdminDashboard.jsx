import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogo from '../assets/soccer-ball-sci-fi-192.png';
import RoleHeaderActions from '../components/RoleHeaderActions';
import { aprobarRol, aprobarTodosCuenta, listPendientes, rechazarRol, rechazarTodosCuenta } from '../api/registros';
import { getJugadorByCedula, uploadCsv } from '../api/jugadores';
import { appwriteLogout } from '../lib/appwrite';
import { clearSession, getEmail, getNombre, getToken } from '../utils/session';
import ConfigurarTorneoView from './admin/ConfigurarTorneoView';
import GestionarEquiposView from './admin/GestionarEquiposView';
import FixtureView from './admin/FixtureView';
import UsuariosView from './admin/UsuariosView';
import '../styles/admin.css';
import '../styles/admin-torneo.css';

const SIDEBAR_GROUPS = [
  {
    title: 'Identidad',
    items: [
      { id: 'pendientes', label: 'Solicitudes pendientes', live: true },
      { id: 'usuarios', label: 'Usuarios', live: true },
      { id: 'csv', label: 'Cargar jugadores CSV', live: true },
      { id: 'buscar', label: 'Buscar jugador', live: true },
    ],
  },
  {
    title: 'Torneo',
    items: [
      { id: 'torneo', label: 'Configurar torneo', live: true },
      { id: 'equipos', label: 'Gestionar equipos', live: true },
      { id: 'fixture', label: 'Fixture y cronograma', live: true },
      { id: 'aplazamientos', label: 'Aplazamientos' },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { id: 'comprobantes', label: 'Comprobantes pendientes' },
      { id: 'multas', label: 'Multas activas' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { id: 'estadisticas', label: 'Estadísticas' },
      { id: 'reporte', label: 'Reporte PDF' },
      { id: 'fama', label: 'Salón de la Fama' },
    ],
  },
];

const VIEW_LABEL = {
  pendientes: 'Solicitudes pendientes',
  usuarios: 'Usuarios',
  csv: 'Cargar jugadores CSV',
  buscar: 'Buscar jugador',
  torneo: 'Configurar torneo',
  equipos: 'Gestionar equipos',
  fixture: 'Fixture y cronograma',
};

const LIVE_VIEWS = ['pendientes', 'usuarios', 'csv', 'buscar', 'torneo', 'equipos', 'fixture'];

const ROL_LABEL = {
  ARBITRO: 'Árbitro',
  DELEGADO: 'Delegado',
  ADMINISTRADOR: 'Administrador',
  JUGADOR: 'Jugador',
};

const ROLES_JUGADOR = [
  { value: 'ESTUDIANTE', label: 'Estudiante' },
  { value: 'GRADUADO', label: 'Graduado' },
  { value: 'PROFESOR', label: 'Profesor' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  PENDIENTE_VALIDACION: 'Validación manual',
};

function formatFecha(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('pendientes');
  const nombre = getNombre() || 'Administrador';
  const email = getEmail() || '';

  const handleLogout = async () => {
    clearSession();
    await appwriteLogout();
    navigate('/');
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar-v2">
        <div className="admin-brand-v2">
          <img src={brandLogo} alt="" />
          <div>
            <p className="brand-title"><em>Code</em> Cup</p>
            <p className="brand-sub">Panel de administrador</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {SIDEBAR_GROUPS.map((group) => (
            <section key={group.title}>
              <p className="sidebar-group">{group.title}</p>
              <div className="sidebar-items">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <span className="sidebar-bullet" aria-hidden="true" />
                    <span>{item.label}</span>
                    {!item.live && <span className="sidebar-tag">próx.</span>}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{nombre.slice(0, 1).toUpperCase()}</div>
          <div className="user-meta">
            <p className="user-name">{nombre}</p>
            <small className="user-email">{email || 'admin@codecup.local'}</small>
          </div>
        </div>
        <button className="logout-btn" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="crumb">Dashboard / Identidad</p>
            <h1>{VIEW_LABEL[activeView] || 'Módulo en construcción'}</h1>
          </div>
          <RoleHeaderActions allowRoleRequest={false} />
        </header>

        {activeView === 'pendientes' && <PendientesView />}
        {activeView === 'usuarios' && <UsuariosView />}
        {activeView === 'csv' && <CsvView />}
        {activeView === 'buscar' && <BuscarJugadorView />}
        {activeView === 'torneo' && <ConfigurarTorneoView />}
        {activeView === 'equipos' && <GestionarEquiposView />}
        {activeView === 'fixture' && <FixtureView />}
        {!LIVE_VIEWS.includes(activeView) && <PlaceholderView />}
      </section>
    </main>
  );
}

// Orden estable de pills cuando una cuenta tiene varios roles pendientes.
const ROL_ORDEN = { DELEGADO: 0, JUGADOR: 1, ARBITRO: 2, ADMINISTRADOR: 3 };

function PendientesView() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  // perfilId: null cuando el rechazo es del grupo completo (cuentaId).
  const [rechazo, setRechazo] = useState({
    open: false,
    cuentaId: null,
    perfilId: null,
    nombre: '',
    motivo: '',
  });
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listPendientes(getToken());
      setRegistros(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar las solicitudes pendientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Agrupamos solicitudes por cuenta para mostrar una sola fila aunque traiga
  // varios roles pendientes (caso: pidió DELEGADO y el backend creó también JUGADOR).
  const grupos = useMemo(() => {
    const map = new Map();
    for (const r of registros) {
      const key = r.cuentaId || `solo:${r.id}`;
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, solicitudes]) => {
      const ordenadas = [...solicitudes].sort((a, b) => {
        const oa = ROL_ORDEN[a.rol] ?? 99;
        const ob = ROL_ORDEN[b.rol] ?? 99;
        return oa - ob;
      });
      const cabecera = ordenadas[0];
      return {
        key,
        cuentaId: cabecera.cuentaId || null,
        cabecera,
        solicitudes: ordenadas,
        total: ordenadas.length,
        motivoSolicitud: ordenadas.find((s) => s.motivoSolicitud)?.motivoSolicitud,
        fechaSolicitud: cabecera.fechaSolicitud,
      };
    });
  }, [registros]);

  const handleAprobarGrupo = async (grupo) => {
    const actionKey = grupo.cuentaId || grupo.cabecera.id;
    setActioningId(actionKey);
    setError('');
    setFeedback('');
    try {
      if (grupo.total > 1 && grupo.cuentaId) {
        await aprobarTodosCuenta(grupo.cuentaId, getToken());
        setFeedback(`Todos los roles de ${grupo.cabecera.nombre || grupo.cabecera.correo} aprobados.`);
        setRegistros((prev) => prev.filter((r) => r.cuentaId !== grupo.cuentaId));
      } else {
        await aprobarRol(grupo.cabecera.id, getToken());
        setFeedback(`Solicitud de ${grupo.cabecera.nombre || grupo.cabecera.correo} aprobada.`);
        setRegistros((prev) => prev.filter((r) => r.id !== grupo.cabecera.id));
      }
    } catch (err) {
      setError(err?.message || 'No fue posible aprobar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  const openRechazo = (grupo) => {
    setRechazo({
      open: true,
      cuentaId: grupo.total > 1 ? grupo.cuentaId : null,
      perfilId: grupo.total > 1 ? null : grupo.cabecera.id,
      nombre: grupo.cabecera.nombre || grupo.cabecera.correo,
      motivo: '',
    });
  };

  const handleRechazar = async () => {
    if (!rechazo.motivo.trim()) {
      setError('Indica un motivo para el rechazo.');
      return;
    }
    const actionKey = rechazo.cuentaId || rechazo.perfilId;
    setActioningId(actionKey);
    setError('');
    setFeedback('');
    try {
      if (rechazo.cuentaId) {
        await rechazarTodosCuenta(rechazo.cuentaId, rechazo.motivo.trim(), getToken());
        setFeedback(`Solicitudes de ${rechazo.nombre} rechazadas.`);
        setRegistros((prev) => prev.filter((r) => r.cuentaId !== rechazo.cuentaId));
      } else {
        await rechazarRol(rechazo.perfilId, rechazo.motivo.trim(), getToken());
        setFeedback(`Solicitud de ${rechazo.nombre} rechazada.`);
        setRegistros((prev) => prev.filter((r) => r.id !== rechazo.perfilId));
      }
      setRechazo({ open: false, cuentaId: null, perfilId: null, nombre: '', motivo: '' });
    } catch (err) {
      setError(err?.message || 'No fue posible rechazar la solicitud.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="view-stack">
      <div className="metric-row">
        <article className="metric-card">
          <p className="metric-label">Pendientes</p>
          <p className="metric-value">{grupos.length}</p>
          <p className="metric-hint">Esperan tu aprobación</p>
        </article>
        <article className="metric-card metric-secondary">
          <p className="metric-label">Acción</p>
          <p className="metric-value-sm">Aprobar / Rechazar</p>
          <p className="metric-hint">Aprobar agrega el rol y, si era validación manual, también lo agrega al padrón.</p>
        </article>
        <button type="button" className="action-button ghost" onClick={load} disabled={loading}>
          {loading ? 'Actualizando…' : 'Refrescar'}
        </button>
      </div>

      {feedback && <p className="banner banner-success">{feedback}</p>}
      {error && <p className="banner banner-error">{error}</p>}

      <article className="ds-panel">
        <header className="panel-header">
          <h2>Solicitudes en cola</h2>
          <p>Tabla con todos los registros con estado <strong>PENDIENTE</strong>.</p>
        </header>

        {loading ? (
          <p className="empty-state">Cargando solicitudes…</p>
        ) : registros.length === 0 ? (
          <p className="empty-state">No hay solicitudes pendientes en este momento.</p>
        ) : (
          <div className="table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Cédula</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => {
                  const actionKey = grupo.cuentaId || grupo.cabecera.id;
                  const ocupado = actioningId === actionKey;
                  return (
                    <tr key={grupo.key}>
                      <td>
                        <div>{grupo.cabecera.nombre || '—'}</div>
                        {grupo.motivoSolicitud && (
                          <small className="muted" title={grupo.motivoSolicitud}>
                            “{grupo.motivoSolicitud}”
                          </small>
                        )}
                      </td>
                      <td>{grupo.cabecera.correo || '—'}</td>
                      <td className="mono">{grupo.cabecera.cedula || '—'}</td>
                      <td>
                        <div className="role-pill-stack">
                          {grupo.solicitudes.map((s) => (
                            <span key={s.id} className={`role-pill role-${(s.rol || '').toLowerCase()}`}>
                              {ROL_LABEL[s.rol] || s.rol || '—'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="role-pill-stack">
                          {grupo.solicitudes.map((s) => (
                            <span key={s.id} className={`role-pill role-${(s.estado || '').toLowerCase()}`}>
                              {ESTADO_LABEL[s.estado] || s.estado || '—'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="muted">{formatFecha(grupo.fechaSolicitud)}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="action-button approve"
                          disabled={ocupado}
                          onClick={() => handleAprobarGrupo(grupo)}
                          title={grupo.total > 1
                            ? 'Aprueba todos los roles solicitados por esta cuenta'
                            : undefined}
                        >
                          {ocupado
                            ? '…'
                            : grupo.total > 1
                              ? `Aprobar ${grupo.total} roles`
                              : 'Aprobar'}
                        </button>
                        <button
                          type="button"
                          className="action-button reject"
                          disabled={ocupado}
                          onClick={() => openRechazo(grupo)}
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {rechazo.open && (() => {
        const rechazoActionKey = rechazo.cuentaId || rechazo.perfilId;
        const ocupado = actioningId === rechazoActionKey;
        const esGrupo = !!rechazo.cuentaId;
        return (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <h3>Rechazar solicitud</h3>
              <p>
                Vas a rechazar {esGrupo ? 'todas las solicitudes' : 'la solicitud'} de <strong>{rechazo.nombre}</strong>.
                La cuenta de Appwrite no se elimina; si la persona tiene otros roles aprobados, los conserva.
              </p>
              <label className="form-label" htmlFor="motivo-rechazo">Motivo</label>
              <textarea
                id="motivo-rechazo"
                className="form-input"
                rows={4}
                value={rechazo.motivo}
                onChange={(e) => setRechazo((prev) => ({ ...prev, motivo: e.target.value }))}
                placeholder="Ej: cédula no encontrada en la base de la facultad."
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="action-button ghost"
                  onClick={() => setRechazo({ open: false, cuentaId: null, perfilId: null, nombre: '', motivo: '' })}
                  disabled={ocupado}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="action-button reject"
                  onClick={handleRechazar}
                  disabled={ocupado}
                >
                  {ocupado ? 'Rechazando…' : 'Confirmar rechazo'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function CsvView() {
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    nombre: '',
    cedula: '',
    rolJugador: 'ESTUDIANTE',
    codigoUniversitario: '',
    semestre: '',
  });
  const [manualError, setManualError] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const resetManualForm = () => {
    setManualForm({
      nombre: '',
      cedula: '',
      rolJugador: 'ESTUDIANTE',
      codigoUniversitario: '',
      semestre: '',
    });
    setManualError('');
  };

  const openManual = () => {
    resetManualForm();
    setManualOpen(true);
  };

  const handleFileChange = async (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setError('');

    if (!selected) {
      setPreviewRows([]);
      return;
    }

    try {
      const content = await selected.text();
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) { setPreviewRows([]); return; }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const idx = (name) => headers.indexOf(name);
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        return {
          nombre: idx('nombre') >= 0 ? cols[idx('nombre')] : '',
          cedula: idx('cedula') >= 0 ? cols[idx('cedula')] : '',
          rolJugador: idx('rol_jugador') >= 0 ? cols[idx('rol_jugador')] : '',
          codigoUniversitario: idx('codigo_universitario') >= 0 ? cols[idx('codigo_universitario')] : '',
          semestre: idx('semestre') >= 0 ? cols[idx('semestre')] : '',
        };
      }).filter((r) => r.nombre || r.cedula);
      setPreviewRows(rows);
    } catch {
      setPreviewRows([]);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Selecciona un archivo CSV antes de enviar.');
      return;
    }
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const data = await uploadCsv(file, getToken());
      setResult(data);
    } catch (err) {
      setError(err?.message || 'No fue posible cargar el CSV.');
    } finally {
      setUploading(false);
    }
  };

  const toCsvValue = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const buildSingleRowCsv = (form) => {
    const headers = ['nombre', 'cedula', 'rol_jugador', 'codigo_universitario', 'semestre'];
    const esEstudiante = form.rolJugador === 'ESTUDIANTE';
    const row = [
      form.nombre.trim(),
      form.cedula.trim(),
      form.rolJugador,
      esEstudiante ? form.codigoUniversitario.trim() : '',
      esEstudiante ? String(form.semestre).trim() : '',
    ];
    return `${headers.join(',')}\n${row.map(toCsvValue).join(',')}\n`;
  };

  const validateManual = () => {
    if (!manualForm.nombre.trim()) {
      return 'El nombre es obligatorio.';
    }
    if (!/^\d{6,15}$/.test(manualForm.cedula.trim())) {
      return 'La cédula debe contener entre 6 y 15 dígitos.';
    }
    if (manualForm.rolJugador === 'ESTUDIANTE') {
      if (!manualForm.codigoUniversitario.trim()) {
        return 'El código estudiantil es obligatorio.';
      }
      if (!/^[1-9]\d*$/.test(String(manualForm.semestre).trim())) {
        return 'El semestre debe ser un número válido.';
      }
    }
    return '';
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setManualError('');
    const validation = validateManual();
    if (validation) {
      setManualError(validation);
      return;
    }

    setManualSubmitting(true);
    setError('');
    setResult(null);
    try {
      const csv = buildSingleRowCsv(manualForm);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `jugador-${manualForm.cedula.trim()}.csv`;
      const oneRowFile = new File([blob], filename, { type: 'text/csv' });
      const data = await uploadCsv(oneRowFile, getToken());
      setResult(data);
      setManualOpen(false);
    } catch (err) {
      setManualError(err?.message || 'No fue posible agregar al jugador.');
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="view-stack">
      <article className="ds-panel csv-drop-panel">
        <header className="panel-header">
          <h2>Subir archivo CSV</h2>
          <p>Columnas esperadas: <code>nombre, cedula, rol_jugador, codigo_universitario, semestre</code>.</p>
        </header>

        <form onSubmit={handleUpload} className="csv-form">
          <label className="csv-drop">
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <span className="csv-drop-cta">
              {file ? file.name : 'Selecciona o arrastra tu CSV aquí'}
            </span>
            <small>Formato .csv hasta unos pocos MB.</small>
          </label>

          <button className="action-button primary" type="submit" disabled={uploading || !file}>
            {uploading ? 'Subiendo…' : 'Subir CSV'}
          </button>

          <button className="action-button ghost" type="button" onClick={openManual} disabled={uploading}>
            Agregar usuario
          </button>
        </form>

        {error && <p className="banner banner-error">{error}</p>}

        {result && (
          <div className="result-grid">
            <div className="result-tile">
              <p className="result-label">Importados</p>
              <p className="result-value approved">{result.importados ?? 0}</p>
            </div>
            <div className="result-tile">
              <p className="result-label">Actualizados</p>
              <p className="result-value">{result.actualizados ?? 0}</p>
            </div>
            <div className="result-tile">
              <p className="result-label">Rechazados</p>
              <p className="result-value rejected">{result.rechazados ?? 0}</p>
            </div>
          </div>
        )}
      </article>

      <article className="ds-panel">
        <header className="panel-header">
          <h2>Vista previa</h2>
          <p>{previewRows.length ? `${previewRows.length} filas detectadas en el archivo.` : 'Sube un CSV para ver sus filas aquí antes de enviarlas al backend.'}</p>
        </header>

        {previewRows.length > 0 && (
          <div className="table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Rol</th>
                  <th>Código</th>
                  <th>Semestre</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 50).map((row, i) => (
                  <tr key={`${row.cedula}-${i}`}>
                    <td>{row.nombre || '—'}</td>
                    <td className="mono">{row.cedula || '—'}</td>
                    <td>{row.rolJugador || '—'}</td>
                    <td>{row.codigoUniversitario || '—'}</td>
                    <td>{row.semestre || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 50 && <p className="muted">Mostrando primeras 50 filas — el backend procesa el archivo completo.</p>}
          </div>
        )}
      </article>

      {manualOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Agregar jugador al padrón</h3>
            <p>Este flujo agrega la cédula al padrón vía CSV. No crea cuenta de Appwrite.</p>

            <form onSubmit={handleManualSubmit} className="modal-form">
              <label className="form-label" htmlFor="manual-nombre">Nombre completo</label>
              <input
                id="manual-nombre"
                className="form-input"
                value={manualForm.nombre}
                onChange={(e) => setManualForm((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre del jugador"
                required
              />

              <label className="form-label" htmlFor="manual-cedula">Cédula</label>
              <input
                id="manual-cedula"
                className="form-input"
                inputMode="numeric"
                value={manualForm.cedula}
                onChange={(e) => setManualForm((prev) => ({ ...prev, cedula: e.target.value }))}
                placeholder="1090000001"
                required
              />

              <label className="form-label" htmlFor="manual-rol">Rol del jugador</label>
              <select
                id="manual-rol"
                className="form-input"
                value={manualForm.rolJugador}
                onChange={(e) => setManualForm((prev) => ({ ...prev, rolJugador: e.target.value }))}
              >
                {ROLES_JUGADOR.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {manualForm.rolJugador === 'ESTUDIANTE' && (
                <>
                  <label className="form-label" htmlFor="manual-codigo">Código universitario</label>
                  <input
                    id="manual-codigo"
                    className="form-input"
                    value={manualForm.codigoUniversitario}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, codigoUniversitario: e.target.value }))}
                    placeholder="1152381"
                  />

                  <label className="form-label" htmlFor="manual-semestre">Semestre</label>
                  <input
                    id="manual-semestre"
                    className="form-input"
                    inputMode="numeric"
                    value={manualForm.semestre}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, semestre: e.target.value }))}
                    placeholder="7"
                  />
                </>
              )}

              {manualError && <p className="banner banner-error">{manualError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="action-button ghost"
                  onClick={() => setManualOpen(false)}
                  disabled={manualSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="action-button primary"
                  disabled={manualSubmitting}
                >
                  {manualSubmitting ? 'Agregando…' : 'Agregar jugador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BuscarJugadorView() {
  const [cedula, setCedula] = useState('');
  const [jugador, setJugador] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!cedula.trim()) return;
    setLoading(true);
    setError('');
    setJugador(null);
    try {
      const data = await getJugadorByCedula(cedula.trim(), getToken());
      setJugador(data);
    } catch (err) {
      setError(err?.message || 'No fue posible obtener el jugador.');
    } finally {
      setLoading(false);
    }
  };

  const rolClase = useMemo(() => `role-${(jugador?.rolJugador || '').toLowerCase()}`, [jugador]);

  return (
    <div className="view-stack">
      <article className="ds-panel">
        <header className="panel-header">
          <h2>Consulta de jugador</h2>
          <p>Busca por cédula exacta. Esta consulta usa el mismo endpoint que el delegado.</p>
        </header>

        <form className="inline-search" onSubmit={handleSearch}>
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            placeholder="Ej: 1090000001"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
          />
          <button className="action-button primary" type="submit" disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

        {error && <p className="banner banner-error">{error}</p>}

        {jugador && (
          <div className="player-card">
            <header className="player-card-header">
              <span className={`role-pill ${rolClase}`}>{jugador.rolJugador || '—'}</span>
              <span className={`status-pill ${jugador.activo ? 'on' : 'off'}`}>
                {jugador.activo ? 'Activo' : 'Inactivo'}
              </span>
            </header>
            <h3 className="player-name">{jugador.nombre || '—'}</h3>
            <dl className="player-grid">
              <div><dt>Cédula</dt><dd className="mono">{jugador.cedula || '—'}</dd></div>
              <div><dt>Código universitario</dt><dd>{jugador.codigoUniversitario || '—'}</dd></div>
              <div><dt>Semestre</dt><dd>{jugador.semestre ?? '—'}</dd></div>
            </dl>
          </div>
        )}
      </article>
    </div>
  );
}

function PlaceholderView() {
  return (
    <article className="ds-panel placeholder">
      <h2>Módulo en construcción</h2>
      <p>Esta sección ya tiene su lugar en la navegación. Su funcionalidad se libera en próximos sprints, sin afectar lo ya operativo.</p>
    </article>
  );
}

export default AdminDashboard;
