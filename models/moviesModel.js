//const pool = require('../db');
import pool from '../db.js';
// Funciones para manejo de películas con PostgreSQL


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




async function getMovieStats(id) {
  try {
    const result = await pool.query(
      `SELECT 
        m.*,
        COUNT(r.id) as total_reviews,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(rl.id) as total_likes
       FROM movies m
       LEFT JOIN reviews r ON m.id = r.movie_id
       LEFT JOIN review_likes rl ON r.id = rl.review_id
       WHERE m.id = $1
       GROUP BY m.id`,
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error getting movie stats:', error);
    return null;
  }
}

async function getMoviesWithRatings() {
  try {
    const result = await pool.query(
      `SELECT 
        m.*,
        COUNT(r.id) as review_count,
        COALESCE(AVG(r.rating), 0) as avg_rating
       FROM movies m
       LEFT JOIN reviews r ON m.id = r.movie_id
       GROUP BY m.id
       ORDER BY avg_rating DESC, review_count DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting movies with ratings:', error);
    return [];
  }
}
export default {
  getMovie,
  getAllMovies,
  searchMovies,
  getMoviesByGenre,
  getMovieStats,
  getMoviesWithRatings,
};
/* module.exports = {
  getMovie,
  getAllMovies,
  searchMovies,
  getMoviesByGenre,
  getMovieStats,
  getMoviesWithRatings,
}; */
