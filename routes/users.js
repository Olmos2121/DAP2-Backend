import express from 'express';
import * as controller from '../controllers/userController.js';

const router = express.Router();

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

/*
  #swagger.operationId = 'getUserReviews'
  #swagger.tags = ['Users']
  #swagger.summary = 'Obtener reseñas de un usuario'
  #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
*/
router.get('/:id/reviews', controller.getUserReviews);

export default router;
