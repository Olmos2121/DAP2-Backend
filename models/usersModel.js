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
    const result = await pool.query(
      `SELECT 
        u.*,
        COUNT(r.id) as total_reviews,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(rl.id) as total_likes_received
       FROM users u
       LEFT JOIN reviews r ON u.id = r.user_id
       LEFT JOIN review_likes rl ON r.id = rl.review_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );
    return result.rows[0];
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