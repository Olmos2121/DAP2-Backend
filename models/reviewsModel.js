const pool = require('../db');

const PK = 'review_id';

const BASE_COLUMNS = `
  r.review_id, r.user_id, r.movie_id, r.rating, r.has_spoilers,
  r.body, r.status, r.edit_count, r.created_at, r.updated_at, r.source
`;

async function createReview({ movie_id, user_id, rating, has_spoilers, body }) {
  const sql = `
    INSERT INTO reviews (movie_id, user_id, rating, has_spoilers, body)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${BASE_COLUMNS}
  `;
  const params = [movie_id, user_id, rating, has_spoilers, body];
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

async function getReview(id) {
  const sql = `
    SELECT ${BASE_COLUMNS}
    FROM reviews r
    WHERE r.${PK} = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0];
}

async function getRecentReviews(limit = 10) {
  const result = await pool.query(
    `SELECT * FROM reviews ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/* async function getReviewsByMovie(movie_id, filters, options) {
  return filterReviews({ ...filters, movie_id }, options);
} */

/* async function getReviewsByUser(user_id, filters, options) {
  return filterReviews({ ...filters, user_id }, options);
} */


async function deleteReview(id) {
  const sql = `
    DELETE FROM reviews
    WHERE ${PK} = $1
    RETURNING ${PK}
  `;
  const { rowCount } = await pool.query(sql, [id]);
  return rowCount > 0;
}

async function filterReviews(filters, options) {
  const { movie_id, user_id, min_rating, max_rating, has_spoilers } = filters;
  const { orderBy, limit, offset } = options;

  const params = [];
  let i = 1;

  let sql = `
    SELECT
      ${BASE_COLUMNS},
      COUNT(*) OVER() AS total_count
    FROM reviews r
    WHERE 1=1
  `;

  if (movie_id) {
    sql += ` AND r.movie_id = $${i++}`;
    params.push(movie_id);
  }
  if (user_id) {
    sql += ` AND r.user_id = $${i++}`;
    params.push(user_id);
  }
  if (min_rating !== undefined) {
    sql += ` AND r.rating >= $${i++}`;
    params.push(min_rating);
  }
  if (max_rating !== undefined) {
    sql += ` AND r.rating <= $${i++}`;
    params.push(max_rating);
  }
  if (typeof has_spoilers === 'boolean') {
    sql += ` AND r.has_spoilers = $${i++}`;
    params.push(has_spoilers);
  }

  sql += ` ORDER BY ${orderBy} LIMIT $${i++} OFFSET $${i++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  const total = rows.length ? Number(rows[0].total_count) : 0;

  for (const r of rows) delete r.total_count;

  return { rows, total };
}

module.exports = {
  createReview,
  getReview,
  deleteReview,
  filterReviews,
};
