//const amqp = require('amqplib');
import amqp from 'amqplib';

const RABBIT_URL = 'amqp://guest:guest@localhost:5672';
const QUEUE = 'reviews.events';

async function listen() {
  const conn = await amqp.connect(RABBIT_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE);

  console.log('Esperando eventos de reseñas...');
  channel.consume(QUEUE, (msg) => {
    if (msg !== null) {
      console.log('Evento recibido:', msg.content.toString());
      channel.ack(msg);
    }
  });
}

listen();