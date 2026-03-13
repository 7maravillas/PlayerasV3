-- CreateIndex
CREATE INDEX "Product_clubId_seasonId_jerseyStyle_createdAt_idx" ON "Product"("clubId", "seasonId", "jerseyStyle", "createdAt");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_size_audience_sleeve_idx" ON "ProductVariant"("size", "audience", "sleeve");

-- CreateIndex
CREATE INDEX "ProductVariant_priceCents_idx" ON "ProductVariant"("priceCents");

-- CreateIndex
CREATE INDEX "ProductVariant_stock_idx" ON "ProductVariant"("stock");
