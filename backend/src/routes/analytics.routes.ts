// src/routes/analytics.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

/* ─── POST /api/v1/analytics/view — Registrar visita de producto (público) ─── */
router.post('/analytics/view', async (req: Request, res: Response) => {
  const { productId } = req.body;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId requerido' });
  }

  try {
    await prisma.productView.create({ data: { productId } });
    return res.status(200).json({ ok: true });
  } catch {
    // Fallo silencioso — no interrumpir la experiencia del usuario
    return res.status(200).json({ ok: false });
  }
});

/* ─── GET /api/v1/analytics/abandoned — Carritos abandonados (admin) ─── */
router.get('/analytics/abandoned', requireAuth, async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Hace 24 horas

  try {
    const abandoned = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: { lt: since },
      },
      select: {
        id:          true,
        orderNumber: true,
        email:       true,
        firstName:   true,
        lastName:    true,
        totalCents:  true,
        createdAt:   true,
        items: {
          select: {
            productName: true,
            quantity:    true,
            totalCents:  true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({ total: abandoned.length, items: abandoned });
  } catch (err) {
    console.error('Error obteniendo carritos abandonados:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

/* ─── GET /api/v1/analytics/views/:productId — Vistas de un producto (admin) ─── */
router.get('/analytics/views/:productId', requireAuth, async (req: Request, res: Response) => {
  const { productId } = req.params;

  try {
    const count = await prisma.productView.count({ where: { productId } });
    return res.json({ productId, views: count });
  } catch {
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
