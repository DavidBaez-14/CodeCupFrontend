/** Navegación de página completa (fuera de React Router). Aparte para poder simularla en los tests. */
export function irA(url) {
  window.location.assign(url);
}
