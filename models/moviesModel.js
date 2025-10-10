import pool from '../db.js';

async function getMovie(id) {
  try {
    const result = await pool.query('SELECT * FROM movies WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting movie:', error);
    return null;
  }
}

async function getAllMovies() {
  try {
    const result = await pool.query('SELECT * FROM movies ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error getting all movies:', error);
    return [];
  }
}

async function searchMovies(searchTerm) {
  try {
    const result = await pool.query(
      `SELECT * FROM movies 
       WHERE title ILIKE $1 OR director ILIKE $1 OR genre ILIKE $1
       ORDER BY created_at DESC`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
}

async function getMoviesByGenre(genre) {
  try {
    const result = await pool.query(
      'SELECT * FROM movies WHERE genre ILIKE $1 ORDER BY year DESC',
      [`%${genre}%`]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting movies by genre:', error);
    return [];
  }
}

export default {
  getMovie,
  getAllMovies,
  searchMovies,
  getMoviesByGenre,
};
