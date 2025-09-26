import amqplib from "amqplib";

const RABBIT_URL = process.env.RABBIT_URL || "amqp://guest:guest@localhost:5672";

const EX_EVENTS = "users.events";
const EX_BROADCAST = "users.broadcast";

async function publish(exchange, routingKey, msg) {
  const conn = await amqplib.connect(RABBIT_URL);
  const ch = await conn.createChannel();
  await ch.assertExchange(exchange, exchange === EX_BROADCAST ? "fanout" : "topic", { durable: true });
  const payload = Buffer.from(JSON.stringify(msg));
  ch.publish(exchange, routingKey, payload, { persistent: true });
  console.log(`→ Published to ${exchange} rk=${routingKey}`);
  await ch.close();
  await conn.close();
}

const baseUser = {
  user_id: 30,
  role: "admin",
  permissions: [
    "create_user","edit_user","delete_user","view_user",
    "assign_permission","assign_role",
    "create_movie","edit_movie","delete_movie",
    "edit_comment","delete_comment"
  ],
  is_active: true,
  name: "Admin",
  last_name: "Total",
  full_name: "Admin Total",
  email: "usuarioadmin@example.com",
  image_url: "https://example.com/profiles/agustorres.jpg"
};

(async () => {

  // usuario admin creado
  await publish(EX_EVENTS, "user.created", {
    event: "user.created",
    occurred_at: new Date().toISOString(),
    version: 1,
    actor: { type: "system", id: 0 },
    data: { ...baseUser },
    meta: { trace_id: "t-0", producer: "tests" }
  });

  // Usuario creado
  await publish(EX_EVENTS, "user.created", {
    event: "user.created",
    occurred_at: new Date().toISOString(),
    version: 1,
    actor: { type: "system", id: 1 },
    data: {
      user_id: 99,
      role: "user",      // ojo: user estándar no envía permissions
      is_active: true,
      name: "María",
      last_name: "García",
      full_name: "María García",
      email: "maria@example.com",
      image_url: "https://example.com/profiles/maria.jpg"
    },
    meta: { trace_id: "t-1", producer: "tests" }
  });

  // Broadcast general (fanout)
  await publish(EX_BROADCAST, "", {
    event: "jwt.keys.rotated",
    occurred_at: new Date().toISOString(),
    version: 1,
    meta: { trace_id: "t-4", producer: "tests" }
  });
})();
