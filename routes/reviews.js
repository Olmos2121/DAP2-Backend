const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewsController');

// CRUD Reseñas
router.post('/', controller.createReview);
router.get('/filter', controller.filterReviews);
router.get('/:id', controller.getReview);
router.get('/recent', controller.getRecentReviews);
router.delete('/:id', controller.deleteReview);

//router.get('/movies/:id', controller.getReviewsByMovie);
//router.get('/users/:id', controller.getReviewsByUser);

module.exports = router;
