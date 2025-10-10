import express from 'express';
import * as controller from '../controllers/userController.js';

const router = express.Router();

<<<<<<< HEAD
// CRUD Usuarios
router.get('/:id/reviews', 
    /*
      #swagger.tags = ['Users']
      #swagger.summary = 'Obtener reseñas de un usuario por ID'
      #swagger.description = 'Devuelve todas las reseñas de un usuario específico.'
      #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/Review' } } }
      #swagger.responses[404] = { description: 'No encontrado' }
    */
  controller.getUserReviews);

router.get('/:id', 
    /*
      #swagger.tags = ['Users']
      #swagger.summary = 'Obtener usuario por ID'
      #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
      #swagger.responses[200] = { description: 'OK', schema: { $ref: '#/definitions/User' } }
      #swagger.responses[404] = { description: 'No encontrado' }
    */
    controller.getUser
);

router.get('/', 
    /*
      #swagger.tags = ['Users']
      #swagger.summary = 'Obtener todos los usuarios'
      #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/User' } } }
    */
    controller.getAllUsers
);


module.exports = router;
=======
/*
  #swagger.operationId = 'getAllUsers'
  #swagger.tags = ['Users']
  #swagger.summary = 'Obtener todos los usuarios'
*/
router.get('/', controller.getAllUsers);

/*
  #swagger.operationId = 'getUserById'
  #swagger.tags = ['Users']
  #swagger.summary = 'Obtener usuario por ID'
  #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
*/
router.get('/:id', controller.getUser);

export default router;
>>>>>>> develop
