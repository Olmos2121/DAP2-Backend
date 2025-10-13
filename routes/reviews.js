import express from 'express';
import * as controller from '../controllers/reviewsController.js';
import { authenticate, requirePermission, requireRole } from '../middlewares/auth.js';

const router = express.Router();

// CRUD Reseñas
router.post('/',
  authenticate(),
  requirePermission('create:reviews'),
  /*
    #swagger.tags = ['Reviews']
    #swagger.summary = 'Crear reseña'
    #swagger.description = 'Crea una reseña para una película.'
    #swagger.consumes = ['application/json']
    #swagger.produces = ['application/json']
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/ReviewCreateInput' }
    }
    #swagger.responses[201] = { description: 'Creada', schema: { $ref: '#/definitions/Review' } }
    #swagger.responses[400] = { description: 'Bad Request' }
  */
  controller.createReview,
);

router.get('/filter',
  /*
    #swagger.tags = ['Reviews']
    #swagger.summary = 'Filtrar reseñas'
    #swagger.description = 'Filtra reseñas por distintos criterios.'
    #swagger.produces = ['application/json']
    #swagger.parameters['movie_id'] = { in: 'query', type: 'integer', description: 'ID de película' }
    #swagger.parameters['user_id']  = { in: 'query', type: 'integer', description: 'ID de usuario' }
    #swagger.parameters['min_rating'] = { in: 'query', type: 'number' }
    #swagger.parameters['max_rating'] = { in: 'query', type: 'number' }
    #swagger.parameters['has_spoilers'] = { in: 'query', type: 'boolean' }
    #swagger.parameters['genre'] = { in: 'query', type: 'string' }
    #swagger.parameters['sort'] = { in: 'query', type: 'string', description: 'p.ej. rating_desc, date_asc' }
    #swagger.parameters['limit'] = { in: 'query', type: 'integer' }
    #swagger.parameters['offset'] = { in: 'query', type: 'integer' }
    #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/Review' } } }
  */
  controller.filterReviews
);

router.get('/:id',
  /*
    #swagger.tags = ['Reviews']
    #swagger.summary = 'Obtener reseña'
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    #swagger.responses[200] = { description: 'OK', schema: { $ref: '#/definitions/Review' } }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.getReview
);

router.put('/:id',
  authenticate(),
  requirePermission('edit:reviews'),
  /*
    #swagger.tags = ['Reviews']
    #swagger.summary = 'Actualizar reseña'
    #swagger.description = 'Actualiza una reseña existente.'
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/Review' }
    }
    #swagger.responses[200] = { description: 'OK', schema: { $ref: '#/definitions/Review' } }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.updateReview
);

router.delete('/:id',
  authenticate(),
  requireRole('admin', 'moderator'),
  /*
    #swagger.tags = ['Reviews']
    #swagger.summary = 'Eliminar reseña'
    #swagger.description = 'Elimina una reseña existente.'
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    #swagger.responses[204] = { description: 'Sin Contenido' }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.deleteReview
);

export default router;
