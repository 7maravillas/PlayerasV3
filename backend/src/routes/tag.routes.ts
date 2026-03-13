// src/routes/tag.routes.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// GET /tags — listar todos (público)
router.get('/tags', async (_req, res, next) => {
    try {
        const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
        res.json(tags);
    } catch (error) {
        next(error);
    }
});

// POST /tags — crear (protegido)
router.post('/tags', requireAuth, async (req, res, next) => {
    try {
        const { name, slug } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'Nombre y slug requeridos' });
        }

        const newTag = await prisma.tag.create({ data: { name, slug } });
        res.status(201).json(newTag);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Slug en uso' });
        }
        next(error);
    }
});

// PUT /tags/:id — editar (protegido)
router.put('/tags/:id', requireAuth, async (req, res, next) => {
    try {
        const { name, slug } = req.body;
        const updated = await prisma.tag.update({
            where: { id: req.params.id },
            data: { name, slug },
        });
        res.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Slug en uso' });
        }
        next(error);
    }
});

// DELETE /tags/:id — eliminar (protegido)
router.delete('/tags/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.tag.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
