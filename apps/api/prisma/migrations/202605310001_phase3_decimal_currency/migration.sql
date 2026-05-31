-- Phase 3: reliable fixed pricing and currency snapshots.

ALTER TABLE "carts"
  ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'SYP';

ALTER TABLE "prices"
  ALTER COLUMN "amount" TYPE DECIMAL(12, 2)
  USING "amount"::numeric(12, 2);

ALTER TABLE "orders"
  ALTER COLUMN "subtotal" TYPE DECIMAL(12, 2)
  USING "subtotal"::numeric(12, 2),
  ALTER COLUMN "discountTotal" TYPE DECIMAL(12, 2)
  USING "discountTotal"::numeric(12, 2),
  ALTER COLUMN "total" TYPE DECIMAL(12, 2)
  USING "total"::numeric(12, 2);

ALTER TABLE "order_items"
  ALTER COLUMN "unitPrice" TYPE DECIMAL(12, 2)
  USING "unitPrice"::numeric(12, 2),
  ALTER COLUMN "total" TYPE DECIMAL(12, 2)
  USING "total"::numeric(12, 2);
