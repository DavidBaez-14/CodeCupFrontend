import { Account, Client } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  console.warn('[appwrite] Falta VITE_APPWRITE_ENDPOINT o VITE_APPWRITE_PROJECT_ID en .env.local');
}

export const appwriteClient = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

export const account = new Account(appwriteClient);

export async function appwriteSignup({ email, password, name }) {
  return account.create('unique()', email, password, name);
}

export async function appwriteLogin({ email, password }) {
  return account.createEmailPasswordSession(email, password);
}

export async function appwriteCreateJwt() {
  const { jwt } = await account.createJWT();
  return jwt;
}

export async function appwriteLogout() {
  try {
    await account.deleteSession('current');
  } catch {
    // Si la sesión ya expiró o no existe, no es un error que deba romper el flujo.
  }
}

export function appwriteOAuthGoogle({ successUrl, failureUrl }) {
  // Inicia el flujo OAuth: Appwrite redirige a Google, luego al successUrl con sesión activa.
  return account.createOAuth2Session('google', successUrl, failureUrl);
}

export async function appwriteCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}
