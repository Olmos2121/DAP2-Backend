const model = require('../models/reviewsModel');

const VALID_SORTS = {
  recent:      'r.created_at DESC, r.review_id DESC',
  rating_asc:  'r.rating ASC, r.created_at DESC',
  rating_desc: 'r.rating DESC, r.created_at DESC',
};

function mapPgErrorToHttp(err) {
  switch (err.code) {
    case '23502': return { status: 400, message: 'Dato requerido ausente (NOT NULL violation).' };
    case '23503': return { status: 409, message: 'Referencia inválida (FK violation).' };
    case '23505': return { status: 409, message: 'Valor duplicado (UNIQUE violation).' };
    case '23514': return { status: 400, message: 'Restricción CHECK violada.' };
    default:      return { status: 500, message: err.message || 'Error en base de datos.' };
  }
}

function parsePositiveInt(value, defaultValue) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
}

function parseRating(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

async function createReview(req, res) {
  try {
    const { movie_id, user_id, rating, has_spoilers, body } = req.body ?? {};

    if (!movie_id) return badRequest(res, 'movie_id es requerido');
    if (!user_id)  return badRequest(res, 'user_id es requerido');
    if (rating === undefined) return badRequest(res, 'rating es requerido');
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 0 || r > 5) {
      return badRequest(res, 'rating debe ser numérico entre 0 y 5');
    }
    if (typeof has_spoilers !== 'boolean') {
      return badRequest(res, 'has_spoilers debe ser booleano');
    }
    if (typeof body !== 'string' || !body.trim()) {
      return badRequest(res, 'body es requerido (texto no vacío)');
    }

    const created = await model.createReview({ movie_id, user_id, rating: Number(rating), has_spoilers, body: body.trim() });

    res.status(201)
       .location(`/reviews/${created.id}`)
       .json(created);

  } catch (err) {
    const mapped = mapPgErrorToHttp(err);
    res.status(mapped.status).json({ error: mapped.message });
  }
}

async function getReview(req, res) {
  try {
    const review = await model.getReview(req.params.id);
    if (!review) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getRecentReviews(req, res) {
  try {
    const reviews = await model.getRecentReviews(10);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function approveReview(req, res) {
  try {
    const approved = await model.approveReview(req.params.id);
    if (!approved) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json({ message: 'Reseña aprobada' });
  } catch (err) {
    const mapped = mapPgErrorToHttp(err);
    res.status(mapped.status).json({ error: mapped.message });
  }
}

/* async function getReviewsByMovie(req, res) {
  try {
    const { id } = req.params;
    const { sort = 'recent', limit = '10', offset = '0', min_rating, max_rating, has_spoilers } = req.query;

    const orderBy = VALID_SORTS[sort] || VALID_SORTS.recent;
    const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
    const pageOffset = parsePositiveInt(offset, 0);

    const filters = {
      movie_id: id,
      min_rating: min_rating !== undefined ? Number(min_rating) : undefined,
      max_rating: max_rating !== undefined ? Number(max_rating) : undefined,
      has_spoilers: has_spoilers === 'true' ? true : has_spoilers === 'false' ? false : undefined,
    };

    const { rows, total } = await model.getReviewsByMovie(id, filters, { orderBy, limit: pageSize, offset: pageOffset });

    res.set('X-Total-Count', String(total));
    res.json({ total, limit: pageSize, offset: pageOffset, data: rows });
  } catch (err) {
    console.error('getReviewsByMovie error:', err);
    res.status(500).json({ error: err.message });
  }
} */

/* async function getReviewsByUser(req, res) {
  try {
    const { id } = req.params;
    const { sort = 'recent', limit = '10', offset = '0', min_rating, max_rating, has_spoilers } = req.query;

    const orderBy = VALID_SORTS[sort] || VALID_SORTS.recent;
    const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
    const pageOffset = parsePositiveInt(offset, 0);

    const filters = {
      user_id: id,
      min_rating: min_rating !== undefined ? Number(min_rating) : undefined,
      max_rating: max_rating !== undefined ? Number(max_rating) : undefined,
      has_spoilers: has_spoilers === 'true' ? true : has_spoilers === 'false' ? false : undefined,
    };

    const { rows, total } = await model.getReviewsByUser(id, filters, { orderBy, limit: pageSize, offset: pageOffset });

    res.set('X-Total-Count', String(total));
    res.json({ total, limit: pageSize, offset: pageOffset, data: rows });
  } catch (err) {
    console.error('getReviewsByUser error:', err);
    res.status(500).json({ error: err.message });
  }
} */


async function deleteReview(req, res) {
  try {
    const deleted = await model.deleteReview(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json({ message: 'Reseña eliminada' });
  } catch (err) {
    const mapped = mapPgErrorToHttp(err);
    res.status(mapped.status).json({ error: mapped.message });
  }
}

async function filterReviews(req, res) {
  try {
    const {
      movie_id,
      user_id,
      min_rating,
      max_rating,
      has_spoilers,
      sort = 'recent',
      limit = '20',
      offset = '0',
    } = req.query;

    const orderBy = VALID_SORTS[sort] || VALID_SORTS.recent;

    const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
    const pageOffset = parsePositiveInt(offset, 0);

    const minR = parseRating(min_rating);
    const maxR = parseRating(max_rating);
    if (minR !== undefined && (minR < 0 || minR > 5)) return badRequest(res, 'min_rating fuera de rango (0..5)');
    if (maxR !== undefined && (maxR < 0 || maxR > 5)) return badRequest(res, 'max_rating fuera de rango (0..5)');
    if (minR !== undefined && maxR !== undefined && minR > maxR) return badRequest(res, 'min_rating no puede ser mayor a max_rating');

    const hs =
      has_spoilers === 'true' ? true :
      has_spoilers === 'false' ? false :
      undefined;

    const filters = {
      movie_id,
      user_id,
      min_rating: minR,
      max_rating: maxR,
      has_spoilers: hs,
    }

    const { rows, total } = await model.filterReviews(filters, { orderBy, limit: pageSize, offset: pageOffset });

    res.set('X-Total-Count', String(total ?? 0));
    res.json({ total: total ?? 0, limit: pageSize, offset: pageOffset, data: rows });
  } catch (err) {
    console.error('filterReviews error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createReview,
  getReview,
  deleteReview,
  filterReviews,
  getRecentReviews,
  approveReview,
};
