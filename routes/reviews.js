const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewsController');

// CRUD Reseñas
router.post('/', controller.createReview);
router.get('/:id', controller.getReview);
router.delete('/:id', controller.deleteReview);

// Likes
router.get('/:id/likes', controller.getLikes);
router.post('/:id/likes', controller.addLike);

module.exports = router;
