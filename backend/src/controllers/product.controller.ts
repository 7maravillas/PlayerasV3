// backend/src/controllers/product.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import {
  ListQuerySchema,
  CreateProductSchema,
  CreateVariantSchema,
} from '../validators/product.validator.js';

export class ProductController {
  private service: ProductService;

  constructor(service: ProductService) {
    this.service = service;
  }

  /**
   * GET /api/v1/products - Lista productos con filtros
   */
  listProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ListQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const result = await this.service.listProducts(parsed.data);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/products/:slug - Obtiene producto por slug
   */
  getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const product = await this.service.getProductBySlug(slug);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json(product);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/v1/products - Crea un nuevo producto
   * Acepta:
   *  - clubId (UUID) o clubSlug (slug)  [exclusivos]
   *  - seasonId (UUID) o seasonCode     [exclusivos]
   */
  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const created = await this.service.createProduct(parsed.data);
      return res.status(201).json(created);
    } catch (error: unknown) {
      const err = error as { code?: string; meta?: unknown; name?: string; flatten?: () => unknown } | undefined;

      // Prisma unique constraint (slug duplicado, etc.)
      if (err?.code === 'P2002') {
        return res.status(409).json({
          error: 'Unique constraint failed',
          meta: err?.meta,
        });
      }

      // ZodError (por si se propagara desde otra capa)
      if (err?.name === 'ZodError') {
        return res.status(400).json({ error: err.flatten?.() ?? 'Validation error' });
      }

      return next(error);
    }
  };

  /**
   * POST /api/v1/variants - Crea una nueva variante
   */
  createVariant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateVariantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const created = await this.service.createVariant(parsed.data);
      return res.status(201).json(created);
    } catch (error: unknown) {
      const err = error as { code?: string; meta?: unknown; name?: string; flatten?: () => unknown } | undefined;

      if (err?.code === 'P2002') {
        return res.status(409).json({
          error: 'Unique constraint failed',
          meta: err?.meta,
        });
      }

      if (err?.name === 'ZodError') {
        return res.status(400).json({ error: err.flatten?.() ?? 'Validation error' });
      }

      return next(error);
    }
  };
}
