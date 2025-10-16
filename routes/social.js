import express from "express";
import * as controller from "../controllers/socialController.js";

const router = express.Router();

router.get(
  "/likes",
  /*
  #swagger.tags = ['Social']
  #swagger.summary = 'Obtener todos los likes'
  #swagger.description = 'Devuelve todos los likes almacenados en la tabla likes_cache.'
*/
  controller.getAllLikes
);

/*
  #swagger.tags = ['Social']
  #swagger.summary = 'Obtener likes por reseña'
  #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'ID de la reseña' }
  #swagger.description = 'Devuelve los likes asociados a una reseña específica.'
*/
router.get(
  "/likes/review/:id",
  /*
  #swagger.tags = ['Social']
  #swagger.summary = 'Obtener likes por reseña'
  #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer', description: 'ID de la reseña' }
  #swagger.description = 'Devuelve los likes asociados a una reseña específica.'
*/
  controller.getLikesByReview
);

export default router;
