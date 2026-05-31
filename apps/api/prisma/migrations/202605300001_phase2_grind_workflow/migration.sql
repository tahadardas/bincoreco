-- Phase 2: explicit coffee bean grind workflow and order item snapshots.

CREATE TABLE "product_grind_options" (
  "productId" TEXT NOT NULL,
  "grindOptionId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_grind_options_pkey" PRIMARY KEY ("productId", "grindOptionId")
);

CREATE INDEX "product_grind_options_grindOptionId_idx"
  ON "product_grind_options"("grindOptionId");

ALTER TABLE "product_grind_options"
  ADD CONSTRAINT "product_grind_options_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_grind_options"
  ADD CONSTRAINT "product_grind_options_grindOptionId_fkey"
  FOREIGN KEY ("grindOptionId") REFERENCES "grind_options"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD COLUMN "grindType" TEXT,
  ADD COLUMN "grindOptionId" TEXT,
  ADD COLUMN "grindOptionNameAr" TEXT,
  ADD COLUMN "grindOptionNameEn" TEXT,
  ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'SYP';
