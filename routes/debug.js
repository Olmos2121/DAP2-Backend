// routes/debug.js
import express from "express";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/me",
  /*
    #swagger.tags = ['Debug']
    #swagger.security = [{ "bearerAuth": [] }]
    #swagger.summary = 'Quién soy'
    #swagger.description = 'Devuelve el usuario que ve el backend (auth + cache).'
  */
  authenticate(),
  (req, res) => {
    res.json({ ok: true, from_cache: !!req.user?._from_cache, user: req.user });
  }
);

export default router;
