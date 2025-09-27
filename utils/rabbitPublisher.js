const amqp = require('amqplib');

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE = 'reviews.events';

let channel;

async function getChannel() {
  if (!channel) {
    const conn = await amqp.connect(RABBIT_URL);
    channel = await conn.createChannel();
    await channel.assertQueue(QUEUE);
  }
  return channel;
}

async function publishReviewEvent(event) {
  const ch = await getChannel();
  ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(event)));
}

module.exports = { publishReviewEvent };