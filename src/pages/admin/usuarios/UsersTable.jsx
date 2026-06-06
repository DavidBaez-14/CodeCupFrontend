import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import RoleChips from './RoleChips';

const MENU_WIDTH = 220;
const MENU_OFFSET = 6;

function formatFecha(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
}

function getApprovedRoles(cuenta) {
  return (cuenta.roles || []).filter((r) => r.estado === 'APROBADO').map((r) => r.rol);
}

function RolesMenu({ cuenta, onAssign, onAssignAdmin, onRevoke }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + MENU_OFFSET,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onScroll = () => setOpen(false);
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    window.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const approved = getApprovedRoles(cuenta);
  const has = (rol) => approved.includes(rol);

  const choose = (action) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button ref={triggerRef} type="button" className="btn-row" onClick={() => setOpen((v) => !v)}>
        Roles
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="roles-menu portal open"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_WIDTH }}
        >
          <div className="roles-menu-label">Asignar</div>
          <button type="button" disabled={has('DELEGADO')} onClick={() => choose(() => onAssign(cuenta, 'DELEGADO'))}>
            <span className="menu-chip-dot delegado" />
            {has('DELEGADO') ? 'Delegado (ya tiene)' : 'Delegado'}
          </button>
          <button type="button" disabled={has('ARBITRO')} onClick={() => choose(() => onAssign(cuenta, 'ARBITRO'))}>
            <span className="menu-chip-dot arbitro" />
            {has('ARBITRO') ? 'Árbitro (ya tiene)' : 'Árbitro'}
          </button>
          <button type="button" disabled={has('ADMINISTRADOR')} onClick={() => choose(() => onAssignAdmin(cuenta))}>
            <span className="menu-chip-dot admin" />
            {has('ADMINISTRADOR') ? 'Administrador (ya tiene)' : 'Administrador'}
          </button>
          {approved.length > 0 && (
            <>
              <div className="sep" />
              <div className="roles-menu-label">Revocar</div>
              {approved.map((rol) => (
                <button
                  key={rol}
                  type="button"
                  className="danger"
                  onClick={() => choose(() => onRevoke(cuenta, rol))}
                >
                  <span className="menu-chip-dot revoke" />
                  Revocar {rol.toLowerCase()}
                </button>
              ))}
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

function UsersTable({
  cuentas,
  loading,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onAssign,
  onAssignAdmin,
  onRevoke,
  onDelete,
}) {
  const from = totalElements === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(totalElements, (page + 1) * pageSize);
  const pageNumbers = [];
  const maxBtns = 5;
  const start = Math.max(0, Math.min(page - 2, totalPages - maxBtns));
  for (let i = start; i < Math.min(totalPages, start + maxBtns); i += 1) {
    pageNumbers.push(i);
  }

  return (
    <div className="usuarios-table-wrap">
      <div className="usuarios-table-scroll">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Cédula</th>
              <th>Roles</th>
              <th>Creado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="usuarios-empty">Cargando cuentas…</td>
              </tr>
            )}
            {!loading && cuentas.length === 0 && (
              <tr>
                <td colSpan={6} className="usuarios-empty">No hay cuentas que coincidan con el filtro.</td>
              </tr>
            )}
            {!loading && cuentas.map((c) => (
              <tr key={c.id}>
                <td className="col-name">
                  {c.nombre || '—'}
                  <span className="u-meta">{c.correo || ''}</span>
                </td>
                <td>{c.correo || '—'}</td>
                <td className="col-mono">{c.cedula || '—'}</td>
                <td><RoleChips roles={c.roles} /></td>
                <td className="col-date">{formatFecha(c.fechaCreacion)}</td>
                <td>
                  <div className="row-actions">
                    <RolesMenu
                      cuenta={c}
                      onAssign={onAssign}
                      onAssignAdmin={onAssignAdmin}
                      onRevoke={onRevoke}
                    />
                    <button type="button" className="btn-row danger" onClick={() => onDelete(c)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="usuarios-pagination">
        <div className="usuarios-pagination-info">
          Mostrando <strong>{from}</strong>–<strong>{to}</strong> de <strong>{totalElements}</strong>
        </div>
        <div className="usuarios-pagination-controls">
          <button
            type="button"
            className="usuarios-page-btn"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            aria-label="Anterior"
          >
            ‹
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              className={`usuarios-page-btn ${n === page ? 'active' : ''}`}
              onClick={() => onPageChange(n)}
            >
              {n + 1}
            </button>
          ))}
          <button
            type="button"
            className="usuarios-page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default UsersTable;
