// Cleanup script: nullify orphaned OrderItem.productId before migration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "OrderItem"
    SET "productId" = NULL
    WHERE "productId" IS NOT NULL
      AND "productId" NOT IN (SELECT id FROM "Product")
  `;
  console.log(`✅ Nullified ${result} orphaned productId(s) in OrderItem`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
