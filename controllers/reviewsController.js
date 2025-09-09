const model = require('../models/reviewsModel');

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
    const review = await model.createReview(req.body);
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

async function getRecentReviews(req, res) {
  try {
    const reviews = await model.getRecentReviews(10);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

/* async function getLikes(req, res) {
  try {
    const likes = await model.getLikes(req.params.id);
    res.json(likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} */

/* async function addLike(req, res) {
  try {
    const like = await model.addLike(req.params.id, req.body.user_id);
    res.status(201).json(like);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} */

/* async function removeLike(req, res) {
  try {
    await model.removeLike(req.params.id, req.body.user_id);
    res.json({ message: 'Like eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
 }*/

module.exports = {
  createReview,
  getReview,
  deleteReview,
  filterReviews,
  getRecentReviews,
  //getReviewsByMovie,
  //getReviewsByUser,
  //getLikes,
  //addLike,
  //removeLike,
};
