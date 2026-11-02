import { createClient } from '@supabase/supabase-js';
import { clearSession, setToken } from '../utils/session';

// Cliente de Supabase Auth (spec 0019). Solo usa la publishable key, que es pública por diseño.
const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  console.warn('[supabase] Falta VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env.local');
}

export const supabase = createClient(url || 'http://localhost:54321', publishableKey || 'falta-la-publishable-key', {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    // /auth/callback decide qué hacer con token_hash (correos) o code (Google).
    detectSessionInUrl: false,
  },
});

const EVENTOS_CON_TOKEN = new Set(['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED', 'PASSWORD_RECOVERY']);

/**
 * Mantiene codecup_token con el access token vigente, así las llamadas a getToken()
 * del resto de la web no cambian. INITIAL_SESSION sin sesión no borra nada.
 */
export function aplicarEventoDeSesion(evento, sesion) {
  if (evento === 'SIGNED_OUT') {
    clearSession();
    return;
  }
  if (EVENTOS_CON_TOKEN.has(evento) && sesion?.access_token) {
    setToken(sesion.access_token);
  }
}

let escuchando = false;

/** Se llama una vez al arrancar la app (main.jsx). */
export function escucharSesion() {
  if (escuchando) return;
  escuchando = true;
  supabase.auth.onAuthStateChange((evento, sesion) => aplicarEventoDeSesion(evento, sesion));
}

function exigir({ data, error }) {
  if (error) throw error;
  return data;
}

export async function entrarConContrasena(correo, contrasena) {
  const data = exigir(await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena }));
  setToken(data.session?.access_token);
  return data;
}

export async function registrarseConCorreo(correo, contrasena) {
  return exigir(await supabase.auth.signUp({ email: correo.trim(), password: contrasena }));
}

export async function entrarConGoogle() {
  return exigir(await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  }));
}

/** Enlaces de los correos: /auth/callback?token_hash=…&type=email|recovery. */
export async function verificarEnlace(tokenHash, tipo) {
  const data = exigir(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo }));
  setToken(data.session?.access_token);
  return data.session;
}

/** Vuelta de Google (PKCE): /auth/callback?code=…. */
export async function intercambiarCodigo(codigo) {
  const data = exigir(await supabase.auth.exchangeCodeForSession(codigo));
  setToken(data.session?.access_token);
  return data.session;
}

export async function enviarRecuperacion(correo) {
  return exigir(await supabase.auth.resetPasswordForEmail(correo.trim()));
}

export async function cambiarContrasena(contrasena) {
  return exigir(await supabase.auth.updateUser({ password: contrasena }));
}

export async function cerrarSesion() {
  try {
    await supabase.auth.signOut();
  } catch {
    // Sin sesión o sin red: igual se limpia la sesión local.
  }
  clearSession();
}

/** Renueva la sesión. Devuelve el access token nuevo, o null si ya no se puede. */
export async function renovarSesion() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session) return null;
    setToken(data.session.access_token);
    return data.session.access_token;
  } catch {
    return null;
  }
}

export async function obtenerSesion() {
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}
