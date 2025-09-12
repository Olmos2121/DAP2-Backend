const pool = require("../db");
const PK = "id";

const COLS = [
  "id",
  "movie_id",
  "user_id",
  "title",
  "body",
  "rating",
  "has_spoilers",
  "tags",
  "created_at",
  "updated_at",
];
const SELECT_COLUMNS = COLS.map((c) => `r.${c}`).join(", ");
const RETURNING_COLUMNS = COLS.join(", ");

async function createReview({
  movie_id,
  user_id,
  rating,
  has_spoilers,
  body,
  title,
  tags,
}) {
  try {
    // Validar que la película y usuario existen
    const movieCheck = await pool.query("SELECT id FROM movies WHERE id = $1", [
      movie_id,
    ]);
    if (movieCheck.rows.length === 0) {
      throw new Error("La película especificada no existe");
    }

    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      user_id,
    ]);
    if (userCheck.rows.length === 0) {
      throw new Error("El usuario especificado no existe");
    }

    const sql = `
    INSERT INTO reviews (movie_id, user_id, rating, has_spoilers, body, title, tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING ${RETURNING_COLUMNS}
    `;
    const params = [movie_id, user_id, rating, has_spoilers, body, title, tags];
    const { rows } = await pool.query(sql, params);
    return rows[0];
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

async function getReview(id) {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name, m.title as movie_title
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN movies m ON r.movie_id = m.id
       WHERE r.id = $1`,
      [id]
    );
    const { rows } = await pool.query(sql, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error("Error getting review:", error);
    return null;
  }
}

async function updateReview(
  id,
  { movie_id, user_id, rating, has_spoilers, body, title, tags }
) {
  try {
    const sql = `
    UPDATE reviews
       SET movie_id     = COALESCE($2, movie_id),
           user_id      = COALESCE($3, user_id),
           rating       = COALESCE($4, rating),
           has_spoilers = COALESCE($5, has_spoilers),
           body         = COALESCE($6, body),
           title        = COALESCE($7, title),
           tags         = COALESCE($8, tags),
           updated_at   = CURRENT_TIMESTAMP
     WHERE id = $1
    RETURNING ${RETURNING_COLUMNS}
    `;
    const params = [
      id,
      movie_id,
      user_id,
      rating,
      has_spoilers,
      body,
      title,
      tags,
    ];
    const { rows } = await pool.query(sql, params);
    return rows[0] || null;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
}

async function deleteReview(id) {
  try {
    const result = await pool.query(
      "DELETE FROM reviews WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error deleting review:", error);
    return false;
  }
}

async function filterReviews(filters, options = {}) {
  const { movie_id, user_id, min_rating, max_rating, has_spoilers } = filters;
  const {
    orderBy: orderClause = "r.created_at DESC, r.id DESC",
    limit: pageLimit,
    offset: pageOffset,
  } = options;

  try {
    const params = [];
    let i = 1;

    let sql = `
    SELECT
      ${SELECT_COLUMNS},
      u.name AS user_name,
      u.profile_image AS user_profile_image,
      m.title AS movie_title,
      m.poster_url AS movie_poster,
      COALESCE(l.likes_count, 0) AS likes_count,
      COUNT(*) OVER() AS total_count
    FROM reviews r
    JOIN users u  ON r.user_id  = u.id
    JOIN movies m ON r.movie_id = m.id
    LEFT JOIN (
      SELECT review_id, COUNT(*) AS likes_count
      FROM review_likes
      GROUP BY review_id
    ) l ON r.id = l.review_id
    WHERE 1=1
  `;

    if (movie_id) {
      sql += ` AND r.movie_id = $${i++}`;
      params.push(Number(movie_id));
    }
    if (user_id) {
      sql += ` AND r.user_id  = $${i++}`;
      params.push(Number(user_id));
    }
    if (min_rating !== undefined) {
      sql += ` AND r.rating >= $${i++}`;
      params.push(Number(min_rating));
    }
    if (max_rating !== undefined) {
      sql += ` AND r.rating <= $${i++}`;
      params.push(Number(max_rating));
    }
    if (typeof has_spoilers === "boolean") {
      sql += ` AND r.has_spoilers = $${i++}`;
      params.push(has_spoilers);
    }

    sql += ` ORDER BY ${orderClause}`;

    if (Number.isFinite(pageLimit) && Number.isFinite(pageOffset)) {
      sql += ` LIMIT $${i++} OFFSET $${i++}`;
      params.push(pageLimit, pageOffset);
    }

    const { rows } = await pool.query(sql, params);
    const total = rows.length ? Number(rows[0].total_count) : 0;
    rows.forEach((r) => delete r.total_count);
    return { rows, total };
  } catch (error) {
    console.error("Error filtering reviews:", error);
    throw error;
  }
}

// Funciones para manejo de likes
async function getLikes(review_id) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.profile_image
       FROM review_likes rl
       JOIN users u ON rl.user_id = u.id
       WHERE rl.review_id = $1
       ORDER BY rl.created_at DESC`,
      [review_id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting likes:", error);
    return [];
  }
}

async function addLike(review_id, user_id) {
  try {
    const result = await pool.query(
      `INSERT INTO review_likes (review_id, user_id)
       VALUES ($1, $2) ON CONFLICT (review_id, user_id) DO NOTHING RETURNING *`,
      [review_id, user_id]
    );
    return result.rows[0] || { message: "Ya diste like a esta reseña" };
  } catch (error) {
    console.error("Error adding like:", error);
    throw error;
  }
}

async function removeLike(review_id, user_id) {
  try {
    const result = await pool.query(
      `DELETE FROM review_likes WHERE review_id = $1 AND user_id = $2 RETURNING *`,
      [review_id, user_id]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error removing like:", error);
    return false;
  }
}

// Funciones para manejo de comentarios
async function getComments(review_id) {
  try {
    const result = await pool.query(
      `SELECT rc.*, u.name as user_name, u.profile_image as user_profile_image
       FROM review_comments rc
       JOIN users u ON rc.user_id = u.id
       WHERE rc.review_id = $1
       ORDER BY rc.created_at ASC`,
      [review_id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
  }
}

async function addComment(review_id, user_id, comment) {
  try {
    const result = await pool.query(
      `INSERT INTO review_comments (review_id, user_id, comment)
       VALUES ($1, $2, $3) RETURNING *`,
      [review_id, user_id, comment]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

async function deleteComment(comment_id, user_id) {
  try {
    const result = await pool.query(
      `DELETE FROM review_comments WHERE id = $1 AND user_id = $2 RETURNING *`,
      [comment_id, user_id]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
}

module.exports = {
  createReview,
  getReview,
  updateReview,
  deleteReview,
  filterReviews,
  getLikes,
  addLike,
  removeLike,
  getComments,
  addComment,
  deleteComment,
};
