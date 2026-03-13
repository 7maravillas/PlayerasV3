// src/routes/club.routes.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// GET /clubs — listar todos (público)
router.get('/clubs', async (_req, res, next) => {
    try {
        const clubs = await prisma.club.findMany({
            select: { id: true, name: true, slug: true, leagueId: true, league: true },
            orderBy: { name: 'asc' },
        });
        res.json(clubs);
    } catch (error) {
        next(error);
    }
});

// POST /clubs — crear (protegido)
router.post('/clubs', requireAuth, async (req, res, next) => {
    try {
        const { name, slug, leagueId } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'Nombre y slug requeridos' });
        }

        // Si no se envía leagueId, buscar o crear una liga por defecto
        let resolvedLeagueId = leagueId;
        if (!resolvedLeagueId) {
            let defaultLeague = await prisma.league.findFirst();
            if (!defaultLeague) {
                defaultLeague = await prisma.league.create({
                    data: { name: 'General', slug: 'general' },
                });
            }
            resolvedLeagueId = defaultLeague.id;
        }

        const newClub = await prisma.club.create({
            data: { name, slug, leagueId: resolvedLeagueId },
        });
        res.status(201).json(newClub);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'El slug ya existe' });
        }
        next(error);
    }
});

// PUT /clubs/:id — editar (protegido)
router.put('/clubs/:id', requireAuth, async (req, res, next) => {
    try {
        const { name, slug, leagueId } = req.body;
        const updated = await prisma.club.update({
            where: { id: req.params.id },
            data: { name, slug, ...(leagueId ? { leagueId } : {}) },
        });
        res.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'El slug ya existe' });
        }
        next(error);
    }
});

// DELETE /clubs/:id — eliminar (protegido)
router.delete('/clubs/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.club.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
