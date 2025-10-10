import { fetchUserProfileFromUsersService } from '../services/userAuthService.js';
import pool from '../db.js';

const ALLOW_CACHE_FALLBACK = (process.env.ALLOW_CACHE_FALLBACK || 'false').toLowerCase() === 'true';

/** Extrae Bearer token de Authorization o X-Access-Token */
function extractToken(req) {
  const h = req.headers['authorization'] || '';
  if (h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
  if (req.headers['x-access-token']) return String(req.headers['x-access-token']);
  return null;
}

/** Enriquecer/actualizar users_cache con lo que devuelve /me */
async function upsertUsersCache(profile) {
  // role/permissions: si user estándar → permissions = NULL
  const role = profile.role;
  const permissions = (role === 'admin' || role === 'moderator') ? (profile.permissions || []) : null;

  await pool.query(
    `
    INSERT INTO users_cache (user_id, role, permissions, is_active, name, last_name, full_name, email, image_url, updated_at)
    VALUES ($1,$2,$3,COALESCE($4,TRUE),$5,$6,$7,$8,$9,NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      role        = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      is_active   = COALESCE(EXCLUDED.is_active, users_cache.is_active),
      name        = COALESCE(EXCLUDED.name, users_cache.name),
      last_name   = COALESCE(EXCLUDED.last_name, users_cache.last_name),
      full_name   = COALESCE(EXCLUDED.full_name, users_cache.full_name),
      email       = COALESCE(EXCLUDED.email, users_cache.email),
      image_url   = COALESCE(EXCLUDED.image_url, users_cache.image_url),
      updated_at  = NOW()
    `,
    [
      profile.user_id,
      role,
      permissions,
      profile.is_active,
      profile.name,
      profile.last_name,
      profile.full_name,
      profile.email,
      profile.image_url
    ]
  );
}

/** Fallback (opcional) si Users está caído: buscamos el usuario en users_cache */
async function findUserInCache(userId) {
  if (!userId) return null;
  const r = await pool.query(`SELECT * FROM users_cache WHERE user_id = $1`, [userId]);
  return r.rows[0] || null;
}

/** Middleware principal: valida token contra /auth/me y adjunta req.user */
export function authenticate() {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) return res.status(401).json({ error: 'Missing bearer token' });

      const profile = await fetchUserProfileFromUsersService(token);
      // Guard de seguridad básico
      if (profile?.is_active === false) {
        return res.status(403).json({ error: 'User disabled' });
      }

      // Enriquecé/actualizá cache (no bloqueante si falla)
      upsertUsersCache(profile).catch(() => {});

      req.user = normalizeProfile(profile);
      return next();
    } catch (e) {
      // Si Users está caído y habilitaste fallback, intentá con cache
      if (ALLOW_CACHE_FALLBACK && (e.status >= 500 || e.status === 504)) {
        const token = extractToken(req);
        // Si tu front manda además el user_id (p.ej. en header), podrías tomarlo de ahí.
        // Como el JWT es opaco para nosotros, NO lo parseamos. Este fallback sólo sirve
        // si tu ruta ya sabe a qué user apunta (p.ej. /users/:id) y coinciden.
        const userId = Number(req.params?.user_id || req.query?.user_id);
        if (userId) {
          const cached = await findUserInCache(userId);
          if (cached && cached.is_active !== false) {
            req.user = normalizeProfileFromCache(cached);
            req.user._from_cache = true;
            return next();
          }
        }
      }
      const code = e.status || 401;
      return res.status(code).json({ error: e.message || 'Unauthorized' });
    }
  };
}

/** Guard: por rol */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: role' });
    }
    next();
  };
}

/** Guard: por permiso */
export function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    // User estándar → no tiene array de permisos (es null/undefined)
    const userPerms = req.user.permissions || [];
    const ok = perms.every(p => userPerms.includes(p));
    if (!ok) return res.status(403).json({ error: 'Forbidden: permission' });
    next();
  };
}

/** Normaliza estructura del /me para usarla internamente */
function normalizeProfile(p) {
  return {
    user_id: p.user_id,
    role: p.role,
    permissions: (p.role === 'admin' || p.role === 'moderator') ? (p.permissions || []) : null,
    is_active: p.is_active !== false,
    name: p.name,
    last_name: p.last_name,
    full_name: p.full_name,
    email: p.email,
    image_url: p.image_url,
    exp: p.exp,
  };
}

/** Normaliza desde cache (por si hay fallback) */
function normalizeProfileFromCache(c) {
  return {
    user_id: c.user_id,
    role: c.role,
    permissions: c.permissions, // puede ser null
    is_active: c.is_active !== false,
    name: c.name,
    last_name: c.last_name,
    full_name: c.full_name,
    email: c.email,
    image_url: c.image_url,
    exp: null,
  };
}
