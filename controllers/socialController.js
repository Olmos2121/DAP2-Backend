import express from "express";
import { getAllLikes, getLikesByReview } from "../models/socialModel.js";

const router = express.Router();

router.get("/likes", async (req, res) => {
  const likes = await getAllLikes();
  res.json(likes);
});

router.get("/likes/review/:id", async (req, res) => {
  const likes = await getLikesByReview(req.params.id);
  res.json(likes);
});

export default router;

