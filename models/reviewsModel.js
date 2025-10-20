//const pool = require("../db");
import pool from "../db.js";
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

    const userCheck = await pool.query(
      "SELECT user_id FROM users_cache WHERE user_id = $1",
      [user_id]
    );
    if (userCheck.rows.length === 0) {
      throw new Error("El usuario especificado no existe en cache");
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
    const { rows } = await pool.query(
      `SELECT r.*, 
      u.full_name AS user_name,
      u.image_url AS user_profile_image,
      m.title AS movie_title
       FROM reviews r
       JOIN users_cache u ON r.user_id = u.user_id
       JOIN movies m ON r.movie_id = m.id
       WHERE r.id = $1`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Error getting review:", error);
    return null;
  }
}

async function updateReview(id, { rating, has_spoilers, body, title, tags }) {
  try {
    const sql = `
    UPDATE reviews
       SET rating       = COALESCE($2, rating),
           has_spoilers = COALESCE($3, has_spoilers),
           body         = COALESCE($4, body),
           title        = COALESCE($5, title),
           tags         = COALESCE($6, tags),
           updated_at   = CURRENT_TIMESTAMP
     WHERE id = $1
    RETURNING ${RETURNING_COLUMNS}
    `;
    const params = [id, rating, has_spoilers, body, title, tags];
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
  const {
    movie_id,
    user_id,
    min_rating,
    max_rating,
    has_spoilers,
    genre,
    tags,
    date_range,
  } = filters;
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
        u.full_name  AS user_name,
        u.image_url  AS user_profile_image,
        m.title      AS movie_title,
        m.poster_url AS movie_poster,
        m.genre      AS movie_genre,
        COALESCE(l.likes_count, 0) AS likes_count,
        COUNT(*) OVER() AS total_count
      FROM reviews r
      JOIN users_cache u ON r.user_id = u.user_id
      JOIN movies      m ON r.movie_id = m.id
      LEFT JOIN (
        SELECT review_id, COUNT(*) AS likes_count
        FROM likes_cache
        GROUP BY review_id
      ) l ON r.id = l.review_id
      WHERE 1=1
    `;

    if (movie_id) {
      sql += ` AND r.movie_id = $${i++}`;
      params.push(Number(movie_id));
    }
    if (user_id) {
      sql += ` AND r.user_id = $${i++}`;
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
    if (genre) {
      sql += ` AND m.genre ILIKE $${i++}`;
      params.push(`%${genre}%`);
    }

    // tags: jsonb array @> ANY
    if (tags && Array.isArray(tags) && tags.length > 0) {
      sql += ` AND (`;
      const parts = [];
      for (const tag of tags) {
        parts.push(`r.tags @> $${i++}`);
        params.push(JSON.stringify([tag]));
      }
      sql += parts.join(" OR ") + `)`;
    }

    // date_range sobre r.created_at
    if (date_range) {
      const now = new Date();
      let startDate = null;
      switch (date_range) {
        case "hoy":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "esta-semana":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "este-mes":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "este-año":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      if (startDate) {
        sql += ` AND r.created_at >= $${i++}`;
        params.push(startDate.toISOString());
      }
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

async function getReviewOwner(id) {
  const { rows } = await pool.query(
    "SELECT user_id FROM reviews WHERE id = $1",
    [id]
  );
  return rows[0] || null;
}

export {
  createReview,
  getReview,
  updateReview,
  deleteReview,
  filterReviews,
  getReviewOwner,
};
