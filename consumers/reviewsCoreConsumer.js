import 'dotenv/config';
import amqp from 'amqplib';
import pool from '../db.js';

// =================== Config ===================
const RABBIT_URL = process.env.RABBIT_MQ_URL;
const QUEUES = (process.env.CORE_QUEUES || 'core.ratings.queue')
  .split(',').map(s => s.trim()).filter(Boolean);
const DEDUP_CONSUMER_ID = process.env.DEDUP_CONSUMER_ID || 'ratings.core-unified';

// =================== Helpers ===================
const toDateOrNull = (v) => (v ? v : null);

// =================== USERS ===================
// RK: usuarios.usuario.creado (creado o actualizado)
async function handleUsuarioCreado(event) {
  // payload:
  // { evento: 'usuario_creado', idUsuario: 'u123', nombre: 'Juan Pérez', pais:'AR', fechaRegistro:'2025-08-20' }
  const d = event || {};
  const user_id = d.idUsuario;
  if (!user_id) return 'SKIP_USER_INVALID';

  // no viene email ni image; role por defecto 'user'
  const role = 'user';
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
  return 'USER_UPSERTED';
}

// RKs: usuarios.sesion.iniciada / finalizada / anonima  (solo log)
async function handleUsuarioSesion(_event, routingKey) {
  // Si quisieras persistir sesiones, creá una tabla y hacé upsert aquí
  return `USER_SESSION_${routingKey.split('.').pop().toUpperCase()}`;
}

// =================== SOCIAL ===================
// LIKE: social.like   | UNLIKE: social.unlike
async function handleSocialLike(event, routingKey) {
  // payload:
  // { evento: "like_review", idReview: "r789", idUsuario: "u555", fecha: "2025-08-22" }
  const d = event || {};
  const like_id = `${routingKey}-${Date.now()}-${Math.random().toString(16).slice(2)}`; // no viene id → generamos
  const review_id = d.idReview;
  const user_id = d.idUsuario;
  const created_at = d.fecha || new Date().toISOString();

  if (!review_id || !user_id) return 'SKIP_LIKE_INVALID';

  if (routingKey === 'social.like') {
    await pool.query(
      `INSERT INTO public.likes_cache (like_id, review_id, user_id, created_at, raw_event)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (like_id) DO NOTHING`,
      [like_id, review_id, user_id, created_at, JSON.stringify({ rk:routingKey, d:event })]
    );
    return 'LIKE_CREATED';
  } else {
    // social.unlike → no tenemos like_id original; borramos por (user_id, review_id)
    await pool.query(
      `DELETE FROM public.likes_cache WHERE user_id = $1 AND review_id = $2`,
      [user_id, review_id]
    );
    return 'LIKE_DELETED';
  }
}

// Comentarios / Follow / Publicaciones → por ahora solo log
async function handleSocialOther(_event, routingKey) {
  return `SOCIAL_${routingKey.replace(/\./g,'_').toUpperCase()}`;
}

// =================== MOVIES ===================
// RKs: peliculas.creada / peliculas.actualizada / peliculas.borrada
function extractMovieFromDataWrapper(evt) {
  // evento de películas viene con wrapper tipo cloud event:
  // { id, data:{ id, titulo, sinopsis, fechaEstreno, duracionMinutos, ... }, type:'peliculas.creada', ... }
  const data = evt?.data || {};
  return {
    id: data.id ?? null,
    title: data.titulo ?? null,
    description: data.sinopsis ?? null,
    release_date: toDateOrNull(data.fechaEstreno) ?? null,
    duration: data.duracionMinutos ?? null,
  };
}

async function handlePelicula(routingKey, evt) {
  const { id, title, description, release_date, duration } = extractMovieFromDataWrapper(evt);

  if (routingKey === 'peliculas.creada') {
    if (!id || !title) return 'SKIP_MOVIE_CREATED_INVALID';

    await pool.query(
      `INSERT INTO public.movies (id, title, description, release_date, duration)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO NOTHING`,
      [id, title, description, release_date, duration]
    );
    return 'MOVIE_CREATED';
  }

  if (routingKey === 'peliculas.actualizada') {
    if (!id) return 'SKIP_MOVIE_UPDATED_INVALID';

    await pool.query(
      `UPDATE public.movies
         SET title        = COALESCE($2, title),
             description  = COALESCE($3, description),
             release_date = COALESCE($4, release_date),
             duration     = COALESCE($5, duration)
       WHERE id = $1`,
      [id, title, description, release_date, duration]
    );
    return 'MOVIE_UPDATED';
  }

  if (routingKey === 'peliculas.borrada') {
    if (!id) return 'SKIP_MOVIE_DELETED_INVALID';
    await pool.query(`DELETE FROM public.movies WHERE id = $1`, [id]);
    return 'MOVIE_DELETED';
  }

  return 'IGNORED_MOVIE';
}

// =================== Router ===================
async function routeAndHandle(routingKey, payload) {
  // Usuarios
  if (routingKey === 'usuarios.usuario.creado') {
    return await handleUsuarioCreado(payload);
  }
  if (routingKey === 'usuarios.sesion.iniciada'
   || routingKey === 'usuarios.sesion.finalizada'
   || routingKey === 'usuarios.sesion.anonima') {
    return await handleUsuarioSesion(payload, routingKey);
  }

  // Social
  if (routingKey === 'social.like' || routingKey === 'social.unlike') {
    return await handleSocialLike(payload, routingKey);
  }
  if (
    routingKey === 'social.comment.create' || routingKey === 'social.comment.delete' ||
    routingKey === 'social.follow'         || routingKey === 'social.unfollow'      ||
    routingKey === 'social.publication.new'|| routingKey === 'social.publication.delete'
  ) {
    return await handleSocialOther(payload, routingKey);
  }

  // Películas
  if (
    routingKey === 'peliculas.creada' ||
    routingKey === 'peliculas.actualizada' ||
    routingKey === 'peliculas.borrada'
  ) {
    return await handlePelicula(routingKey, payload);
  }

  return `IGNORED_${routingKey.replace(/\./g,'_').toUpperCase()}`;
}

// =================== Runner ===================
(async function start() {
  if (!RABBIT_URL) throw new Error('Falta RABBIT_MQ_URL');
  const conn = await amqp.connect(RABBIT_URL);

  for (const q of QUEUES) {
    const ch = await conn.createChannel();
    await ch.checkQueue(q);
    ch.prefetch(20);
    console.log(`🟢 Escuchando cola "${q}"`);

    ch.consume(q, async (msg) => {
      if (!msg) return;
      const rk = msg.fields.routingKey;
      try {
        const raw = msg.content.toString();
        const payload = JSON.parse(raw);

        const res = await routeAndHandle(rk, payload);
        if (!String(res).startsWith('IGNORED')) {
          console.log(`✅ ${res} rk=${rk}`);
        }
        ch.ack(msg);
      } catch (e) {
        console.error('❌ Error procesando:', e);
        ch.nack(msg, false, false);
      }
    }, { noAck: false });
  }

  process.on('SIGINT', async () => {
    try { await conn.close(); } finally { process.exit(0); }
  });
})().catch((e) => { console.error('Fatal:', e); process.exit(1); });
