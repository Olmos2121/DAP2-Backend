import amqplib from "amqplib";

const URL = process.env.RABBIT_URL || "amqp://guest:guest@127.0.0.1:5672";
const QUEUE = process.env.USERS_QUEUE || "reviews.user-events.q";

async function publish(msg) {
  const conn = await amqplib.connect(URL);
  const ch = await conn.createConfirmChannel();
  await ch.assertQueue(QUEUE, { durable: true });

  const payload = Buffer.from(JSON.stringify(msg));
  ch.sendToQueue(QUEUE, payload, { persistent: true });

  await ch.waitForConfirms();
  console.log(`→ Published to queue: ${QUEUE}`);
  await ch.close();
  await conn.close();
}

const trace = () => `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const baseUser = {
  user_id: 30,
  role: "admin",
  permissions: [
    "create_user",
    "edit_user",
    "delete_user",
    "view_user",
    "assign_permission",
    "assign_role",
    "create_movie",
    "edit_movie",
    "delete_movie",
    "edit_comment",
    "delete_comment",
  ],
  is_active: true,
  name: "Admin",
  last_name: "Total",
  full_name: "Admin Total",
  email: "usuarioadmin@example.com",
  image_url: "https://example.com/profiles/agustorres.jpg",
};

(async () => {
  // usuario admin creado
  await publish({
    event: "user.created",
    occurred_at: new Date().toISOString(),
    version: 1,
    actor: { type: "system", id: 0 },
    data: { ...baseUser },
    meta: { trace_id: trace(), producer: "tests" },
  });

  // Usuario creado
  await publish({
    event: "user.created",
    occurred_at: new Date().toISOString(),
    version: 1,
    actor: { type: "system", id: 1 },
    data: {
      user_id: 143,
      role: "user",
      is_active: true,
      name: "pepe",
      last_name: "ffefe",
      full_name: "María García",
      email: "maria@example.com",
      image_url: "https://example.com/profiles/maria.jpg",
    },
    meta: { trace_id: trace(), producer: "tests" },
  });
})();
