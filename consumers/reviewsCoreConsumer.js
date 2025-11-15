import "dotenv/config";
import amqp from "amqplib";
import pool from "../db.js";

// =================== Config ===================
const RABBIT_URL = process.env.RABBIT_MQ_URL;
const QUEUES = (process.env.CORE_QUEUES || "core.ratings.queue")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// =================== Helpers ===================
const toDateOrNull = (v) => (v ? v : null);

// =================== USERS ===================
async function handleUsuarioCreado(event) {
  console.log("📥 usuarios.usuario.creado recibido:", event);

  const d = event?.data || event || {};

  // idUsuario llega como string, ej: "187" → lo pasamos a entero
  const user_id = Number.parseInt(d.idUsuario, 10);
  if (!Number.isInteger(user_id)) {
    console.log("⚠️ SKIP_USER_INVALID idUsuario inválido:", d.idUsuario);
    return "SKIP_USER_INVALID";
  }

  const role = "user";
  const permissions = null;
  const is_active = true;
  const full_name = d.nombre || null;

  let name = null;
  let last_name = null;
  if (full_name) {
    const parts = full_name.trim().split(/\s+/);
    name = parts[0] || null;
    last_name = parts.length > 1 ? parts.slice(1).join(" ") : null;
  }

  const sql = `
    INSERT INTO users_cache (
      user_id,
      role,
      permissions,
      is_active,
      name,
      last_name,
      full_name,
      email,
      image_url,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
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
  `;

  await pool.query(sql, [
    user_id,
    role,
    permissions,
    is_active,
    name,
    last_name,
    full_name,
    null, // email
    null, // image_url
  ]);

  console.log(`✅ USER_UPSERTED user_id=${user_id}`);
  return "USER_UPSERTED";
}

async function handleUsuarioActualizado(event) {
  console.log("📥 usuarios.usuario.actualizado recibido:", event);

  const d = event?.data || event || {};

  // idUsuario puede venir como string -> lo pasamos a entero
  const user_id = Number.parseInt(d.idUsuario ?? d.userId ?? d.user_id, 10);
  if (!Number.isInteger(user_id)) {
    console.log("⚠️ SKIP_USER_UPDATE_INVALID idUsuario inválido:", d.idUsuario);
    return "SKIP_USER_UPDATE_INVALID";
  }

  // Campos opcionales (solo se aplican si vienen definidos)
  const full_name = d.nombre ?? d.fullName ?? d.full_name ?? null;
  const email = d.email ?? null;
  const image_url = d.imagen ?? d.imageUrl ?? d.image_url ?? null;
  const role = d.rol ?? d.role ?? null;
  const permissions = d.permissions ?? null;

  // is_active puede venir como 'activo', 'is_active', etc.
  const is_active =
    typeof d.activo === "boolean"
      ? d.activo
      : typeof d.is_active === "boolean"
      ? d.is_active
      : null;

  // Derivamos name / last_name si vino full_name
  let name = null,
    last_name = null;
  if (typeof full_name === "string" && full_name.trim()) {
    const parts = full_name.trim().split(/\s+/);
    name = parts[0] || null;
    last_name = parts.length > 1 ? parts.slice(1).join(" ") : null;
  }

  const sql = `
    INSERT INTO users_cache (
      user_id,
      role,
      permissions,
      is_active,
      name,
      last_name,
      full_name,
      email,
      image_url,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      role        = COALESCE(EXCLUDED.role,        users_cache.role),
      permissions = COALESCE(EXCLUDED.permissions, users_cache.permissions),
      is_active   = COALESCE(EXCLUDED.is_active,   users_cache.is_active),
      name        = COALESCE(EXCLUDED.name,        users_cache.name),
      last_name   = COALESCE(EXCLUDED.last_name,   users_cache.last_name),
      full_name   = COALESCE(EXCLUDED.full_name,   users_cache.full_name),
      email       = COALESCE(EXCLUDED.email,       users_cache.email),
      image_url   = COALESCE(EXCLUDED.image_url,   users_cache.image_url),
      updated_at  = NOW()
  `;

  await pool.query(sql, [
    user_id,
    role,
    permissions,
    is_active,
    name,
    last_name,
    full_name,
    email,
    image_url,
  ]);

  console.log(`✅ USER_UPDATED user_id=${user_id}`);
  return "USER_UPDATED";
}

async function handleUsuarioSesion(_event, routingKey) {
  return `USER_SESSION_${routingKey.split(".").pop().toUpperCase()}`;
}

async function handleUsuarioEliminado(event) {
  const d = event?.data || event || {};
  const user_id = Number.parseInt(d.idUsuario, 10);

  if (!Number.isInteger(user_id)) {
    console.log("⚠️ SKIP_USER_DELETE_INVALID idUsuario inválido:", d.idUsuario);
    return "SKIP_USER_DELETE_INVALID";
  }

  await pool.query(
    `
    UPDATE users_cache
       SET is_active = FALSE,
           updated_at = NOW()
     WHERE user_id = $1
    `,
    [user_id]
  );

  console.log(`✅ USER_DEACTIVATED user_id=${user_id}`);
  return "USER_DEACTIVATED";
}

