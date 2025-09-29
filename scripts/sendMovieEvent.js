//const amqp = require('amqplib');
import amqp from 'amqplib';

const RABBIT_URL = 'amqp://guest:guest@localhost:5672';
const QUEUE = 'movies.events';

async function sendEvent(event) {
  const conn = await amqp.connect(RABBIT_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE);
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(event)));
  await channel.close();
  await conn.close();
  console.log('Evento enviado:', event.type);
}

// Cambia el evento según lo que quieras probar:

// Crear película
sendEvent({
  type: 'movie.created',
  movie: {
    id: 101,
    title: 'Pelicula de Prueba',
    description: 'Descripción de prueba',
    release_date: '2025-10-01'
  }
});

// Editar película
 /* sendEvent({
   type: 'movie.updated',
   movie: {
     id: 101,
     title: 'Pelicula de Prueba Editada',
     description: 'Descripción editada',
     release_date: '2025-10-02'
   }
 }); */

// Eliminar película
 /* sendEvent({
   type: 'movie.deleted',
   movie: { id: 101 }
 }); */