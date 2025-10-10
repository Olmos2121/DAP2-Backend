import amqplib from "amqplib";
import pg from "pg";

const { Pool } = pg;

// ====== Config ======
const RABBIT_URL =
  process.env.RABBIT_URL || "amqp://guest:guest@127.0.0.1:5672";

const USERS_QUEUE = process.env.USERS_QUEUE || "reviews.user-events.q"; // <-- cola que te asigna el core
const DEDUP_CONSUMER_ID = process.env.DEDUP_CONSUMER_ID || "users.consumer";

// const CREATE_QUEUE = (process.env.CREATE_QUEUE || "false").toLowerCase() === "true";
const CREATE_QUEUE = "true";

// DB
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  database: process.env.DB_NAME || "DAPI2",
  password: process.env.DB_PASS || "admin123",
  port: +(process.env.DB_PORT || 5432),
});

function isAdminOrModerator(role) {
  return role === "admin" || role === "moderator";
}

async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await fn(client);
    await client.query("COMMIT");
    return res;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/** Idempotencia básica por trace_id */
async function acquireDedup(client, traceId, consumerId) {
  if (!traceId) return true; // si no vino trace_id, procesamos igual
  const r = await client.query(
    `INSERT INTO user_event_dedup(trace_id, consumer) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [traceId, consumerId]
  );
  return r.rowCount === 1;
}

async function upsertUserSnapshot(client, data) {
  const role = data.role;
  const permissions = isAdminOrModerator(role) ? data.permissions ?? [] : null;

  await client.query(
    `
    INSERT INTO users_cache (user_id, role, permissions, is_active, name, last_name, full_name, email, image_url, updated_at)
    VALUES ($1, $2, $3, COALESCE($4, TRUE), $5, $6, $7, $8, $9, NOW())
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
      data.user_id,
      role,
      permissions,
      data.is_active,
      data.name,
      data.last_name,
      data.full_name,
      data.email,
      data.image_url,
    ]
  );
}

async function applyEvent(client, evt) {
  const { event, data } = evt;

  // si no hay usuario, no hacemos nada
  if (!data?.user_id) return;

  switch (event) {
    case "user.created":
    case "user.updated.profile":
    case "user.updated.role":
    case "user.updated.permissions":
    case "user.activated":
    case "user.deactivated":
    case "user.deleted":
      await upsertUserSnapshot(client, data);
      break;
    default:
      break;
  }
}

async function start() {
  console.log("AMQP URL:", RABBIT_URL);
  console.log("Users queue:", USERS_QUEUE, " | createQueue:", CREATE_QUEUE);

  const conn = await amqplib.connect(RABBIT_URL);
  const ch = await conn.createChannel();

  // NO tocamos exchanges ni bindings; solo aseguramos la cola si nos lo piden
  if (CREATE_QUEUE) {
    await ch.assertQueue(USERS_QUEUE, { durable: true });
  } else {
    // checkQueue falla si no existe (ayuda a detectar mal config)
    await ch.checkQueue(USERS_QUEUE);
  }

  ch.prefetch(20);

  ch.consume(USERS_QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const raw = msg.content.toString();
      const evt = JSON.parse(raw);

      // dedup por trace_id (si viene)
      const traceId = evt?.meta?.trace_id || null;
      await withTx(async (client) => {
        const ok = await acquireDedup(client, traceId, DEDUP_CONSUMER_ID);
        if (!ok) {
          // ya procesado por ESTE consumer
          return;
        }
        await applyEvent(client, evt);
      });

      ch.ack(msg);
    } catch (e) {
      console.error("Users consumer error:", e.message);
      // rechazamos sin requeue (si core quiere DLX, lo configurará en la cola)
      ch.nack(msg, false, false);
    }
  }, { noAck: false });

  console.log("✅ Users consumer minimal iniciado.");
}

start().catch((e) => {
  console.error("Fatal users consumer:", e);
  process.exit(1);
});