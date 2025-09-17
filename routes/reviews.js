const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewsController');

// CRUD Reseñas
router.post('/',
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
  controller.createReview
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

router.get('/stats',
  /*
    #swagger.tags = ['Reviews']
    #swagger.summary = 'Estadísticas de reseñas'
    #swagger.responses[200] = { description: 'OK' }
  */
  controller.getStats
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

// Likes y comentarios
router.get('/:id/likes',
  /*
    #swagger.tags = ['Likes']
    #swagger.summary = 'Obtener likes de reseña'
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/Like' } } }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.getLikes
);

router.post('/:id/likes',
  /*
    #swagger.tags = ['Likes']
    #swagger.summary = 'Agregar like a reseña'
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    #swagger.responses[201] = { description: 'Creado', schema: { $ref: '#/definitions/Like' } }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.addLike
);

router.delete('/:id/likes',
  /*
    #swagger.tags = ['Likes']
    #swagger.summary = 'Eliminar like de reseña'
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    #swagger.responses[204] = { description: 'Sin Contenido' }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.removeLike
);

router.get('/:id/comments',
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = 'Obtener comentarios de reseña'
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/Comment' } } }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.getComments
);

router.post('/:id/comments',
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = 'Agregar comentario a reseña'
    #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: { $ref: '#/definitions/CommentCreateInput' }
    }
    #swagger.responses[201] = { description: 'Creado', schema: { $ref: '#/definitions/Comment' } }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.addComment
);

router.delete('/comments/:commentId',
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = 'Eliminar comentario de reseña'
    #swagger.parameters['commentId'] = { in: 'path', required: true, type: 'integer' }
    #swagger.responses[204] = { description: 'Sin Contenido' }
    #swagger.responses[404] = { description: 'No encontrada' }
  */
  controller.deleteComment
);

module.exports = router;
