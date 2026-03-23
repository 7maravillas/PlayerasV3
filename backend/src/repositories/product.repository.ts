// backend/src/repositories/product.repository.ts
import { prisma } from '../lib/prisma.js';
import { Prisma as PrismaClient } from '@prisma/client';
import { decodeCursor, encodeCursor } from '../lib/pagination.js';
import type {
  ProductWithRelations,
  ListProductFilters,
  PaginatedResponse,
  CreateProductDTO,
  CreateVariantDTO,
} from '../types/product.types.js';
import type { Prisma } from '@prisma/client';

// Alias de tipos genéricos seguros (evitan `any`)
type Where = Record<string, unknown>;
type VariantFilters = Record<string, unknown>;

export class ProductRepository {
  async findMany(
    filters: ListProductFilters
  ): Promise<PaginatedResponse<ProductWithRelations>> {
    const {
      club,
      season,
      style,
      size,
      audience,
      sleeve,
      minPrice,
      maxPrice,
      inStock,
      limit,
      cursor,
      search,
    } = filters;

    // Filtros a nivel producto
    const productWhere: Where = {};
    if (club) (productWhere as Record<string, unknown>).club = { slug: club };
    if (season) (productWhere as Record<string, unknown>).season = { code: season };
    if (style) (productWhere as Record<string, unknown>).jerseyStyle = style;

    // Filtros a nivel variante
    const variantFilters: VariantFilters = {};
    if (size) (variantFilters as Record<string, unknown>).size = size;
    if (audience) (variantFilters as Record<string, unknown>).audience = audience;
    if (sleeve) (variantFilters as Record<string, unknown>).sleeve = sleeve;

    if (minPrice !== undefined || maxPrice !== undefined) {
      const price: { gte?: number; lte?: number } = {};
      if (minPrice !== undefined) price.gte = minPrice;
      if (maxPrice !== undefined) price.lte = maxPrice;
      (variantFilters as Record<string, unknown>).priceCents = price;
    }

    const showOnlyInStock = inStock === true;
    if (Object.keys(variantFilters).length > 0 || showOnlyInStock) {
      (variantFilters as Record<string, unknown>).stock = { gt: 0 };
    }

    // Base where (producto)
    let where: Where = { ...productWhere };
    if (Object.keys(variantFilters).length > 0) {
      (where as Record<string, unknown>).variants = { some: variantFilters };
    }

    // --- Búsqueda multi-palabra sin acentos (usando translate) ----------------
    if (search && search.trim().length > 0) {
      const FROM = 'ÁÉÍÓÚáéíóúÄËÏÖÜäëïöüÀÈÌÒÙàèìòùÇçÑñ';
      const TO   = 'AEIOUaeiouAEIOUaeiouAEIOUaeiouCcNn';

      // Dividir la query en palabras individuales (máx. 5)
      const words = search.trim().split(/\s+/).filter(Boolean).slice(0, 5);

      // Para cada palabra construimos una condición OR entre nombre/descripción/club
      const wordConditions = words.map(word => {
        const q = `%${word.toLowerCase()}%`;
        return PrismaClient.sql`(
          lower(translate(p.name, ${FROM}, ${TO})) LIKE lower(translate(${q}, ${FROM}, ${TO}))
          OR lower(translate(p.description, ${FROM}, ${TO})) LIKE lower(translate(${q}, ${FROM}, ${TO}))
          OR lower(translate(c.name, ${FROM}, ${TO})) LIKE lower(translate(${q}, ${FROM}, ${TO}))
        )`;
      });

      // Todas las palabras deben estar presentes (AND)
      const combinedWhere = wordConditions.reduce((acc, cond) =>
        PrismaClient.sql`${acc} AND ${cond}`
      );

      const matched = await prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM "Product" p
        LEFT JOIN "Club" c ON c.id = p."clubId"
        WHERE ${combinedWhere}
        LIMIT 1000
      `;

      const matchedIds = matched.map(r => r.id);

      if (matchedIds.length === 0) {
        return {
          items: [],
          pagination: { nextCursor: null, hasMore: false, count: 0, limit, total: 0 },
        };
      }

      (where as Record<string, unknown>).id = { in: matchedIds };
    }
    // --------------------------------------------------------------------------

    // Paginación por cursor (createdAt DESC, id DESC)
    const decoded = decodeCursor(cursor);
    if (decoded) {
      where = {
        AND: [
          where,
          {
            OR: [
              { createdAt: { lt: new Date(decoded.createdAt) } },
              {
                AND: [
                  { createdAt: new Date(decoded.createdAt) },
                  { id: { lt: decoded.id } },
                ],
              },
            ],
          },
        ],
      };
    }

    const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
    const take = limit + 1;

    // Incluir solo las variantes que cumplen los filtros (si hay), con tipo de Prisma
    const variantsInclude: true | { where: Prisma.ProductVariantWhereInput } =
      Object.keys(variantFilters).length > 0
        ? { where: variantFilters as Prisma.ProductVariantWhereInput }
        : true;

    // Cast del where a tipo de Prisma para la consulta
    const prismaWhere = where as unknown as Prisma.ProductWhereInput;

    // total para paginación UX
    const total = await prisma.product.count({ where: prismaWhere });

    const items = await prisma.product.findMany({
      where: prismaWhere,
      include: {
        images: true,
        variants: variantsInclude,
        club: { select: { id: true, name: true, slug: true } },
        season: { select: { id: true, code: true, startYear: true, endYear: true } },
      },
      orderBy,
      take,
    });

    // Cursor siguiente
    let nextCursor: string | null = null;
    let data = items;

    if (items.length > limit) {
      const last = items[limit - 1]!;
      data = items.slice(0, limit);
      nextCursor = encodeCursor({
        createdAt: last.createdAt.toISOString(),
        id: last.id,
      });
    }

    return {
      items: data as ProductWithRelations[],
      pagination: {
        nextCursor,
        hasMore: items.length > limit,
        count: data.length,
        limit,
        total,
      },
    };
  }

  async findBySlug(slug: string): Promise<ProductWithRelations | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        variants: true,
        club: { select: { id: true, name: true, slug: true } },
        season: { select: { id: true, code: true, startYear: true, endYear: true } },
        tags: { include: { tag: true } },
      },
    });

    return product as ProductWithRelations | null;
  }

  async create(data: CreateProductDTO) {
    const { imageUrl, images, variants, ...productData } = data;

    // Determinar la data de imágenes: preferir images[] sobre imageUrl
    let imagesCreate: { url: string; sortOrder: number }[] | undefined;
    if (images && images.length > 0) {
      imagesCreate = images.map((url, i) => ({ url, sortOrder: i }));
    } else if (imageUrl) {
      imagesCreate = [{ url: imageUrl, sortOrder: 0 }];
    }

    return await prisma.product.create({
      data: {
        ...productData,
        images: imagesCreate ? { create: imagesCreate } : undefined,
        variants: variants && variants.length > 0
          ? { create: variants }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        club: { select: { id: true, name: true, slug: true } },
        season: { select: { id: true, code: true } },
      },
    });
  }

  async createVariant(data: CreateVariantDTO) {
    return await prisma.productVariant.create({
      data,
    });
  }
}
