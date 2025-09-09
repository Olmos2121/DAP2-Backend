const pool = require('../db');

// Funciones para manejo de películas con PostgreSQL
async function createMovie(movieData) {
  const { title, year, genre, director, poster_url, description } = movieData;
  try {
    const result = await pool.query(
      `INSERT INTO movies (title, year, genre, director, poster_url, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, year, genre, director, poster_url, description]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating movie:', error);
    throw error;
  }
}

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

async function updateMovie(id, movieData) {
  const { title, year, genre, director, poster_url, description } = movieData;
  try {
    const result = await pool.query(
      `UPDATE movies 
       SET title = COALESCE($2, title),
           year = COALESCE($3, year),
           genre = COALESCE($4, genre),
           director = COALESCE($5, director),
           poster_url = COALESCE($6, poster_url),
           description = COALESCE($7, description)
       WHERE id = $1 RETURNING *`,
      [id, title, year, genre, director, poster_url, description]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating movie:', error);
    throw error;
  }
}

async function deleteMovie(id) {
  try {
    const result = await pool.query('DELETE FROM movies WHERE id = $1 RETURNING *', [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting movie:', error);
    return false;
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

module.exports = {
  createMovie,
  getMovie,
  getAllMovies,
  searchMovies,
  getMoviesByGenre,
  updateMovie,
  deleteMovie,
  getMovieStats,
  getMoviesWithRatings,
};
