// models/usersModel.js
import pool from "../db.js";

export async function getUser(userId) {
  try {
    const r = await pool.query("SELECT * FROM users_cache WHERE user_id = $1", [
      userId,
    ]);
    return r.rows[0] || null;
  } catch (error) {
    console.error("usersModel.getUser error:", error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    const r = await pool.query(
      "SELECT * FROM users_cache ORDER BY updated_at DESC"
    );
    return r.rows;
  } catch (error) {
    console.error("usersModel.getAllUsers error:", error);
    return [];
  }
}

export default { getUser, getAllUsers };
