import express from "express";
import { getAllLikes, getLikesByReview } from "../controllers/socialController.js";

const router = express.Router();

/**
 * @route GET /likes
 * @desc Devuelve todos los likes almacenados en la tabla likes_cache
 */
router.get("/likes", async (req, res) => {
  try {
    const likes = await getAllLikes();
    res.status(200).json(likes);
  } catch (error) {
    console.error("❌ Error obteniendo likes:", error);
    res.status(500).json({
      message: "Error interno del servidor al obtener los likes",
      error: error.message,
    });
  }
});

/**
 * @route GET /likes/review/:id
 * @desc Devuelve los likes asociados a una reseña específica
 */
router.get("/likes/review/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const likes = await getLikesByReview(id);

    if (!likes || likes.length === 0) {
      return res.status(404).json({
        message: `No se encontraron likes para la reseña con id ${id}`,
      });
    }

    res.status(200).json(likes);
  } catch (error) {
    console.error(`❌ Error obteniendo likes para la reseña ${req.params.id}:`, error);
    res.status(500).json({
      message: "Error interno del servidor al obtener likes por reseña",
      error: error.message,
    });
  }
});

export default router;
