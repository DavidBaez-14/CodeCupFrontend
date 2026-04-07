import { requestJson } from './http';

export function createUser(payload, token) {
  return requestJson('/api/usuarios', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
