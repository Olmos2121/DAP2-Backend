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

export default router;
