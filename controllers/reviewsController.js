const model = require('../models/reviewsModel');
const { validateReviewData, validateCommentData, validatePagination, sanitizeInput } = require('../utils/validation');

const VALID_SORTS = {
  recent: 'created_at DESC',
  rating_asc: 'rating ASC',
  rating_desc: 'rating DESC',
}

function parsePositiveInt(value, defaultValue) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
}

async function createReview(req, res) {
  try {
    // Validar datos de entrada
    const errors = validateReviewData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors });
    }

    // Sanitizar contenido
    const sanitizedData = {
      ...req.body,
      title: sanitizeInput(req.body.title),
      body: sanitizeInput(req.body.body),
    };

    const review = await model.createReview(sanitizedData);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

async function updateReview(req, res) {
  try {
    const review = await model.updateReview(req.params.id, req.body);
    if (!review) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteReview(req, res) {
  try {
    const deleted = await model.deleteReview(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json({ message: 'Reseña eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      limit = '10',
      offset = '0',
    } = req.query;

    const orderBy = VALID_SORTS[sort] || VALID_SORTS.recent;

    const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
    const pageOffset = parsePositiveInt(offset, 0);

    const minR = min_rating !== undefined ? Number(min_rating) : undefined;
    const maxR = max_rating !== undefined ? Number(max_rating) : undefined;

    const filters = {
      movie_id,
      user_id,
      min_rating: Number.isFinite(minR) ? minR : undefined,
      max_rating: Number.isFinite(maxR) ? maxR : undefined,
      has_spoilers: has_spoilers === 'true' ? true : has_spoilers === 'false' ? false : undefined,
    }

    const { rows, total } = await model.filterReviews(filters, { orderBy, limit: pageSize, offset: pageOffset });

    res.set('X-Total-Count', String(total));
    res.json({ total, limit: pageSize, offset: pageOffset, data: rows });
  } catch (err) {
    console.error('filterReviews error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getLikes(req, res) {
  try {
    const likes = await model.getLikes(req.params.id);
    res.json(likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addLike(req, res) {
  try {
    const like = await model.addLike(req.params.id, req.body.user_id);
    res.status(201).json(like);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeLike(req, res) {
  try {
    const removed = await model.removeLike(req.params.id, req.body.user_id);
    if (!removed) return res.status(404).json({ error: 'Like no encontrado' });
    res.json({ message: 'Like eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getComments(req, res) {
  try {
    const comments = await model.getComments(req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addComment(req, res) {
  try {
    // Validar datos de entrada
    const errors = validateCommentData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors });
    }

    const sanitizedComment = sanitizeInput(req.body.comment);
    const comment = await model.addComment(req.params.id, req.body.user_id, sanitizedComment);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteComment(req, res) {
  try {
    const deleted = await model.deleteComment(req.params.commentId, req.body.user_id);
    if (!deleted) return res.status(404).json({ error: 'Comentario no encontrado' });
    res.json({ message: 'Comentario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
