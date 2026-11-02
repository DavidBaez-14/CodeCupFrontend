// Mensajes en español para los errores de Supabase Auth y los avisos del login (spec 0019).

export const MENSAJE_BLOQUEADA = 'Tu cuenta está bloqueada. Si crees que es un error, escribe a un administrador.';
export const MENSAJE_SESION_VENCIDA = 'Tu sesión venció. Vuelve a entrar.';
export const MENSAJE_CONTRASENA_ACTUALIZADA = 'Ya puedes entrar con tu contraseña nueva.';
export const MENSAJE_ENLACE_VENCIDO = 'El enlace venció o ya se usó.';
export const MENSAJE_SIN_ADMIN = 'Tu cuenta no tiene el rol de Administrador.';

const DEMASIADOS_INTENTOS = 'Hiciste demasiados intentos. Espera unos minutos.';

const POR_CODIGO = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo antes de entrar.',
  otp_expired: MENSAJE_ENLACE_VENCIDO,
  flow_state_expired: MENSAJE_ENLACE_VENCIDO,
  flow_state_not_found: MENSAJE_ENLACE_VENCIDO,
  bad_code_verifier: MENSAJE_ENLACE_VENCIDO,
  over_email_send_rate_limit: DEMASIADOS_INTENTOS,
  over_request_rate_limit: DEMASIADOS_INTENTOS,
  weak_password: 'La contraseña es muy débil. Usa al menos 8 caracteres.',
  same_password: 'La contraseña nueva debe ser distinta de la anterior.',
  email_address_invalid: 'Revisa el correo: no parece válido.',
  signup_disabled: 'El registro está deshabilitado por ahora.',
};

/** Traduce un error de supabase-js. Si el código no se conoce, usa `porDefecto` (nunca el texto en inglés). */
export function mensajeDeErrorAuth(error, porDefecto = 'No fue posible completar la operación.') {
  if (!error) return porDefecto;
  if (POR_CODIGO[error.code]) return POR_CODIGO[error.code];
  if (error.code) return porDefecto;
  return error.message || porDefecto;
}
