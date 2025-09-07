const model = require('../models/reviewsModel');

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

async function deleteReview(req, res) {
  try {
    const deleted = await model.deleteReview(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json({ message: 'Reseña eliminada' });
  } catch (err) {
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
  //getLikes,
  //addLike,
  //removeLike,
};
