// backend/src/types/product.types.ts
import type {
  Product,
  ProductImage,
  ProductVariant,
  JerseyStyle,
  Audience,
  Sleeve,
} from '@prisma/client';

/** Producto con relaciones usadas en el repositorio */
export type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
  club: {
    id: string;
    name: string;
    slug: string;
  };
  season: {
    id: string;
    code: string;
    startYear?: number;
    endYear?: number;
  };
  tags?: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
};

/** Filtros soportados en el listado */
export interface ListProductFilters {
  club?: string;          // club slug
  season?: string;        // season code (p.ej. "24/25" o "2025")
  style?: JerseyStyle;
  size?: string;
  audience?: Audience;
  sleeve?: Sleeve;
  minPrice?: number;      // en cents
  maxPrice?: number;      // en cents
  inStock?: boolean;
  limit: number;
  cursor?: string | null; // cursor de paginación
  search?: string;
}

/** Respuesta paginada estándar */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    count: number;
    limit: number;
    total: number;
  };
}

/** DTO para crear producto en el repositorio (solo campos válidos en BD) */
export interface CreateProductDTO {
  name: string;
  slug: string;
  description: string;          // el service asegura default ''
  brand: string | null;         // el service asegura null si falta
  jerseyStyle: JerseyStyle;
  authentic: boolean;           // el service asegura default false
  clubId: string;
  seasonId: string;
  imageUrl?: string;
  images?: string[];
  variants?: any[];
}

/** DTO para crear variante */
export interface CreateVariantDTO {
  productId: string;
  sku: string;
  size: string;
  audience: Audience;
  sleeve: Sleeve;
  hasLeaguePatch?: boolean;
  hasChampionsPatch?: boolean;
  allowsNameNumber?: boolean;
  priceCents: number;
  compareAtPriceCents?: number | null;
  costCents: number;
  currency?: string;   // default 'MXN' en validator
  stock?: number;      // default 0 en validator
  weightGrams?: number | null;
}

/**
 * Entrada para el Service: permite slug/code además de IDs.
 * (El service la mapea a CreateProductDTO para el repositorio)
 */
export type CreateProductInput = Omit<CreateProductDTO, 'clubId' | 'seasonId'> & {
  clubId?: string;
  clubSlug?: string;
  seasonId?: string;
  seasonCode?: string;
  variants?: any[];
};
