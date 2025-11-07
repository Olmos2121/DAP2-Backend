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
  const d = event || {};
  const user_id = d.idUsuario;
  if (!user_id) return "SKIP_USER_INVALID";

  const role = "user";
  const permissions = null;
  const is_active = true;
  const full_name = d.nombre || null;

  await pool.query(
    `INSERT INTO public.users_cache
      (user_id, role, permissions, is_active, name, last_name, full_name, email, image_url, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       role        = EXCLUDED.role,
       permissions = EXCLUDED.permissions,
       is_active   = COALESCE(EXCLUDED.is_active, public.users_cache.is_active),
       name        = COALESCE(EXCLUDED.name, public.users_cache.name),
       last_name   = COALESCE(EXCLUDED.last_name, public.users_cache.last_name),
       full_name   = COALESCE(EXCLUDED.full_name, public.users_cache.full_name),
       email       = COALESCE(EXCLUDED.email, public.users_cache.email),
       image_url   = COALESCE(EXCLUDED.image_url, public.users_cache.image_url),
       updated_at  = NOW()`,
    [user_id, role, permissions, is_active, null, null, full_name, null, null]
  );
  return "USER_UPSERTED";
}

async function handleUsuarioSesion(_event, routingKey) {
  return `USER_SESSION_${routingKey.split(".").pop().toUpperCase()}`;
}

// =================== SOCIAL (ME GUSTA) ===================

function extractLikeIds(d = {}) {
  const review_id =
    d.reviewId ??
    d.idReview ??
    d.review_id ??
    d.id_resena ??
    d.idResena ??
    d.idPublicacion ??
    d.publicacionId ??
    null;

  const user_id =
    d.userId ??
    d.idUsuario ??
    d.user_id ??
    d.id_usuario ??
    null;

  return { review_id, user_id };
}

// Solo guardamos megusta creado/borrado
async function handleSocialLike(event, routingKey) {
  const { review_id, user_id } = extractLikeIds(event);
  const created_at = event?.fecha || new Date().toISOString();

  if (!review_id || !user_id) {
    console.log("⚠️ SKIP_LIKE_INVALID payload=", event);
    return "SKIP_LIKE_INVALID";
  }

  const like_id = `${review_id}-${user_id}`; // 1 like por (review, user)

  if (routingKey === "social.megusta.creado") {
    await pool.query(
      `INSERT INTO public.likes_cache (like_id, review_id, user_id, created_at, raw_event)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (like_id) DO NOTHING`,
      [
        like_id,
        review_id,
        user_id,
        created_at,
        JSON.stringify({ rk: routingKey, d: event }),
      ]
    );
    return "LIKE_CREATED";
  }

  if (routingKey === "social.megusta.borrado") {
    await pool.query(
      `DELETE FROM public.likes_cache WHERE like_id = $1`,
      [like_id]
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
      `INSERT INTO public.movies
        (id, title, year, genre, director, duration, poster_url, description, release_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         title        = EXCLUDED.title,
         year         = EXCLUDED.year,
         genre        = EXCLUDED.genre,
         director     = EXCLUDED.director,
         duration     = EXCLUDED.duration,
         poster_url   = EXCLUDED.poster_url,
         description  = EXCLUDED.description,
         release_date = EXCLUDED.release_date`,
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
      ]
    );
    return "MOVIE_CREATED";
  }

  if (routingKey === "peliculas.pelicula.actualizada") {
    if (!id) {
      console.log("⚠️ SKIP_MOVIE_UPDATED_INVALID payload=", evt);
      return "SKIP_MOVIE_UPDATED_INVALID";
    }

    await pool.query(
      `UPDATE public.movies
         SET
           title        = COALESCE($2, title),
           year         = COALESCE($3, year),
           genre        = COALESCE($4, genre),
           director     = COALESCE($5, director),
           duration     = COALESCE($6, duration),
           poster_url   = COALESCE($7, poster_url),
           description  = COALESCE($8, description),
           release_date = COALESCE($9, release_date)
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
      ]
    );
    return "MOVIE_UPDATED";
  }

  if (routingKey === "peliculas.pelicula.borrada") {
    if (!id) {
      console.log("⚠️ SKIP_MOVIE_DELETED_INVALID payload=", evt);
      return "SKIP_MOVIE_DELETED_INVALID";
    }
    await pool.query(`DELETE FROM public.movies WHERE id = $1`, [id]);
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
