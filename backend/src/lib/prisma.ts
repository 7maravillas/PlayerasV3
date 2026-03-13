import { PrismaClient } from '@prisma/client';

// Evita que se creen múltiples conexiones en modo desarrollo (hot-reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'], // Agregamos 'query' para ver qué hace
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;