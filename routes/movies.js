const express = require('express');
const router = express.Router();
const controller = require('../controllers/moviesController');

// CRUD Películas
router.post('/', 
    /*
      #swagger.tags = ['Movies']
      #swagger.summary = 'Crear película'
      #swagger.description = 'Crea una nueva película.'
      #swagger.consumes = ['application/json']
      #swagger.produces = ['application/json']
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/MovieCreateInput' }
      }
      #swagger.responses[201] = { description: 'Creado', schema: { $ref: '#/definitions/Movie' } }
      #swagger.responses[400] = { description: 'Bad Request' }
    */
    controller.createMovie
);

router.get('/search', 
    /*
      #swagger.tags = ['Movies']
      #swagger.summary = 'Buscar películas'
      #swagger.description = 'Busca películas por título o descripción.'
      #swagger.parameters['query'] = { in: 'query', required: true, type: 'string' }
      #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/Movie' } } }
      #swagger.responses[404] = { description: 'No encontrado' }
    */
    controller.searchMovies
);

router.get('/genre/:genre', 
    /*
      #swagger.tags = ['Movies']
      #swagger.summary = 'Obtener películas por género'
      #swagger.parameters['genre'] = { in: 'path', required: true, type: 'string' }
      #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/Movie' } } }
      #swagger.responses[404] = { description: 'No encontrado' }
    */
    controller.getMoviesByGenre
);

router.get('/:id', 
    /*
      #swagger.tags = ['Movies']
      #swagger.summary = 'Obtener película por ID'
      #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      #swagger.responses[200] = { description: 'OK', schema: { $ref: '#/definitions/Movie' } }
      #swagger.responses[404] = { description: 'No encontrado' }
    */
    controller.getMovie
);

router.get('/', 
    /*
      #swagger.tags = ['Movies']
      #swagger.summary = 'Obtener todas las películas'
      #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/Movie' } } }
    */
    controller.getAllMovies
);

router.put('/:id', 
    /*
      #swagger.tags = ['Movies']
      #swagger.summary = 'Actualizar película por ID'
      #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/MovieUpdateInput' }
      }
      #swagger.responses[200] = { description: 'OK', schema: { $ref: '#/definitions/Movie' } }
      #swagger.responses[404] = { description: 'No encontrado' }
    */
    controller.updateMovie
);

router.delete('/:id', 
    /*
      #swagger.tags = ['Movies']
      #swagger.summary = 'Eliminar película por ID'
      #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      #swagger.responses[204] = { description: 'Sin Contenido' }
      #swagger.responses[404] = { description: 'No encontrado' }
    */
    controller.deleteMovie
);

module.exports = router;
