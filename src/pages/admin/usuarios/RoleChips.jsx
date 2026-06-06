const ROL_LABEL = {
  ADMINISTRADOR: 'Admin',
  DELEGADO: 'Delegado',
  ARBITRO: 'Árbitro',
  JUGADOR: 'Jugador',
};

const ROL_CLASS = {
  ADMINISTRADOR: 'admin',
  DELEGADO: 'delegado',
  ARBITRO: 'arbitro',
  JUGADOR: 'jugador',
};

function chipClass(rol, estado) {
  if (estado === 'PENDIENTE' || estado === 'PENDIENTE_VALIDACION') {
    return 'role-chip pending';
  }
  const variant = ROL_CLASS[rol] || 'jugador';
  return `role-chip ${variant}`;
}

function RoleChips({ roles }) {
  if (!roles || roles.length === 0) {
    return <span className="u-meta">Sin roles</span>;
  }
  return (
    <div className="role-chips">
      {roles.map((r) => (
        <span key={r.id} className={chipClass(r.rol, r.estado)}>
          <span className="role-chip-dot" />
          {ROL_LABEL[r.rol] || r.rol}
          {(r.estado === 'PENDIENTE' || r.estado === 'PENDIENTE_VALIDACION') && ' · pend.'}
        </span>
      ))}
    </div>
  );
}

export default RoleChips;
