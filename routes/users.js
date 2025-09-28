//const express = require('express');
import express from 'express';
const router = express.Router();
//const controller = require('../controllers/userController');
import controller from '../controllers/userController.js';

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

export default router;
//module.exports = router;