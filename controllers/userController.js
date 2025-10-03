import * as model from '../models/usersModel.js';
// import * as reviewsModel from '../models/reviewsModel.js';
 
// function getOrderByClause(sort) {
//   const VALID_SORTS = {
//     recent: "r.created_at DESC, r.id DESC",
//     rating_asc: "r.rating ASC, r.created_at DESC",
//     rating_desc: "r.rating DESC, r.created_at DESC",
//     helpful: "likes_count DESC, r.created_at DESC",
//   };
//   return VALID_SORTS[sort] || VALID_SORTS.recent;
// } 

export async function getUser(req, res) {
  try {
    const user = await model.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// async function getUserReviews(req, res) {
//   try {
//     const userId = req.params.id;
//     const {
//       sort = 'recent',
//       limit = '20',
//       offset = '0',
//       ...otherFilters
//     } = req.query;

//     const filters = {
//       user_id: userId,
//       ...otherFilters
//     };

//     const options = {
//       orderBy: getOrderByClause(sort),
//       limit: parseInt(limit),
//       offset: parseInt(offset)
//     };

//     const result = await reviewsModel.filterReviews(filters, options);
    
//     res.set('X-Total-Count', String(result.total || 0));
//     res.json({
//       total: result.total || 0,
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//       data: result.rows || []
//     });
//   } catch (err) {
//     console.error('Error getting user reviews:', err);
//     res.status(500).json({ error: err.message });
//   }
// }

export async function getAllUsers(req, res) {
  try {
    const users = await model.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
export default {
  getUser,
  getAllUsers,
};