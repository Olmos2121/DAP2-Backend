const pool = require('../db');

// Funciones para manejo de usuarios con PostgreSQL
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

module.exports = {
  getUser,
  getAllUsers,
};