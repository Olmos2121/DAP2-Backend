// swagger.cjs (CommonJS para ejecutarlo fácil con node)
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Movie Reviews API',
    description: 'API para reseñas de películas',
    version: '1.0.0'
  },
  schemes: ['http'],
  // OJO: host/servers se ajustan al PORT que uses en dev
  host: `localhost:${process.env.PORT || 3000}`,
  basePath: '/',
  tags: [{ name: 'Reviews', description: 'Operaciones sobre reseñas' }],
  definitions: {
    Review: {
      id: 1, movie_id: 456, user_id: 789, rating: 8.5, has_spoilers: false, body: 'Excelente...', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z'
    },
    ReviewCreateInput: {
      movie_id: 456, user_id: 789, rating: 8.5, has_spoilers: false, body: 'Texto...'
    }
  }
};

const outputFile = './swagger-output.json';
// Archivos que definen el server y las rutas
const endpointsFiles = ['./index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
