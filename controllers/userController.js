/* const model = require('../models/usersModel');
const reviewsModel = require('../models/reviewsModel'); */ // ✅ Importar modelo de reviews
import model from '../models/usersModel.js';
import * as reviewsModel from '../models/reviewsModel.js';
 

async function getUser(req, res) {
  try {
    const user = await model.getUserStats(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ✅ Nueva función para obtener reseñas de un usuario
async function getUserReviews(req, res) {
  try {
    const userId = req.params.id;
    const {
      sort = 'recent',
      limit = '20',
      offset = '0',
      ...otherFilters
    } = req.query;

    // Usar el modelo de reviews con filtro por user_id
    const filters = {
      user_id: userId,
      ...otherFilters
    };

    const options = {
      orderBy: getOrderByClause(sort),
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const result = await reviewsModel.filterReviews(filters, options);
    
    res.set('X-Total-Count', String(result.total || 0));
    res.json({
      total: result.total || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: result.rows || []
    });
  } catch (err) {
    console.error('Error getting user reviews:', err);
    res.status(500).json({ error: err.message });
  }
}

// ✅ Función auxiliar para obtener cláusula ORDER BY
function getOrderByClause(sort) {
  const VALID_SORTS = {
    recent: "r.created_at DESC, r.id DESC",
    rating_asc: "r.rating ASC, r.created_at DESC",
    rating_desc: "r.rating DESC, r.created_at DESC",
    helpful: "likes_count DESC, r.created_at DESC",
  };
  return VALID_SORTS[sort] || VALID_SORTS.recent;
}

async function getAllUsers(req, res) {
  try {
    const users = await model.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export default {
  getUser,
  getUserReviews,
  getAllUsers,
};
/* module.exports = {
  getUser,
  getUserReviews,
  getAllUsers,
}; */