const pool = require('../db');

async function createReview({ movie_id, user_id, rating, has_spoilers, body }) {
  const result = await pool.query(
    `INSERT INTO reviews (movie_id, user_id, rating, has_spoilers, body)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [movie_id, user_id, rating, has_spoilers, body]
  );
  return result.rows[0];
}

async function getReview(id) {
  const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
  return result.rows[0];
}

async function deleteReview(id) {
  const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);
  return result.rowCount > 0;
}

async function getLikes(review_id) {
  const result = await pool.query(
    `SELECT u.id, u.name
     FROM likes l
     JOIN users u ON l.user_id = u.id
     WHERE l.review_id = $1`,
    [review_id]
  );
  return result.rows;
}

async function addLike(review_id, user_id) {
  const result = await pool.query(
    `INSERT INTO likes (review_id, user_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
    [review_id, user_id]
  );
  return result.rows[0] || { message: "Ya diste like a esta reseña" };
}

async function removeLike(review_id, user_id) {
  const result = await pool.query(
    `DELETE FROM likes WHERE review_id = $1 AND user_id = $2 RETURNING *`,
    [review_id, user_id]
  );
  return result.rowCount > 0;
}

module.exports = {
  createReview,
  getReview,
  deleteReview,
  getLikes,
  addLike,
  removeLike,
};
