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

router.get('/db', async (req, res) => {
  try {
    const q = (s) => pool.query(s);
    const [db, user, now, reviews, movies, usersc] = await Promise.all([
      q('select current_database() as db'),
      q('select current_user as user'),
      q("select now(), inet_server_addr() as db_addr"),
      q('select count(*)::int as n from reviews'),
      q('select count(*)::int as n from movies'),
      q('select count(*)::int as n from users_cache'),
    ]);
    res.json({
      db: db.rows[0].db,
      db_user: user.rows[0].user,
      db_addr: now.rows[0].db_addr,
      now: now.rows[0].now,
      counts: {
        reviews: reviews.rows[0].n,
        movies: movies.rows[0].n,
        users_cache: usersc.rows[0].n
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
