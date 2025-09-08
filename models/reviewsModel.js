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

async function filterReviews(filters, options) {
  const { movie_id, user_id, min_rating, max_rating, has_spoilers } = filters;
  const { orderBy, limit, offset } = options;

  const params = [];
  let idx = 1;

  // base con COUNT OVER para total en una sola pasada
  let sql = `
    SELECT
      r.*,
      COUNT(*) OVER() AS total_count
    FROM reviews r
    WHERE 1=1
  `;

  if (movie_id) {
    sql += ` AND r.movie_id = $${idx++}`;
    params.push(movie_id);
  }
  if (user_id) {
    sql += ` AND r.user_id = $${idx++}`;
    params.push(user_id);
  }
  if (min_rating !== undefined) {
    sql += ` AND r.rating >= $${idx++}`;
    params.push(min_rating);
  }
  if (max_rating !== undefined) {
    sql += ` AND r.rating <= $${idx++}`;
    params.push(max_rating);
  }
  if (typeof has_spoilers === 'boolean') {
    sql += ` AND r.has_spoilers = $${idx++}`;
    params.push(has_spoilers);
  }

  sql += ` ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  const result = await pool.query(sql, params);
  const rows = result.rows;
  const total = rows.length ? Number(rows[0].total_count) : 0;

  // limpiar la columna auxiliar
  rows.forEach(r => delete r.total_count);

  return { rows, total };
}

/* async function getLikes(review_id) {
  const result = await pool.query(
    `SELECT u.id, u.name
     FROM likes l
     JOIN users u ON l.user_id = u.id
     WHERE l.review_id = $1`,
    [review_id]
  );
  return result.rows;
} */

/* async function addLike(review_id, user_id) {
  const result = await pool.query(
    `INSERT INTO likes (review_id, user_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
    [review_id, user_id]
  );
  return result.rows[0] || { message: "Ya diste like a esta reseña" };
} */

/* async function removeLike(review_id, user_id) {
  const result = await pool.query(
    `DELETE FROM likes WHERE review_id = $1 AND user_id = $2 RETURNING *`,
    [review_id, user_id]
  );
  return result.rowCount > 0;
} */

module.exports = {
  createReview,
  getReview,
  deleteReview,
  filterReviews,
  //getLikes,
  //addLike,
  //removeLike,
};
