const model = require('../models/moviesModel');

/* async function createMovie(req, res) {
  try {
    const movie = await model.createMovie(req.body);
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
} */

async function getMovie(req, res) {
  try {
    const movie = await model.getMovieStats(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Película no encontrada' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllMovies(req, res) {
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

/* async function updateMovie(req, res) {
  try {
    const movie = await model.updateMovie(req.params.id, req.body);
    if (!movie) return res.status(404).json({ error: 'Película no encontrada' });
    res.json(movie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
} */

/* async function deleteMovie(req, res) {
  try {
    const deleted = await model.deleteMovie(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Película no encontrada' });
    res.json({ message: 'Película eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} */

module.exports = {
  // createMovie,
  getMovie,
  getAllMovies,
  searchMovies,
  getMoviesByGenre,
  // updateMovie,
  // deleteMovie,
};
