// models/usersModel.js
import pool from "../db.js";

export async function getUser(userId) {
  const r = await pool.query("SELECT * FROM users_cache WHERE user_id = $1", [
    userId,
  ]);
  return r.rows[0] || null;
}

export async function getAllUsers() {
  const r = await pool.query(
    "SELECT * FROM users_cache ORDER BY updated_at DESC"
  );
  return r.rows;
}

export default { getUser, getAllUsers };
