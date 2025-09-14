const pool = require('../db');

// Funciones para manejo de usuarios con PostgreSQL
async function createUser(userData) {
  const { name, email, profile_image, bio } = userData;
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, profile_image, bio)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, profile_image, bio]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('El email ya está registrado');
    }
    throw error;
  }
}

async function getUser(id) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

async function getAllUsers() {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

async function getUserByEmail(email) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

async function updateUser(id, userData) {
  const { name, email, profile_image, bio } = userData;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($2, name),
           email = COALESCE($3, email),
           profile_image = COALESCE($4, profile_image),
           bio = COALESCE($5, bio),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, name, email, profile_image, bio]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('El email ya está registrado por otro usuario');
    }
    throw error;
  }
}

async function deleteUser(id) {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

async function getUserStats(id) {
  try {
    // Primero obtenemos los datos básicos del usuario
    const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userQuery.rows.length === 0) {
      return null;
    }
    
    const user = userQuery.rows[0];
    
    // Luego calculamos las estadísticas
    const statsQuery = await pool.query(
      `SELECT 
        COUNT(DISTINCT r.id) as total_reviews,
        COALESCE(ROUND(AVG(r.rating), 1), 0) as avg_rating,
        COALESCE(SUM(CASE WHEN rl.id IS NOT NULL THEN 1 ELSE 0 END), 0) as total_likes_received
       FROM reviews r
       LEFT JOIN review_likes rl ON r.id = rl.review_id
       WHERE r.user_id = $1`,
      [id]
    );
    
    const stats = statsQuery.rows[0];
    
    return {
      ...user,
      total_reviews: parseInt(stats.total_reviews),
      avg_rating: parseFloat(stats.avg_rating),
      total_likes_received: parseInt(stats.total_likes_received)
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

module.exports = {
  createUser,
  getUser,
  getAllUsers,
  getUserByEmail,
  updateUser,
  deleteUser,
  getUserStats,
};