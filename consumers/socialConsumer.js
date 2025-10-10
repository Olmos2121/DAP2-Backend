import amqp from "amqplib";
import db from "../db.js"; // tu conexión existente

const RABBIT_URL = process.env.RABBIT_URL || "amqp://guest:guest@localhost:5672";
const QUEUE = "reviews.likes-events.q"; // nombre sugerido para tu cola

async function startLikesConsumer() {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE, { durable: true });
    console.log(`🟢 [Reviews] Escuchando eventos de likes en la cola: ${QUEUE}`);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        const { type, data } = event;

        console.log(`📩 Evento recibido: ${type}`);

        switch (type) {
          case "like.created":
            await db.query(
              `INSERT INTO likes_cache (like_id, review_id, user_id, created_at, raw_event)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (like_id) DO NOTHING`,
              [data.id, data.review_id, data.user_id, data.created_at, JSON.stringify(event)]
              //[data.id, data.review_id, data.user_id, data.created_at, event]
            );
            break;

          case "like.deleted":
            await db.query(`DELETE FROM likes_cache WHERE like_id = $1`, [data.id]);
            break;

          default:
            console.log(`⚠️ Evento ignorado: ${type}`);
        }

        channel.ack(msg);
      } catch (err) {
        console.error("❌ Error procesando evento:", err);
        channel.nack(msg, false, false);
      }
    });
  } catch (err) {
    console.error("❌ Error conectando al broker:", err);
  }
}

startLikesConsumer();

