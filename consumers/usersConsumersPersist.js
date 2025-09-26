import amqplib from "amqplib";
import pg from "pg";

const { Pool } = pg;

// ====== Config ======
const RABBIT_URL =
  process.env.RABBIT_URL || "amqp://guest:guest@localhost:5672";

const EX_EVENTS = process.env.USERS_EVENTS_EXCHANGE || "users.events";
const EX_BROADCAST = process.env.USERS_BROADCAST_EXCHANGE || "users.broadcast";
const EX_DLX = process.env.USERS_DLX_EXCHANGE || "users.dlx";

const Q_SNAPSHOTS = process.env.Q_USERS_SNAPSHOTS || "reviews.user-snapshots.q";
const Q_BROADCAST = process.env.Q_USERS_BROADCAST || "reviews.broadcast.q";
const Q_AUTH = process.env.Q_USERS_AUTH || "reviews.auth-cache.q";

const CONSUMER_SNAP = "users.snapshots";
const CONSUMER_AUTH = "users.auth";
const CONSUMER_BCAST = "users.broadcast";

const USE_DLX = (process.env.USE_DLX ?? "true").toLowerCase() === "true";

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

async function updateRole(client, data) {
  const role = data.role;
  const permissions = isAdminOrModerator(role) ? data.permissions ?? [] : null;

  await client.query(
    `
    INSERT INTO users_cache (user_id, role, permissions, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      role        = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      updated_at  = NOW()
    `,
    [data.user_id, role, permissions]
  );
}

async function updatePermissions(client, data) {
  const role = data.role; // puede o no venir en el evento
  if (role && !isAdminOrModerator(role)) {
    await client.query(
      `UPDATE users_cache SET permissions = NULL, updated_at = NOW() WHERE user_id = $1`,
      [data.user_id]
    );
    return;
  }

  await client.query(
    `
    UPDATE users_cache
       SET permissions = $2,
           updated_at  = NOW()
     WHERE user_id = $1
    `,
    [data.user_id, data.permissions ?? []]
  );
}

async function setActive(client, userId, active) {
  await client.query(
    `UPDATE users_cache SET is_active = $2, updated_at = NOW() WHERE user_id = $1`,
    [userId, active]
  );
}

async function deleteUser(client, userId) {
  await client.query(
    `UPDATE users_cache SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1`,
    [userId]
  );
  // o DELETE si preferís:
  // await client.query(`DELETE FROM users_cache WHERE user_id = $1`, [userId]);
}

function parseMsg(msg) {
  return JSON.parse(msg.content.toString());
}

// ====== Infra Rabbit ======
async function assertQueueCompat(ch, queueName, { useDlx = true } = {}) {
  if (useDlx) {
    await ch.assertExchange(EX_DLX, "direct", { durable: true });
    await ch.assertQueue(queueName, {
      durable: true,
      arguments: { "x-dead-letter-exchange": EX_DLX },
    });
  } else {
    await ch.assertQueue(queueName, { durable: true });
  }
}

async function start() {
  const conn = await amqplib.connect(RABBIT_URL);
  const ch = await conn.createChannel();

  // Exchanges base
  await ch.assertExchange(EX_EVENTS, "topic", { durable: true });
  await ch.assertExchange(EX_BROADCAST, "fanout", { durable: true });
  if (USE_DLX) await ch.assertExchange(EX_DLX, "direct", { durable: true });

  // Queues
  await assertQueueCompat(ch, Q_SNAPSHOTS);
  await assertQueueCompat(ch, Q_BROADCAST, { useDlx: false });
  await assertQueueCompat(ch, Q_AUTH);

  // Bindings
  await ch.bindQueue(Q_SNAPSHOTS, EX_EVENTS, "user.*");
  await ch.bindQueue(Q_BROADCAST, EX_BROADCAST, "");

  await ch.bindQueue(Q_AUTH, EX_EVENTS, "user.updated.role");
  await ch.bindQueue(Q_AUTH, EX_EVENTS, "user.updated.permissions");
  await ch.bindQueue(Q_AUTH, EX_EVENTS, "user.activated");
  await ch.bindQueue(Q_AUTH, EX_EVENTS, "user.deactivated");
  // await ch.bindQueue(Q_AUTH, EX_EVENTS, "user.deleted");

  ch.prefetch(20);

  // Consumer: snapshots (user.*, creado/perfil/etc.)
  ch.consume(
    Q_SNAPSHOTS,
    async (msg) => {
      if (!msg) return;
      try {
        const evt = parseMsg(msg);
        const traceId = evt?.meta?.trace_id || null;
        const data = evt?.data;
        if (!data?.user_id) throw new Error("Evento sin user_id");

        await withTx(async (client) => {
          const ok = await acquireDedup(client, traceId, CONSUMER_SNAP);
          if (!ok) return; // ya procesado por ESTE consumer
          await upsertUserSnapshot(client, data);
        });

        ch.ack(msg);
      } catch (e) {
        console.error("Q_SNAPSHOTS error:", e.message);
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  // Consumer: broadcast (jwt.keys.rotated, etc.)
  ch.consume(
    Q_BROADCAST,
    async (msg) => {
      if (!msg) return;
      try {
        const evt = JSON.parse(msg.content.toString());
        const traceId = evt?.meta?.trace_id || null;

        await withTx(async (client) => {
          const ok = await acquireDedup(client, traceId, CONSUMER_BCAST);
          if (!ok) return;

          // Si el evento requiere acción (ej. rotar llaves JWT), hacelo acá.
          console.log("Broadcast recibido:", evt.event);
        });

        ch.ack(msg);
      } catch (e) {
        console.error("Q_BROADCAST error:", e.message);
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  // Consumer: cambios de autorización/estado
  ch.consume(
    Q_AUTH,
    async (msg) => {
      if (!msg) return;
      try {
        const evt = parseMsg(msg);
        const event = evt?.event;
        const traceId = evt?.meta?.trace_id || null;
        const data = evt?.data;
        if (!data?.user_id) throw new Error("Evento sin user_id");

        await withTx(async (client) => {
          const ok = await acquireDedup(client, traceId, CONSUMER_AUTH);
          if (!ok) return;

          switch (event) {
            case "user.updated.role":
              await updateRole(client, data);
              break;
            case "user.updated.permissions":
              await updatePermissions(client, data);
              break;
            case "user.activated":
              await setActive(client, data.user_id, true);
              break;
            case "user.deactivated":
              await setActive(client, data.user_id, false);
              break;
            case "user.deleted":
              await deleteUser(client, data.user_id);
              break;
            default:
              break;
          }
        });

        ch.ack(msg);
      } catch (e) {
        console.error("Q_AUTH error:", e.message);
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  console.log("✅ Consumer iniciado. DLX:", USE_DLX);
}

start().catch((e) => {
  console.error("Fatal consumer error:", e);
  process.exit(1);
});
