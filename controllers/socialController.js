import * as model from "../models/socialModel.js";

/**
 * Devuelve todos los likes de la tabla likes_cache
 * GET /likes
 */
export async function getAllLikes(req, res) {
  try {
    const likes = await model.getAllLikes();

    if (!likes || likes.length === 0) {
      return res.status(404).json({ error: "No se encontraron likes registrados." });
    }

    res.json(likes);
  } catch (err) {
    console.error("❌ Error obteniendo todos los likes:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Devuelve los likes asociados a una reseña específica
 * GET /likes/review/:id
 */
export async function getLikesByReview(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({ error: "El parámetro 'id' debe ser un número válido." });
    }

    const likes = await model.getLikesByReviewFromDB(id);

    if (!likes || likes.length === 0) {
      return res.status(404).json({ error: `No se encontraron likes para la reseña ${id}.` });
    }

    res.json(likes);
  } catch (err) {
    console.error("❌ Error obteniendo likes por reseña:", err);
    res.status(500).json({ error: err.message });
  }
}


