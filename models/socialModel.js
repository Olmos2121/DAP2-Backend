import db from "../db.js";

/* export async function getAllLikes() {
  const result = await db.query("SELECT * FROM likes_cache ORDER BY created_at DESC");
  return result.rows;
} */
export async function getAllLikes() {
  try {
    const result = await db.query("SELECT * FROM likes_cache ORDER BY created_at DESC");
    return result.rows;
  } catch (error) {
    console.error("❌ Error consultando todos los likes:", error);
    throw new Error("No se pudieron obtener los likes desde la base de datos.");
  }
}

/* export async function getLikesByReview(reviewId) {
  const result = await db.query("SELECT * FROM likes_cache WHERE review_id = $1", [reviewId]);
  return result.rows;
} */
export async function getLikesByReview(reviewId) {
  try {
    const result = await db.query("SELECT * FROM likes_cache WHERE review_id = $1 ORDER BY created_at DESC", [reviewId]);
    return result.rows;
  } catch (error) {
    console.error(`❌ Error consultando likes de la reseña ${reviewId}:`, error);
    throw new Error(`No se pudieron obtener los likes de la reseña ${reviewId}.`);
  }
}

