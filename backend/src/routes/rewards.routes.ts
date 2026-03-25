// src/routes/rewards.routes.ts
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import { getBalance, getHistory } from '../services/rewards.service.js';

const router = Router();

/* ── GET /rewards/balance ── */
router.get('/rewards/balance', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = await getBalance(req.user!.sub);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Error al obtener balance de puntos' });
  }
});

/* ── GET /rewards/history ── */
router.get('/rewards/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const history = await getHistory(req.user!.sub);
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Error al obtener historial de puntos' });
  }
});

export default router;
