import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../api/users';
import { uploadCsv } from '../api/jugadores';
import { listUsers } from '../api/usuarios';
import { clearSession, getNombre, getToken } from '../utils/session';
import '../styles/dashboard.css';

const INITIAL_USER_FORM = {
  correo: '',
  nombre: '',
  cedula: '',
  rolSistema: 'DELEGADO',
};

const SIDEBAR_GROUPS = [
  {
    title: 'IDENTIDAD',
    items: [
      { id: 'usuarios', label: 'Usuarios del sistema', icon: '👥' },
      { id: 'csv', label: 'Cargar jugadores CSV', icon: '⤴' },
    ],
  },
  {
    title: 'TORNEO',
    items: [
      { id: 'torneo', label: 'Configurar torneo', icon: '⚙' },
      { id: 'equipos', label: 'Gestionar equipos', icon: '🛡' },
      { id: 'fixture', label: 'Fixture y cronograma', icon: '📅' },
      { id: 'aplazamientos', label: 'Aplazamientos', icon: '⏱' },
      { id: 'resultados', label: 'Resultados', icon: '☑' },
    ],
  },
  {
    title: 'FINANZAS',
    items: [
      { id: 'comprobantes', label: 'Comprobantes pendientes', icon: '📄' },
      { id: 'multas', label: 'Multas activas', icon: '⚠' },
    ],
  },
  {
    title: 'REPORTES',
    items: [
      { id: 'estadisticas', label: 'Estadisticas', icon: '📊' },
      { id: 'reporte', label: 'Reporte PDF', icon: '⬇' },
      { id: 'fama', label: 'Salon de la Fama', icon: '🏆' },
    ],
  },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('usuarios');
  const [userForm, setUserForm] = useState(INITIAL_USER_FORM);
  const [userResult, setUserResult] = useState(null);
  const [userError, setUserError] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState('');
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);

  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [buscarUsuario, setBuscarUsuario] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [users, setUsers] = useState([]);

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const handleUserChange = (event) => {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreatingUser(true);
    setUserError('');
    setUserResult(null);

    try {
      const payload = {
        ...userForm,
        cedula: userForm.cedula.trim(),
      };
      const response = await createUser(payload, getToken());
      setUserResult(response);
      setUserForm(INITIAL_USER_FORM);
    } catch (requestError) {
      setUserError(requestError.message || 'No fue posible crear el usuario.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUploadCsv = async (event) => {
    event.preventDefault();
    if (!csvFile) {
      setCsvError('Selecciona un archivo CSV antes de enviar.');
      return;
    }

    setUploadingCsv(true);
    setCsvError('');
    setCsvResult(null);

    try {
      const response = await uploadCsv(csvFile, getToken());
      setCsvResult(response);
    } catch (requestError) {
      setCsvError(requestError.message || 'No fue posible cargar el CSV.');
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleCsvFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    setCsvFile(file);
    setCsvResult(null);
    setCsvError('');

    if (!file) {
      setCsvPreviewRows([]);
      return;
    }

    try {
      const content = await file.text();
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        setCsvPreviewRows([]);
        return;
      }

      const headers = lines[0].split(',').map((value) => value.trim().toLowerCase());
      const idxNombre = headers.indexOf('nombre');
      const idxCedula = headers.indexOf('cedula');
      const idxRol = headers.indexOf('rol_jugador');
      const idxCodigo = headers.indexOf('codigo_universitario');
      const idxSemestre = headers.indexOf('semestre');

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',').map((value) => value.trim());
        return {
          nombre: idxNombre >= 0 ? cols[idxNombre] || '' : '',
          cedula: idxCedula >= 0 ? cols[idxCedula] || '' : '',
          rolJugador: idxRol >= 0 ? cols[idxRol] || '' : '',
          codigoUniversitario: idxCodigo >= 0 ? cols[idxCodigo] || '' : '',
          semestre: idxSemestre >= 0 ? cols[idxSemestre] || '' : '',
        };
      }).filter((row) => row.nombre || row.cedula || row.rolJugador);

      setCsvPreviewRows(rows);
    } catch {
      setCsvPreviewRows([]);
    }
  };

  const cargarUsuarios = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError('');

    try {
      const data = await listUsers({
        token: getToken(),
        rolSistema: filtroRol,
        buscar: buscarUsuario,
        page: 0,
        size: 50,
      });
      setUsers(data.content || []);
    } catch (requestError) {
      setUsersError(requestError.message || 'No fue posible cargar los usuarios.');
    } finally {
      setLoadingUsers(false);
    }
  }, [filtroRol, buscarUsuario]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const isUsuariosView = activeView === 'usuarios';
  const isCsvView = activeView === 'csv';

  return (
    <main className="admin-layout">
      <aside className="admin-sidebar">
        <p className="admin-brand">CODE-CUP</p>

        {SIDEBAR_GROUPS.map((group) => (
          <section key={group.title}>
            <p className="sidebar-group-title">{group.title}</p>
            <div className="sidebar-links">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        ))}

        <div className="sidebar-user-card">
          <span>{(getNombre() || 'A').slice(0, 1).toUpperCase()}</span>
          <div>
            <p>{getNombre() || 'Administrador'}</p>
            <small>admin@codecup.local</small>
          </div>
        </div>
        <button className="nav-button danger" type="button" onClick={handleLogout}>Cerrar sesion</button>
      </aside>

      <section className="admin-content">
        <header className="content-header">
          <p className="crumb">Dashboard / {isUsuariosView || isCsvView ? 'Identidad' : 'Modulo'}</p>
          <h1>{isUsuariosView ? 'Usuarios del sistema' : isCsvView ? 'Cargar jugadores CSV' : 'Modulo en construccion'}</h1>
        </header>

        {isUsuariosView ? (
          <>
            <section className="dashboard-grid">
              <article className="panel-card">
                <h2>Crear usuario</h2>
                <form className="panel-form" onSubmit={handleCreateUser}>
                  <label htmlFor="correo">Correo</label>
                  <input id="correo" name="correo" type="email" value={userForm.correo} onChange={handleUserChange} required />

                  <label htmlFor="nombre">Nombre</label>
                  <input id="nombre" name="nombre" type="text" value={userForm.nombre} onChange={handleUserChange} required />

                  <label htmlFor="cedula">Cedula</label>
                  <input id="cedula" name="cedula" type="text" value={userForm.cedula} onChange={handleUserChange} required />

                  <label htmlFor="rolSistema">Rol</label>
                  <select id="rolSistema" name="rolSistema" value={userForm.rolSistema} onChange={handleUserChange}>
                    <option value="DELEGADO">Delegado</option>
                    <option value="ARBITRO">Arbitro</option>
                  </select>

                  <button className="primary-button" type="submit" disabled={creatingUser}>
                    {creatingUser ? 'Creando...' : 'Crear usuario'}
                  </button>
                </form>

                {userError ? <p className="error-text">{userError}</p> : null}
                {userResult ? (
                  <div className="result-box">
                    <p><strong>Usuario creado:</strong> {userResult.usuario?.correo}</p>
                    <p><strong>Rol:</strong> {userResult.usuario?.rolSistema}</p>
                    <p><strong>Primer ingreso:</strong> usar cedula como contrasena inicial.</p>
                  </div>
                ) : null}
              </article>
            </section>

            <section className="dashboard-grid">
              <article className="panel-card">
                <h2>Listado de cuentas</h2>
                <form
                  className="panel-form users-filter"
                  onSubmit={(event) => {
                    event.preventDefault();
                    cargarUsuarios();
                  }}
                >
                  <label htmlFor="filtro-rol">Rol</label>
                  <select id="filtro-rol" value={filtroRol} onChange={(event) => setFiltroRol(event.target.value)}>
                    <option value="TODOS">Todos</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                    <option value="ARBITRO">Arbitro</option>
                    <option value="DELEGADO">Delegado</option>
                  </select>

                  <label htmlFor="buscar-usuario">Buscar (nombre o cedula)</label>
                  <input
                    id="buscar-usuario"
                    type="text"
                    value={buscarUsuario}
                    onChange={(event) => setBuscarUsuario(event.target.value)}
                    placeholder="Ej: David o 1098765432"
                  />

                  <button className="primary-button" type="submit" disabled={loadingUsers}>
                    {loadingUsers ? 'Buscando...' : 'Aplicar filtros'}
                  </button>
                </form>

                {usersError ? <p className="error-text">{usersError}</p> : null}

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length ? (
                        users.map((usuario) => (
                          <tr key={usuario.id}>
                            <td>{usuario.nombre}</td>
                            <td>{usuario.correo}</td>
                            <td>
                              <span className={`role-chip role-${usuario.rolSistema?.toLowerCase?.()}`}>
                                {usuario.rolSistema}
                              </span>
                            </td>
                            <td>{usuario.activo ? 'Activo' : 'Inactivo'}</td>
                            <td><button type="button" className="ghost-action" disabled>Toggle</button></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5}>No hay usuarios para los filtros seleccionados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          </>
        ) : isCsvView ? (
          <section className="dashboard-grid">
            <article className="panel-card csv-panel">
              <h2>Cargar CSV de jugadores</h2>
              <form className="panel-form" onSubmit={handleUploadCsv}>
                <label htmlFor="csv-file">Archivo CSV</label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  required
                />

                <button className="primary-button" type="submit" disabled={uploadingCsv}>
                  {uploadingCsv ? 'Cargando...' : 'Subir CSV'}
                </button>
              </form>

              {csvError ? <p className="error-text">{csvError}</p> : null}

              {csvResult ? (
                <div className="result-box">
                  <p><strong>Importados:</strong> {csvResult.importados}</p>
                  <p><strong>Actualizados:</strong> {csvResult.actualizados}</p>
                  <p><strong>Rechazados:</strong> {csvResult.rechazados}</p>
                </div>
              ) : null}
            </article>

            <article className="panel-card">
              <h2>Jugadores del archivo cargado</h2>
              {csvResult && csvPreviewRows.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Cedula</th>
                        <th>Rol</th>
                        <th>Codigo</th>
                        <th>Semestre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreviewRows.map((jugador, index) => (
                        <tr key={`${jugador.cedula}-${index}`}>
                          <td>{jugador.nombre || '-'}</td>
                          <td>{jugador.cedula || '-'}</td>
                          <td>{jugador.rolJugador || '-'}</td>
                          <td>{jugador.codigoUniversitario || '-'}</td>
                          <td>{jugador.semestre || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="csv-empty-state">Sube un CSV exitosamente para visualizar la tabla de jugadores cargados.</p>
              )}
            </article>
          </section>
        ) : (
          <section className="placeholder-module panel-card">
            <p className="placeholder-icon">🧩</p>
            <h2>Modulo disponible en Sprint 2</h2>
            <p>Esta seccion ya tiene ubicacion y navegacion, pero su implementacion funcional se libera en el siguiente sprint.</p>
          </section>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;
