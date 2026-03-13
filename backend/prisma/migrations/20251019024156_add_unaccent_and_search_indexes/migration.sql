-- SOLO ÍNDICES NORMALES (compatibles con shadow DB de Prisma)
-- (Sin CREATE EXTENSION unaccent, sin funciones ni índices funcionales)

CREATE INDEX IF NOT EXISTS "idx_product_comp"
  ON "Product" ("clubId","seasonId","jerseyStyle","createdAt");

CREATE INDEX IF NOT EXISTS "idx_product_slug"
  ON "Product" ("slug");

CREATE INDEX IF NOT EXISTS "idx_variant_product"
  ON "ProductVariant" ("productId");

CREATE INDEX IF NOT EXISTS "idx_variant_combo"
  ON "ProductVariant" ("size","audience","sleeve");

CREATE INDEX IF NOT EXISTS "idx_variant_price"
  ON "ProductVariant" ("priceCents");

CREATE INDEX IF NOT EXISTS "idx_variant_stock"
  ON "ProductVariant" ("stock");
