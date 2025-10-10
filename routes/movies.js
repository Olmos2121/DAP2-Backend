import express from 'express';
import * as controller from '../controllers/moviesController.js';

const router = express.Router();

// CRUD Películas
<<<<<<< HEAD

=======
>>>>>>> develop
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

<<<<<<< HEAD




module.exports = router;
=======
export default router;

>>>>>>> develop
