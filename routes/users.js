import express from "express";
import * as controller from "../controllers/userController.js";

const router = express.Router();

router.get(
  "/",
  /*
  #swagger.operationId = 'getAllUsers'
  #swagger.tags = ['Users']
  #swagger.summary = 'Obtener todos los usuarios'
*/
  controller.getAllUsers
);

router.get(
  "/:id",
  /*
  #swagger.operationId = 'getUserById'
  #swagger.tags = ['Users']
  #swagger.summary = 'Obtener usuario por ID'
  #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
*/
  controller.getUser
);

router.get(
  "/:id/reviews",
  /*
  #swagger.operationId = 'getUserReviews'
  #swagger.tags = ['Users']
  #swagger.summary = 'Obtener reseñas de un usuario'
  #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
*/
  controller.getUserReviews
);

export default router;
