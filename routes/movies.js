const express = require('express');
const router = express.Router();
const controller = require('../controllers/moviesController');

// CRUD Películas
router.post('/', controller.createMovie);
router.get('/search', controller.searchMovies);
router.get('/genre/:genre', controller.getMoviesByGenre);
router.get('/:id', controller.getMovie);
router.get('/', controller.getAllMovies);
router.put('/:id', controller.updateMovie);
router.delete('/:id', controller.deleteMovie);

module.exports = router;
