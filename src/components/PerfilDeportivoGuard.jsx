import { useCallback, useEffect, useState } from 'react';
import { actualizarMiPerfil, getMiPerfil } from '../api/supercopa';
import {
  ALTURA_MAX,
  ALTURA_MIN,
  PIERNAS,
  POSICIONES,
  perfilDeportivoCompleto,
} from '../constants/perfilDeportivo';
import { getToken } from '../utils/session';

/**
 * Wrapper que garantiza que el usuario tenga su perfil deportivo completo
 * (altura, pierna hábil, posición) antes de mostrar los `children`.
 *
 * La primera vez que un usuario entra a su vista (jugador o delegado),
 * abre un modal bloqueante — sin botón cerrar ni overlay-click — que
 * exige completar los 3 datos. Tras guardarlos contra `PUT /mi-perfil`,
 * deja pasar al dashboard.
 *
 * Usado por JugadorDashboard y DelegadoDashboard.
 */
function PerfilDeportivoGuard({ children }) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({
    alturaCm: '',
    piernaHabil: 'DERECHA',
    posicion: 'MEDIOCAMPISTA',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const cargarPerfil = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getMiPerfil(getToken());
      setPerfil(data);
      // Si ya tiene algunos campos, prellenarlos en el form para que el modal
      // muestre lo que falta sin que el usuario los reescriba.
      setForm((prev) => ({
        alturaCm: data?.alturaCm != null ? String(data.alturaCm) : prev.alturaCm,
        piernaHabil: data?.piernaHabil || prev.piernaHabil,
        posicion: data?.posicion || prev.posicion,
      }));
    } catch (err) {
      setLoadError(err?.message || 'No fue posible cargar tu perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveError('');
    const altura = Number(form.alturaCm);
    if (!Number.isFinite(altura) || altura < ALTURA_MIN || altura > ALTURA_MAX) {
      setSaveError(`Altura debe estar entre ${ALTURA_MIN} y ${ALTURA_MAX} cm.`);
      return;
    }
    setSaving(true);
    try {
      const actualizado = await actualizarMiPerfil(
        {
          alturaCm: altura,
          piernaHabil: form.piernaHabil,
          posicion: form.posicion,
        },
        getToken(),
      );
      setPerfil(actualizado);
    } catch (err) {
      setSaveError(err?.message || 'No fue posible guardar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-backdrop" role="status" aria-live="polite">
        <div className="modal-card">
          <p>Cargando tu perfil…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="modal-backdrop" role="alert">
        <div className="modal-card">
          <h3>Error al cargar tu perfil</h3>
          <p className="banner banner-error">{loadError}</p>
          <div className="modal-actions">
            <button type="button" className="action-button primary" onClick={cargarPerfil}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (perfilDeportivoCompleto(perfil)) {
    return children;
  }

  // Modal bloqueante: sin botón cerrar ni handler de overlay click.
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>Completa tu perfil deportivo</h3>
        <p className="muted">
          Necesitamos estos datos antes de que puedas inscribirte o gestionar equipos.
          Podrás editarlos después desde tu perfil.
        </p>

        <form onSubmit={handleSubmit} className="torneo-form">
          <div className="form-row">
            <label className="form-field">
              <span className="form-label">Altura (cm)</span>
              <input
                type="number"
                min={ALTURA_MIN}
                max={ALTURA_MAX}
                className="form-input"
                value={form.alturaCm}
                onChange={(e) => setForm((p) => ({ ...p, alturaCm: e.target.value }))}
                placeholder="Ej: 178"
                required
              />
            </label>
            <label className="form-field">
              <span className="form-label">Pierna hábil</span>
              <select
                className="form-input"
                value={form.piernaHabil}
                onChange={(e) => setForm((p) => ({ ...p, piernaHabil: e.target.value }))}
              >
                {PIERNAS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Posición</span>
              <select
                className="form-input"
                value={form.posicion}
                onChange={(e) => setForm((p) => ({ ...p, posicion: e.target.value }))}
              >
                {POSICIONES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
          </div>

          {saveError && <p className="banner banner-error">{saveError}</p>}

          <div className="modal-actions">
            <button type="submit" className="action-button primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar y continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PerfilDeportivoGuard;
