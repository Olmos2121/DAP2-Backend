// testLikeEvent.js
import amqp from "amqplib";

const RABBIT_URL = process.env.RABBIT_URL || "amqp://guest:guest@localhost:5672";
const QUEUE = "reviews.likes-events.q"; // la misma que escucha tu socialConsumer

async function sendTestEvent(event) {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE, { durable: true });

    // Publicar el evento simulado
    channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(event)));
    console.log(`📤 Evento enviado a la cola "${QUEUE}":`, event.type);

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("❌ Error enviando evento de prueba:", error);
  }
}

const testEvent = {
  id: "test-event-" + Date.now(),
  type: "like.created",
  source: "/social/api",
  datacontenttype: "application/json",
  sysDate: new Date().toISOString(),
  data: {
    id: "lk_" + Math.floor(Math.random() * 1000), // ID único del like
    review_id: 20, // ID de la reseña que querés probar
    user_id: 1, // ID del usuario
    created_at: new Date().toISOString(),
  },
};
// const testEvent = {
//   id: "test-event-" + Date.now(),
//   type: "like.deleted",
//   source: "/social/api",
//   datacontenttype: "application/json",
//   sysDate: new Date().toISOString(),
//   data: {
//     id: "lk_53", // el MISMO que viste en la tabla likes_cache
//     review_id: 1,
//     user_id: 3,
//   },
// };



sendTestEvent(testEvent);
