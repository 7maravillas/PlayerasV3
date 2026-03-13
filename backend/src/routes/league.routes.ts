// src/routes/league.routes.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// GET /leagues — listar todas (público)
router.get('/leagues', async (_req, res, next) => {
    try {
        const leagues = await prisma.league.findMany({ orderBy: { name: 'asc' } });
        res.json(leagues);
    } catch (error) {
        next(error);
    }
});

// POST /leagues — crear (protegido)
router.post('/leagues', requireAuth, async (req, res, next) => {
    try {
        const { name, slug, country } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'Nombre y slug requeridos' });
        }

        const newLeague = await prisma.league.create({
            data: { name, slug, country },
        });
        res.json(newLeague);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'El slug ya existe' });
        }
        next(error);
    }
});

// PUT /leagues/:id — editar (protegido)
router.put('/leagues/:id', requireAuth, async (req, res, next) => {
    try {
        const { name, slug, country } = req.body;
        const updated = await prisma.league.update({
            where: { id: req.params.id },
            data: { name, slug, country },
        });
        res.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'El slug ya existe' });
        }
        next(error);
    }
});

// DELETE /leagues/:id — eliminar (protegido)
router.delete('/leagues/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.league.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
