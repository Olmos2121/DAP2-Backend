import db from "../db.js";

export async function getAllLikes() {
  const result = await db.query("SELECT * FROM review_likes_cache ORDER BY created_at DESC");
  return result.rows;
}

export async function getLikesByReview(reviewId) {
  const result = await db.query("SELECT * FROM review_likes_cache WHERE review_id = $1", [reviewId]);
  return result.rows;
}

