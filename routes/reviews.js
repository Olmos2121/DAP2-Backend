const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewsController');

// CRUD Reseñas
router.post('/', controller.createReview);

router.get('/filter', controller.filterReviews);
//router.get('/recent', controller.getRecentReviews);
router.get('/stats', controller.getStats);

router.get('/', controller.filterReviews);
router.get('/:id', controller.getReview);
router.put('/:id', controller.updateReview);
router.delete('/:id', controller.deleteReview);
//router.post('/:id/approve', controller.approveReview);

// Likes y comentarios
router.get('/:id/likes', controller.getLikes);
router.post('/:id/likes', controller.addLike);
router.delete('/:id/likes', controller.removeLike);
router.get('/:id/comments', controller.getComments);
router.post('/:id/comments', controller.addComment);
router.delete('/comments/:commentId', controller.deleteComment);

module.exports = router;
