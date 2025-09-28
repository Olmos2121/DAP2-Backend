//const model = require('../models/moviesModel');
import model from '../models/moviesModel.js';

async function getMovie(req, res) {
  try {
    const movie = await model.getMovieStats(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Película no encontrada' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllMovies(req, res) { //paginar
  try {
    const movies = await model.getMoviesWithRatings();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function searchMovies(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
    }
    
    const movies = await model.searchMovies(q);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMoviesByGenre(req, res) {
  try {
    const { genre } = req.params;
    const movies = await model.getMoviesByGenre(genre);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export { getMovie, getAllMovies, searchMovies, getMoviesByGenre };

/* module.exports = {
  getMovie,
  getAllMovies,
  searchMovies,
  getMoviesByGenre,
}; */
