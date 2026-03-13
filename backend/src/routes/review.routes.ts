// backend/src/routes/review.routes.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

/* ─────────────────────────────────────────────────────────
   GET /reviews — Público
   Devuelve TODAS las reseñas verificadas (global trust section)
   ───────────────────────────────────────────────────────── */
router.get('/reviews', async (_req, res, next) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { verified: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        res.json(reviews.map((r: any) => ({
            id: r.id,
            name: r.name,
            image: r.image || null,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
        })));
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   GET /products/:productId/reviews — Público
   Devuelve reseñas de un producto específico
   ───────────────────────────────────────────────────────── */
router.get('/products/:productId/reviews', async (req, res, next) => {
    try {
        const { productId } = req.params;

        const reviews = await prisma.review.findMany({
            where: { productId, verified: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        res.json(reviews.map((r: any) => ({
            id: r.id,
            name: r.name,
            image: r.image || null,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
        })));
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   POST /products/:productId/reviews — ADMIN ONLY
   Crear reseña manualmente desde el panel de administración
   ───────────────────────────────────────────────────────── */
router.post('/products/:productId/reviews', requireAuth, async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { name, image, rating, comment, createdAt } = req.body;

        if (!name || !rating) {
            return res.status(400).json({ error: 'Nombre y calificación son requeridos' });
        }

        const ratingNum = Number(rating);
        if (ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
            return res.status(400).json({ error: 'La calificación debe ser un número entero entre 1 y 5' });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const review = await prisma.review.create({
            data: {
                productId,
                name: name.trim(),
                image: image || null,
                rating: ratingNum,
                comment: comment?.trim() || '',
                verified: true,
                ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
            },
        });

        res.status(201).json({
            id: review.id,
            name: review.name,
            image: review.image,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
        });
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   DELETE /reviews/:id — ADMIN ONLY
   ───────────────────────────────────────────────────────── */
router.delete('/reviews/:id', requireAuth, async (req, res, next) => {
    try {
        await prisma.review.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

/* ─────────────────────────────────────────────────────────
   GET /admin/reviews — ADMIN ONLY
   Listar todas las reseñas con info de producto
   ───────────────────────────────────────────────────────── */
router.get('/admin/reviews', requireAuth, async (_req, res, next) => {
    try {
        const reviews = await prisma.review.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { id: true, name: true, slug: true } },
            },
            take: 200,
        });
        res.json(reviews);
    } catch (error) {
        next(error);
    }
});

export default router;