async function handleUsuarioReactivado(event) {
  const d = event?.data || event || {};
  const user_id = Number.parseInt(d.idUsuario, 10);

  if (!Number.isInteger(user_id)) {
    console.log(
      "⚠️ SKIP_USER_REACTIVATE_INVALID idUsuario inválido:",
      d.idUsuario
    );
    return "SKIP_USER_REACTIVATE_INVALID";
  }

  await pool.query(
    `
    UPDATE users_cache
       SET is_active = TRUE,
           updated_at = NOW()
     WHERE user_id = $1
    `,
    [user_id]
  );

  console.log(`✅ USER_REACTIVATED user_id=${user_id}`);
  return "USER_REACTIVATED";
}

// =================== SOCIAL (ME GUSTA) ===================

// Intenta parsear el evento si vino como string JSON
function parseEvent(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

// Obtenemos SOLO el review_id desde el wrapper o desde data
function extractReviewId(evt = {}) {
  const parsed = parseEvent(evt);
  const d = parsed.data || parsed; // si viene envuelto (cloud event), usamos data

  return (
    d.reviewId ??
    d.idReview ??
    d.review_id ??
    d.id_resena ??
    d.idResena ??
    d.idPublicacion ??
    d.publicacionId ??
    d.target_id ?? // <- el que manda social
    null
  );
}

function extractCreatedAt(evt = {}) {
  const parsed = parseEvent(evt);
  const d = parsed.data || parsed;
  return d.timestamp || parsed.fecha || new Date().toISOString();
}

function isReviewLike(evt = {}) {
  const parsed = parseEvent(evt);
  const d = parsed.data || parsed;
  const targetType = d.metadata?.target_type || d.target_type;
  if (targetType && targetType !== "review") return false;
  return true;
}

export async function handleSocialLike(event, routingKey) {
  const parsedEvent = parseEvent(event);

  if (!isReviewLike(parsedEvent)) {
    return "IGNORED_SOCIAL_NOT_REVIEW";
  }

  const review_id = extractReviewId(parsedEvent);
  const created_at = extractCreatedAt(parsedEvent);

  if (!review_id) {
    console.log("⚠️ SKIP_LIKE_INVALID (sin review_id) payload=", parsedEvent);
    return "SKIP_LIKE_INVALID";
  }

  if (routingKey === "social.megusta.creado") {
    await pool.query(
      `INSERT INTO likes_cache (review_id, created_at, raw_event)
       VALUES ($1, $2, $3)`,
      [
        review_id,
        created_at,
        JSON.stringify({ rk: routingKey, d: parsedEvent }),
      ]
    );
    return "LIKE_CREATED";
  }

  if (routingKey === "social.megusta.borrado") {
    await pool.query(
      `DELETE FROM likes_cache
       WHERE ctid IN (
         SELECT ctid
         FROM likes_cache
         WHERE review_id = $1
         ORDER BY created_at DESC
         LIMIT 1
       )`,
      [review_id]
    );
    return "LIKE_DELETED";
  }

  return "IGNORED_SOCIAL";
}

// =================== MOVIES ===================

function extractMovieFromDataWrapper(evt) {
  const data = evt?.data || {};

  const releaseDate = data.fechaEstreno || null;
  const year = releaseDate ? Number(String(releaseDate).slice(0, 4)) : null;

  const genre =
    Array.isArray(data.generos) && data.generos.length
      ? data.generos.map((g) => g.nombre).join(", ")
      : null;

  const directorName = data.director?.nombre || null;

  return {
    id: data.id ?? null,
    title: data.titulo ?? null,
    description: data.sinopsis ?? null,
    release_date: toDateOrNull(releaseDate),
    year,
    genre,
    director: directorName,
    duration: data.duracionMinutos ?? null,
    poster_url: data.poster ?? null,
  };
}

async function handlePelicula(routingKey, evt) {
  const m = extractMovieFromDataWrapper(evt);
  const {
    id,
    title,
    description,
    release_date,
    year,
    genre,
    director,
    duration,
    poster_url,
  } = m;

  if (routingKey === "peliculas.pelicula.creada") {
    if (!id || !title) {
      console.log("⚠️ SKIP_MOVIE_CREATED_INVALID payload=", evt);
      return "SKIP_MOVIE_CREATED_INVALID";
    }

    await pool.query(
      `INSERT INTO movies
        (id, title, year, genre, director, duration, poster_url, description, release_date, activa)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         title        = EXCLUDED.title,
         year         = EXCLUDED.year,
         genre        = EXCLUDED.genre,
         director     = EXCLUDED.director,
         duration     = EXCLUDED.duration,
         poster_url   = EXCLUDED.poster_url,
         description  = EXCLUDED.description,
         release_date = EXCLUDED.release_date,
         activa = TRUE
      `,
      [
        id,
        title,
        year,
        genre,
        director,
        duration,
        poster_url,
        description,
        release_date,
        true,
      ]
    );
    return "MOVIE_CREATED";
  }

  if (routingKey === "peliculas.pelicula.actualizada") {
    if (!id) {
      console.log("⚠️ SKIP_MOVIE_UPDATED_INVALID payload=", evt);
      return "SKIP_MOVIE_UPDATED_INVALID";
    }

    const d = evt?.data || evt;
    const activeFlag = d.activa ?? d.estado ?? d.active ?? d.is_active ?? null; // Si no viene, queda null y NO se cambia

    await pool.query(
      `UPDATE movies
         SET
           title        = COALESCE($2, title),
           year         = COALESCE($3, year),
           genre        = COALESCE($4, genre),
           director     = COALESCE($5, director),
           duration     = COALESCE($6, duration),
           poster_url   = COALESCE($7, poster_url),
           description  = COALESCE($8, description),
           release_date = COALESCE($9, release_date),
           activa       = COALESCE($10, activa)
       WHERE id = $1`,
      [
        id,
        title,
        year,
        genre,
        director,
        duration,
        poster_url,
        description,
        release_date,
        true,
      ]
    );

    if (typeof activeFlag === "boolean") {
      await pool.query(
        `UPDATE reviews
         SET estado = $2
       WHERE movie_id = $1`,
        [id, activeFlag]
      );
    }

    return "MOVIE_UPDATED";
  }

  if (routingKey === "peliculas.pelicula.borrada") {
    if (!id) {
      console.log("⚠️ SKIP_MOVIE_DELETED_INVALID payload=", evt);
      return "SKIP_MOVIE_DELETED_INVALID";
    }
    await pool.query(`UPDATE movies SET activa = FALSE WHERE id = $1`, [id]);
    await pool.query(
      `UPDATE reviews
SET estado = FALSE,
    updated_at = NOW()
WHERE movie_id = $1
  AND estado = TRUE;
`,
      [id]
    );
    return "MOVIE_DELETED";
  }

  return "IGNORED_MOVIE";
}

// =================== Router ===================
async function routeAndHandle(routingKey, payload) {
  // Usuarios
  if (routingKey === "usuarios.usuario.creado") {
    return await handleUsuarioCreado(payload);
  }
  if (routingKey === "usuarios.usuario.actualizado") {
    return await handleUsuarioActualizado(payload);
  }
  if (routingKey === "usuarios.usuario.eliminado") {
    return await handleUsuarioEliminado(payload);
  }
  if (routingKey === "usuarios.usuario.reactivado") {
    return await handleUsuarioReactivado(payload);
  }
  if (
    routingKey === "usuarios.sesion.iniciada" ||
    routingKey === "usuarios.sesion.finalizada" ||
    routingKey === "usuarios.sesion.anonima"
  ) {
    return await handleUsuarioSesion(payload, routingKey);
  }

  // Social: solo megusta creado/borrado
  if (
    routingKey === "social.megusta.creado" ||
    routingKey === "social.megusta.borrado"
  ) {
    return await handleSocialLike(payload, routingKey);
  }
  if (routingKey.startsWith("social.")) {
    return `IGNORED_SOCIAL_${routingKey.replace(/\./g, "_").toUpperCase()}`;
  }

  // Películas
  if (
    routingKey === "peliculas.pelicula.creada" ||
    routingKey === "peliculas.pelicula.actualizada" ||
    routingKey === "peliculas.pelicula.borrada"
  ) {
    return await handlePelicula(routingKey, payload);
  }

  return `IGNORED_${routingKey.replace(/\./g, "_").toUpperCase()}`;
}

// =================== Exported Runner ===================
let _running = false;
let conn;

export async function startCoreConsumer() {
  if (_running) {
    console.log("⚠️ Core consumer ya estaba corriendo, skip.");
    return;
  }
  if (!RABBIT_URL) throw new Error("Falta RABBIT_MQ_URL");
  _running = true;

  conn = await amqp.connect(RABBIT_URL);

  for (const q of QUEUES) {
    const ch = await conn.createChannel();
    await ch.checkQueue(q);
    ch.prefetch(20);
    console.log(`🟢 Escuchando cola "${q}"`);

    ch.consume(
      q,
      async (msg) => {
        if (!msg) return;
        const rk = msg.fields.routingKey;
        try {
          const raw = msg.content.toString();
          const payload = JSON.parse(raw);

          const res = await routeAndHandle(rk, payload);
          console.log(`[${rk}] -> ${res}`);
          ch.ack(msg);
        } catch (e) {
          console.error("❌ Error procesando:", e);
          ch.nack(msg, false, false); // no requeue mensajes rotos
        }
      },
      { noAck: false }
    );
  }

  process.on("SIGINT", async () => {
    try {
      if (conn) await conn.close();
    } finally {
      process.exit(0);
    }
  });

  console.log("🐇 Core consumer iniciado y escuchando eventos del Core");
}
