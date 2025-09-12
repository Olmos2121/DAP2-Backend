const pool = require('../db');
const PK = 'id';

const COLS = [
  'id', 'movie_id', 'user_id', 'rating', 'has_spoilers', 'body',
  'status', 'edit_count', 'created_at', 'updated_at', 'source'
];
const SELECT_COLUMNS = COLS.map(c => `r.${c}`).join(', ');
const RETURNING_COLUMNS = COLS.join(', ');

async function createReview({ movie_id, user_id, rating, has_spoilers, body }) {
  const { rows } = await client.query(
  `INSERT INTO outbox_event (aggregate_type, aggregate_id, type, payload)
   VALUES ('review', $1, 'ReviewNeedsModeration.v1', $2::jsonb)`,
  [created.id, JSON.stringify({
    review_id: created.id,
    movie_id: created.movie_id,
    user_id: created.user_id,
    body: created.body,
    rating: created.rating,
    created_at: created.created_at
  })]
);
  return rows[0];
}

async function getReview(id) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM reviews r WHERE r.${PK} = $1 LIMIT 1`,
    [id]
  );
  return rows[0];
}

async function deleteReview(id) {
  const { rowCount } = await pool.query(
    `DELETE FROM reviews WHERE ${PK} = $1`,
    [id]
  );
  return rowCount > 0;
}

async function filterReviews(filters, { orderBy, limit, offset }) {
  const { movie_id, user_id, min_rating, max_rating, has_spoilers } = filters;
  const params = [];
  let i = 1;

  let sql = `
    SELECT ${SELECT_COLUMNS}, COUNT(*) OVER() AS total_count
    FROM reviews r WHERE 1=1
  `;
  if (movie_id) { sql += ` AND r.movie_id = $${i++}`; params.push(movie_id); }
  if (user_id)  { sql += ` AND r.user_id  = $${i++}`; params.push(user_id); }
  if (min_rating !== undefined) { sql += ` AND r.rating >= $${i++}`; params.push(min_rating); }
  if (max_rating !== undefined) { sql += ` AND r.rating <= $${i++}`; params.push(max_rating); }
  if (typeof has_spoilers === 'boolean') { sql += ` AND r.has_spoilers = $${i++}`; params.push(has_spoilers); }

  sql += ` ORDER BY ${orderBy} LIMIT $${i++} OFFSET $${i++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  const total = rows.length ? Number(rows[0].total_count) : 0;
  rows.forEach(r => delete r.total_count);
  return { rows, total };
}

async function approveReview(id) {
  const { rows } = await pool.query(
    `UPDATE reviews SET status = 'approved' WHERE ${PK} = $1 RETURNING ${RETURNING_COLUMNS}`,
    [id]
  );
  return rows[0];
}

module.exports = { createReview, getReview, deleteReview, filterReviews, approveReview };
