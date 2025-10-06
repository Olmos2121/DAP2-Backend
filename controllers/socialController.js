import express from "express";
import { getAllLikes, getLikesByReview } from "../models/socialModel.js";

const router = express.Router();

/* router.get("/likes", async (req, res) => {
  const likes = await getAllLikes();
  res.json(likes);
}); */
/* router.get("/likes", async (req, res) => {
  try {
    const likes = await getAllLikes();
    res.json(likes);
  } catch (error) {
    console.error("Error obteniendo likes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}); */
router.get("/likes", async (req, res) => {
  try {
    const likes = await getAllLikes();

    if (!likes || likes.length === 0) {
      return res.status(404).json({ message: "No se encontraron likes registrados." });
    }

    res.status(200).json(likes);
  } catch (error) {
    console.error("❌ Error obteniendo todos los likes:", error);
    res.status(500).json({error: "Error interno del servidor al obtener los likes."});
  }
});

/* router.get("/likes/review/:id", async (req, res) => {
  const likes = await getLikesByReview(req.params.id);
  res.json(likes);
}); */
router.get("/likes/review/:id", async (req, res) => {
  try {
    const reviewId = req.params.id;

    // 🧩 Validar que el ID sea un número válido
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: "El parámetro 'id' debe ser un número válido." });
    }

    // 🧠 Consultar la base de datos
    const likes = await getLikesByReview(reviewId);

    // ⚠️ Si no hay likes, devolvemos 404 opcionalmente
    if (!likes || likes.length === 0) {
      return res.status(404).json({ message: `No se encontraron likes para la reseña ${reviewId}.` });
    }

    // ✅ Éxito
    res.status(200).json(likes);
  } catch (error) {
    console.error("❌ Error obteniendo likes por reseña:", error);
    res.status(500).json({error: "Error interno del servidor al obtener los likes."});
  }
});


export default router;

