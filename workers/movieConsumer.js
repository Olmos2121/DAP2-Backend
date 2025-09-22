const amqp = require('amqplib');
const pool = require('../db');

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://localhost';
const QUEUE = 'movies.events';

async function startMovieConsumer() {
  const conn = await amqp.connect(RABBIT_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE);

  channel.consume(QUEUE, async (msg) => {
    if (msg !== null) {
      const event = JSON.parse(msg.content.toString());
      if (event.type === 'movie.created') {
        await pool.query(
          'INSERT INTO movies (id, title, description, release_date) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
          [event.movie.id, event.movie.title, event.movie.description, event.movie.release_date]
        );
      }
      if (event.type === 'movie.updated') {
        await pool.query(
          'UPDATE movies SET title = $2, description = $3, release_date = $4 WHERE id = $1',
          [event.movie.id, event.movie.title, event.movie.description, event.movie.release_date]
        );
      }
      if (event.type === 'movie.deleted') {
        await pool.query('DELETE FROM movies WHERE id = $1', [event.movie.id]);
      }
      channel.ack(msg);
    }
  });

  console.log('🟢 Movie consumer conectado a RabbitMQ');
}

startMovieConsumer().catch(console.error);