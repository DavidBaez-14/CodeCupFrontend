import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

/** Muestra la ubicación actual (ruta + query) para comprobar a dónde navegó la página. */
function Ubicacion() {
  const location = useLocation();
  return <div data-testid="ubicacion">{location.pathname + location.search}</div>;
}

/**
 * Renderiza `elemento` en la ruta `patron`, arrancando en `rutaInicial`.
 * Cualquier otra ruta no pinta nada: la navegación se comprueba con el testid "ubicacion".
 */
export function renderEnRuta(rutaInicial, patron, elemento) {
  return render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Routes>
        <Route path={patron} element={elemento} />
        <Route path="*" element={null} />
      </Routes>
      <Ubicacion />
    </MemoryRouter>,
  );
}

/** Error como los que lanza api/http.js: status + body del ProblemDetail. */
export function errorApi(status, code, mensaje = 'error') {
  const error = new Error(mensaje);
  error.status = status;
  error.body = { code, mensaje };
  return error;
}

/** Error como los de supabase-js (AuthError): code + message. */
export function errorAuth(code, message = 'auth error') {
  const error = new Error(message);
  error.code = code;
  return error;
}
