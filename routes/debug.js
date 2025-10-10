// routes/debug.js
import express from 'express';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.get('/me', authenticate(), (req, res) => {
  // devuelve exactamente lo que tu back ve del usuario
  res.json({
    ok: true,
    from_cache: !!req.user?._from_cache,
    user: req.user,
  });
});

export default router;
