// backend/src/routes/search.routes.ts
import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const router = Router();

const FROM = 'ÁÉÍÓÚáéíóúÄËÏÖÜäëïöüÀÈÌÒÙàèìòùÇçÑñ';
const TO   = 'AEIOUaeiouAEIOUaeiouAEIOUaeiouCcNn';

/**
 * GET /products/instant-search?q=...
 * Búsqueda instantánea multi-palabra con soporte de acentos.
 * Cada palabra de la query debe aparecer en algún campo (AND de palabras, OR de campos).
 * Devuelve máximo 5 resultados con payload mínimo (~2KB).
 */
router.get('/products/instant-search', async (req: Request, res: Response) => {
    const q = (req.query.q as string || '').trim();

    if (q.length < 2) {
        return res.json([]);
    }

    try {
        const words = q.split(/\s+/).filter(Boolean).slice(0, 5);

        const wordConditions = words.map(word => {
            const wq = `%${word.toLowerCase()}%`;
            return Prisma.sql`(
                lower(translate(p.name, ${FROM}, ${TO})) LIKE lower(translate(${wq}, ${FROM}, ${TO}))
                OR lower(translate(COALESCE(p.description, ''), ${FROM}, ${TO})) LIKE lower(translate(${wq}, ${FROM}, ${TO}))
                OR lower(translate(COALESCE(cl.name, ''), ${FROM}, ${TO})) LIKE lower(translate(${wq}, ${FROM}, ${TO}))
                OR lower(translate(COALESCE(cat.name, ''), ${FROM}, ${TO})) LIKE lower(translate(${wq}, ${FROM}, ${TO}))
            )`;
        });

        const combinedWhere = wordConditions.reduce((acc, cond) =>
            Prisma.sql`${acc} AND ${cond}`
        );

        const matched = await prisma.$queryRaw<{ id: string }[]>`
            SELECT p.id
            FROM "Product" p
            LEFT JOIN "Club" cl  ON cl.id  = p."clubId"
            LEFT JOIN "Category" cat ON cat.id = p."categoryId"
            WHERE ${combinedWhere}
            LIMIT 10
        `;

        if (matched.length === 0) return res.json([]);

        const matchedIds = matched.map(r => r.id);

        const results = await prisma.product.findMany({
            where: { id: { in: matchedIds } },
            select: {
                id: true,
                slug: true,
                name: true,
                images: { take: 1, select: { url: true }, orderBy: { sortOrder: 'asc' } },
                variants: { take: 1, select: { priceCents: true } },
                category: { select: { name: true } },
                club: { select: { name: true } },
            },
            take: 5,
        });

        const items = results.map(p => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            imageUrl: p.images[0]?.url || '',
            price: p.variants[0] ? p.variants[0].priceCents / 100 : 0,
            clubName: p.club?.name || null,
            categoryName: p.category?.name || null,
        }));

        res.json(items);
    } catch (error) {
        console.error('Instant search error:', error);
        res.status(500).json([]);
    }
});

export default router;
