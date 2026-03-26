// src/routes/rewards.routes.ts
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import { prisma } from '../lib/prisma.js';
import { getBalance, getHistory, redeemForFreeJersey, getRedemptions } from '../services/rewards.service.js';

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

/* ── POST /rewards/redeem — Canjear puntos por cupón de jersey gratis ── */
router.post('/rewards/redeem', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await redeemForFreeJersey(req.user!.sub);
    res.json({
      couponCode: result.couponCode,
      expiresAt: result.expiresAt,
      message: '¡Felicidades! Usa este código en tu próxima compra para llevarte una jersey con $550 de descuento.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? 'Error al canjear puntos' });
  }
});

/* ── GET /admin/rewards/redemptions — Listar canjes (admin) ── */
router.get('/admin/rewards/redemptions', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const redemptions = await getRedemptions();
    res.json(redemptions);
  } catch {
    res.status(500).json({ error: 'Error al obtener canjes' });
  }
});

/* ── PUT /admin/rewards/redemptions/:id/status — Actualizar estado de canje (admin) ── */
router.put('/admin/rewards/redemptions/:id/status', requireAuth, async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  if (!['USED', 'EXPIRED'].includes(status)) {
    return res.status(400).json({ error: 'Status debe ser USED o EXPIRED' });
  }
  try {
    const updated = await prisma.rewardRedemption.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Canje no encontrado' });
  }
});

export default router;
