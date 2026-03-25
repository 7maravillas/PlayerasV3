import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

/* ─── GET /categories — Listar categorías (público) ─── */
router.get('/categories', async (_req: Request, res: Response, next) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, slug: true },
        });
        res.json(categories);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        next(error);
    }
});

/* ─── POST /categories — Crear categoría (admin protegido) ─── */
router.post('/categories', requireAuth, async (req: Request, res: Response, next) => {
    try {
        const { name, slug } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ error: 'Nombre y slug requeridos' });
        }

        const newCategory = await prisma.category.create({ data: { name, slug } });
        res.status(201).json(newCategory);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Slug de categoría en uso' });
        }
        next(error);
    }
});

/* ─── PUT /categories/:id — Editar categoría (admin protegido) ─── */
router.put('/categories/:id', requireAuth, async (req: Request, res: Response, next) => {
    try {
        const { name, slug } = req.body;
        const updated = await prisma.category.update({
            where: { id: req.params.id },
            data: { name, slug },
        });
        res.json(updated);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Slug de categoría en uso' });
        }
        next(error);
    }
});

/* ─── DELETE /categories/:id — Eliminar categoría (admin protegido) ─── */
router.delete('/categories/:id', requireAuth, async (req: Request, res: Response, next) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
