-- Keep one price row per variant/currency before enforcing the unique index.
-- Preference is deterministic and conservative: active prices first, then the
-- oldest UUID lexicographically where timestamps are not available on prices.
WITH ranked_prices AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "productVariantId", "currencyCode"
      ORDER BY "isActive" DESC, id ASC
    ) AS row_number
  FROM "prices"
)
DELETE FROM "prices" AS p
USING ranked_prices AS r
WHERE p.id = r.id
  AND r.row_number > 1;

CREATE UNIQUE INDEX "prices_productVariantId_currencyCode_key"
ON "prices"("productVariantId", "currencyCode");
