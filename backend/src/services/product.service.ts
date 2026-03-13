import { prisma } from '../lib/prisma.js';
import { ProductRepository } from '../repositories/product.repository.js';
import type {
  ListProductFilters,
  PaginatedResponse,
  ProductWithRelations,
  CreateProductDTO,
  CreateVariantDTO,
  CreateProductInput,
} from '../types/product.types.js';

export class ProductService {
  private repository: ProductRepository;

  constructor(repository: ProductRepository) {
    this.repository = repository;
  }

  /**
   * Lista productos con filtros y paginación
   */
  async listProducts(
    filters: ListProductFilters
  ): Promise<PaginatedResponse<ProductWithRelations>> {
    return await this.repository.findMany(filters);
  }

  /**
   * Obtiene un producto por slug
   */
  async getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
    if (!slug || slug.trim().length === 0) {
      throw new Error('Slug is required');
    }
    return await this.repository.findBySlug(slug);
  }

  /**
   * Crea un nuevo producto
   * - Acepta clubId O clubSlug
   * - Acepta seasonId O seasonCode
   * - Normaliza slug a minúsculas
   */
  async createProduct(data: CreateProductInput) {
    // Normalización básica
    const slug = data.slug.toLowerCase();
    const description = data.description ?? '';

    // Resolver clubId si vino clubSlug
    let clubId = data.clubId;
    if (!clubId && data.clubSlug) {
      const club = await prisma.club.findUnique({ where: { slug: data.clubSlug } });
      if (!club) {
        throw new Error(`Club no encontrado para slug "${data.clubSlug}"`);
      }
      clubId = club.id;
    }

    // Resolver seasonId si vino seasonCode
    let seasonId = data.seasonId;
    if (!seasonId && data.seasonCode) {
      const season = await prisma.season.findUnique({ where: { code: data.seasonCode } });
      if (!season) {
        throw new Error(`Temporada no encontrada para código "${data.seasonCode}"`);
      }
      seasonId = season.id;
    }

    // DTO “limpio” solo con campos válidos en BD para el repositorio
    const dto: CreateProductDTO = {
      name: data.name,
      slug,
      description,
      brand: data.brand ?? null,
      jerseyStyle: data.jerseyStyle,
      authentic: data.authentic ?? false,
      clubId: clubId!,       // requerido por el modelo
      seasonId: seasonId!,   // requerido por el modelo
      imageUrl: data.imageUrl,
      images: data.images,

      // Pass variants array through to repository
      variants: data.variants,
    };

    return await this.repository.create(dto);
  }

  async createVariant(data: CreateVariantDTO) {
    return await this.repository.createVariant(data);
  }

  /**
   * Busca productos por término de búsqueda
   * (Lo implementaremos después en TAREA 4)
   */
  async searchProducts(_query: string): Promise<ProductWithRelations[]> {
    // TODO: Implementar búsqueda full-text
    throw new Error('Search not implemented yet');
  }
}
