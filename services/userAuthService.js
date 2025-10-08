import fetch from 'node-fetch';

const BASE = process.env.USERS_BASE_URL;
const ME_PATH = process.env.AUTH_ME_PATH || '/api/v1/auth/me';
const TIMEOUT = +(process.env.AUTH_TIMEOUT_MS || 3000);

/**
 * Llama a /auth/me. Devuelve el perfil si el token es válido.
 * Tira Error con status 401 si es inválido.
 */
export async function fetchUserProfileFromUsersService(token) {
  if (!BASE) throw new Error('USERS_BASE_URL no configurado');
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${BASE}${ME_PATH}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });

    if (res.status === 401) {
      const body = await safeJson(res);
      const err = new Error('Unauthorized');
      err.status = 401;
      err.body = body;
      throw err;
    }
    if (!res.ok) {
      const body = await safeJson(res);
      const err = new Error(`Users service error: ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') {
      const err = new Error('Users service timeout');
      err.status = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
