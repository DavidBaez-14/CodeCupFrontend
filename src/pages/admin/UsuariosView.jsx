import { useCallback, useEffect, useState } from 'react';
import { getToken } from '../../utils/session';
import {
  asignarRol,
  crearCuenta,
  eliminarCuenta,
  listarCuentas,
  revocarRol,
} from '../../api/cuentas';
import UsersTable from './usuarios/UsersTable';
import CreateUserModal from './usuarios/CreateUserModal';
import AssignRoleModal from './usuarios/AssignRoleModal';
import AssignAdminModal from './usuarios/AssignAdminModal';
import RevokeRoleModal from './usuarios/RevokeRoleModal';
import DeleteUserModal from './usuarios/DeleteUserModal';
import Toast from './usuarios/Toast';
import '../../styles/admin-usuarios.css';

const PAGE_SIZE = 8;

function UsuariosView() {
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [page, setPage] = useState(0);

  const [modalCreate, setModalCreate] = useState(false);
  const [modalAssign, setModalAssign] = useState({ open: false, cuenta: null, rol: null });
  const [modalAssignAdmin, setModalAssignAdmin] = useState({ open: false, cuenta: null });
  const [modalRevoke, setModalRevoke] = useState({ open: false, cuenta: null, rol: null });
  const [modalDelete, setModalDelete] = useState({ open: false, cuenta: null });

  const [toast, setToast] = useState({ msg: '', kind: 'success' });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, rolFiltro]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listarCuentas(
        { q: debouncedQuery, rol: rolFiltro || undefined, page, size: PAGE_SIZE },
        getToken(),
      );
      setData({
        content: result.content || [],
        totalElements: result.totalElements ?? 0,
        totalPages: result.totalPages ?? 0,
        number: result.number ?? page,
      });
    } catch (err) {
      setError(err?.message || 'No fue posible cargar las cuentas.');
      setData({ content: [], totalElements: 0, totalPages: 0, number: 0 });
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, rolFiltro, page]);

  useEffect(() => {
    load();
  }, [load]);

  const showSuccess = (msg) => setToast({ msg, kind: 'success' });
  const showError = (msg) => setToast({ msg, kind: 'danger' });

  const handleAssign = (cuenta, rol) => {
    setModalAssign({ open: true, cuenta, rol });
  };

  const handleAssignAdmin = (cuenta) => {
    setModalAssignAdmin({ open: true, cuenta });
  };

  const handleRevoke = (cuenta, rol) => {
    setModalRevoke({ open: true, cuenta, rol });
  };

  const handleDelete = (cuenta) => {
    setModalDelete({ open: true, cuenta });
  };

  const submitCreate = async (payload) => {
    const result = await crearCuenta(payload, getToken());
    showSuccess('Cuenta creada. Comparte la contraseña con el usuario.');
    load();
    return result;
  };

  const submitAssign = async (payload) => {
    await asignarRol(payload, getToken());
    showSuccess(`Rol ${payload.rol.toLowerCase()} asignado.`);
    load();
  };

  const submitAssignAdmin = async (payload) => {
    await asignarRol(payload, getToken());
    showSuccess('Administrador otorgado.');
    load();
  };

  const submitRevoke = async (payload) => {
    await revocarRol(payload, getToken());
    showSuccess(`Rol ${payload.rol.toLowerCase()} revocado.`);
    load();
  };

  const submitDelete = async (payload) => {
    await eliminarCuenta(payload, getToken());
    showSuccess('Cuenta eliminada.');
    load();
  };

  return (
    <div className="view-stack">
      <p className="page-subtitle" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
        Gestiona cuentas, roles y permisos de delegados, árbitros y administradores.
      </p>

      <div className="usuarios-toolbar">
        <div className="usuarios-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="usuarios-search-input"
            type="text"
            placeholder="Buscar por nombre, correo o cédula..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="usuarios-select"
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value)}
        >
          <option value="">Todos los roles</option>
          <option value="ADMINISTRADOR">Administrador</option>
          <option value="DELEGADO">Delegado</option>
          <option value="ARBITRO">Árbitro</option>
          <option value="JUGADOR">Jugador</option>
        </select>
        <button type="button" className="btn-create" onClick={() => setModalCreate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Crear usuario
        </button>
      </div>

      {error && (
        <div className="u-callout danger" style={{ marginBottom: 16 }}>
          <div>{error}</div>
        </div>
      )}

      <UsersTable
        cuentas={data.content}
        loading={loading}
        page={data.number}
        totalPages={data.totalPages}
        totalElements={data.totalElements}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onAssign={handleAssign}
        onAssignAdmin={handleAssignAdmin}
        onRevoke={handleRevoke}
        onDelete={handleDelete}
      />

      <CreateUserModal
        open={modalCreate}
        onClose={() => setModalCreate(false)}
        onSubmit={submitCreate}
      />
      <AssignRoleModal
        open={modalAssign.open}
        cuenta={modalAssign.cuenta}
        rolPreseleccionado={modalAssign.rol}
        onClose={() => setModalAssign({ open: false, cuenta: null, rol: null })}
        onSubmit={submitAssign}
      />
      <AssignAdminModal
        open={modalAssignAdmin.open}
        cuenta={modalAssignAdmin.cuenta}
        onClose={() => setModalAssignAdmin({ open: false, cuenta: null })}
        onSubmit={submitAssignAdmin}
      />
      <RevokeRoleModal
        open={modalRevoke.open}
        cuenta={modalRevoke.cuenta}
        rol={modalRevoke.rol}
        onClose={() => setModalRevoke({ open: false, cuenta: null, rol: null })}
        onSubmit={submitRevoke}
      />
      <DeleteUserModal
        open={modalDelete.open}
        cuenta={modalDelete.cuenta}
        onClose={() => setModalDelete({ open: false, cuenta: null })}
        onSubmit={submitDelete}
      />

      <Toast message={toast.msg} kind={toast.kind} onClose={() => setToast({ msg: '', kind: 'success' })} />
    </div>
  );
}

export default UsuariosView;
