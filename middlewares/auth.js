import pool from "../db.js";
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS_URL = process.env.USERS_JWKS_URL;
if (!JWKS_URL) throw new Error("USERS_JWKS_URL no configurado");

const JWKS = createRemoteJWKSet(new URL(JWKS_URL), {
  cacheMaxAge: 10 * 60 * 1000, // 10min
  cooldownDuration: 60 * 1000, // 1min
});

/** Extrae Bearer token de Authorization o X-Access-Token */
function extractToken(req) {
  const h = req.headers['authorization'] || '';
  if (h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
  if (req.headers['x-access-token']) return String(req.headers['x-access-token']).trim();
  if (h && h.split('.').length === 3) return h.trim();
  return null;
}

async function upsertUsersCache(profile) {
  const role = profile.role;
  const permissions =
    role === "admin" || role === "moderator" ? profile.permissions || [] : null;

  await pool.query(
    `
    INSERT INTO users_cache (
      user_id, role, permissions, is_active, name, last_name, full_name, email, image_url, updated_at
    )
    VALUES ($1,$2,$3,COALESCE($4,TRUE),$5,$6,$7,$8,$9, now())
    ON CONFLICT (user_id) DO UPDATE SET
      role        = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      is_active   = COALESCE(EXCLUDED.is_active, users_cache.is_active),
      name        = COALESCE(EXCLUDED.name, users_cache.name),
      last_name   = COALESCE(EXCLUDED.last_name, users_cache.last_name),
      full_name   = COALESCE(EXCLUDED.full_name, users_cache.full_name),
      email       = COALESCE(EXCLUDED.email, users_cache.email),
      image_url   = COALESCE(EXCLUDED.image_url, users_cache.image_url),
      updated_at  = now()
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
      profile.image_url,
    ]
  );
}

export function authenticate() {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token)
        return res.status(401).json({ error: "Missing bearer token" });

      const issuer = process.env.JWT_EXPECT_ISS;
      const audience = process.env.JWT_EXPECT_AUD;
      const clockTolerance = Number(process.env.JWT_CLOCK_TOLERANCE_SEC || 60);

      const { payload, protectedHeader } = await jwtVerify(token, JWKS, {
        algorithms: ["RS256"],
        ...(issuer ? { issuer } : {}),
        ...(audience ? { audience } : {}),
        clockTolerance,
      });

      // Normalización
      const normalized = {
        user_id: payload.user_id,
        role: payload.role,
        permissions:
          payload.role === "admin" || payload.role === "moderator"
            ? payload.permissions || []
            : [],
        is_active: payload.is_active !== false,
        name: payload.name,
        last_name: payload.last_name,
        full_name: payload.full_name,
        email: payload.email,
        image_url: payload.image_url,
        exp: payload.exp,
        _jwt_kid: protectedHeader.kid,
      };

      req.user = normalized;

      // Guardá/actualizá el cache en segundo plano (no bloqueante)
      upsertUsersCache(normalized).catch((err) =>
        console.warn("[users_cache upsert] non-blocking error:", err.message)
      );

      return next();
    } catch (err) {
      const msg =
        err?.code === "ERR_JWT_EXPIRED"
          ? "Token expired"
          : err?.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED"
          ? "Invalid signature"
          : err?.code === "ERR_JWT_CLAIM_VALIDATION_FAILED"
          ? "Invalid token claims"
          : err?.message || "Invalid token";

      return res.status(401).json({ error: msg });
    }
  };
}

/** Guard: por rol */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: role" });
    }
    next();
  };
}

/** Guard: por permiso */
export function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const isPrivileged = ["admin", "moderator"].includes(req.user.role);
    const userPerms = req.user.permissions || [];
    const ok = isPrivileged || perms.every((p) => userPerms.includes(p));
    if (!ok) return res.status(403).json({ error: "Forbidden: permission" });
    next();
  };
}
