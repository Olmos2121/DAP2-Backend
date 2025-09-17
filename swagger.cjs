require('dotenv').config();
const path = require('path');
const fs = require('fs'); 
const swaggerAutogen = require('swagger-autogen')();

const PORT = process.env.PORT || 8080;

const doc = {
  info: { title: 'Movie Reviews API', description: 'API para reseñas de películas', version: '1.0.0' },
  schemes: ['http'],
  host: `localhost:${PORT}`,
  basePath: '/',
  tags: [
    { name: 'Reviews', description: 'Operaciones sobre reseñas' },
    { name: 'Likes', description: 'Likes de reseñas' },
    { name: 'Comments', description: 'Comentarios de reseñas' },
    { name: 'Users', description: 'Gestión de usuarios' },
    { name: 'Movies', description: 'Gestión de películas' },
    { name: 'Health', description: 'Salud del servicio' },
  ],
  definitions: {
    Review: {
      id: 1,
      movie_id: 456,
      user_id: 789,
      rating: 8.5,
      has_spoilers: false,
      body: 'Excelente...',
      status: 'pending',
      moderated_at: '2025-01-01T00:00:00Z',
      moderation_label: 'approved',
      moderation_score: 0.92,
      moderation_reason: 'Lenguaje apropiado; sin insultos.',
      moderation_source: 'ai',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    ReviewCreateInput: {
      movie_id: 456,
      user_id: 789,
      rating: 8.5,
      has_spoilers: false,
      body: 'Texto...'
    }
  }
};

const outputFile = path.resolve(__dirname, 'swagger-output.json');
const entrypoint = path.resolve(__dirname, 'index.js'); // cambia a 'src/index.js' si corresponde
const endpointsFiles = [entrypoint];                    // SOLO el entrypoint para evitar duplicados

console.log('[swagger] entrypoint:', entrypoint);
console.log('[swagger] outputFile:', outputFile);

if (!fs.existsSync(entrypoint)) {
  console.error('❌ No encuentro el entrypoint:', entrypoint);
  process.exit(1);
}

swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => console.log('✅ Swagger JSON generado en', outputFile))
  .catch((err) => {
    console.error('❌ Error generando Swagger:', err);
    process.exit(1);
  });