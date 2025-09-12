const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Movie Reviews API',
    description: 'API para reseñas de películas',
    version: '1.0.0'
  },
  schemes: ['http'],
  host: `localhost:${process.env.PORT || 3000}`,
  basePath: '/',
  tags: [{ name: 'Reviews', description: 'Operaciones sobre reseñas' }],
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

const outputFile = './swagger-output.json';
const endpointsFiles = ['./index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
