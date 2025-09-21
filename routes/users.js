const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');

// CRUD Usuarios
// router.post('/',  
//     /*
//       #swagger.tags = ['Users']
//       #swagger.summary = 'Crear usuario'
//       #swagger.description = 'Crea un nuevo usuario.'
//       #swagger.consumes = ['application/json']
//       #swagger.produces = ['application/json']
//       #swagger.parameters['body'] = {
//         in: 'body',
//         required: true,
//         schema: { $ref: '#/definitions/UserCreateInput' }
//       }
//       #swagger.responses[201] = { description: 'Creado', schema: { $ref: '#/definitions/User' } }
//       #swagger.responses[400] = { description: 'Bad Request' }
//     */
//     controller.createUser
// );

router.get('/search', 
    /*
      #swagger.tags = ['Users']
      #swagger.summary = 'Buscar usuario por email'
      #swagger.description = 'Busca un usuario por su dirección de email.'
      #swagger.parameters['email'] = { in: 'query', required: true, type: 'string' }
      #swagger.responses[200] = { description: 'OK', schema: { $ref: '#/definitions/User' } }
      #swagger.responses[404] = { description: 'No encontrado' }
    */
    controller.getUserByEmail
);

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

// router.get('/:id', 
//     /*
//       #swagger.tags = ['Users']
//       #swagger.summary = 'Obtener usuario por ID'
//       #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
//       #swagger.responses[200] = { description: 'OK', schema: { $ref: '#/definitions/User' } }
//       #swagger.responses[404] = { description: 'No encontrado' }
//     */
//     controller.getUser
// );

router.get('/', 
    /*
      #swagger.tags = ['Users']
      #swagger.summary = 'Obtener todos los usuarios'
      #swagger.responses[200] = { description: 'OK', schema: { type: 'array', items: { $ref: '#/definitions/User' } } }
    */
    controller.getAllUsers
);

// router.put('/:id', 
//     /*
//       #swagger.tags = ['Users']
//       #swagger.summary = 'Actualizar usuario por ID'
//       #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
//       #swagger.parameters['body'] = {
//         in: 'body',
//         required: true,
//         schema: { $ref: '#/definitions/UserUpdateInput' }
//       }
//       #swagger.responses[200] = { description: 'OK', schema: { $ref: '#/definitions/User' } }
//       #swagger.responses[404] = { description: 'No encontrado' }
//     */
//     controller.updateUser
// );

// router.delete('/:id', 
//     /*
//       #swagger.tags = ['Users']
//       #swagger.summary = 'Eliminar usuario por ID'
//       #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
//       #swagger.responses[204] = { description: 'Sin Contenido' }
//       #swagger.responses[404] = { description: 'No encontrado' }
//     */
//     controller.deleteUser
// );

module.exports = router;