const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');

// CRUD Usuarios
router.post('/', controller.createUser);
router.get('/search', controller.getUserByEmail);
router.get('/:id/reviews', controller.getUserReviews); // ✅ Nueva ruta para reseñas del usuario
router.get('/:id', controller.getUser);
router.get('/', controller.getAllUsers);
router.put('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

module.exports = router;