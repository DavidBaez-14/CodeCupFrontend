const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'https://authcodecup-cykcc.ondigitalocean.app';

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text ? { mensaje: text } : {};
}

export async function requestJson(path, options = {}) {
  const url = /^https?:\/\//i.test(path) ? path : `${BACKEND_ORIGIN}${path}`;
  const response = await fetch(url, options);
  const body = await parseBody(response);

  if (!response.ok) {
    const error = new Error(body?.mensaje || body?.error || 'Error en la solicitud.');
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}
