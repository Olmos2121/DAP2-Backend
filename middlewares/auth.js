export function authenticate() {
  return async (req, res, next) => {
    try {
      const token = extractToken(req);
      if (!token) {
        return res.status(401).json({ error: "Missing bearer token" });
      }

      const issuer = process.env.JWT_EXPECT_ISS;
      const audience = process.env.JWT_EXPECT_AUD;
      const clockTolerance = Number(process.env.JWT_CLOCK_TOLERANCE_SEC || 60);

      const { payload, protectedHeader } = await jwtVerify(token, JWKS, {
        algorithms: ["RS256"],
        ...(issuer ? { issuer } : {}),
        ...(audience ? { audience } : {}),
        clockTolerance,
      });

      console.log(
        "[auth] kid=%s sub=%s user_id=%s role=%s perms=%s exp=%s",
        protectedHeader?.kid,
        payload?.sub,
        payload?.user_id,
        payload?.role,
        Array.isArray(payload?.permissions)
          ? payload.permissions.join(",")
          : payload?.permissions,
        payload?.exp
      );

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

      // upsert no bloqueante
      upsertUsersCache(normalized).catch((e) => {
        console.warn(
          "[users_cache upsert] non-blocking error:",
          e?.message || e
        );
      });

      return next();
    } catch (err) {
      console.error("[auth] JWT error:", err);

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
