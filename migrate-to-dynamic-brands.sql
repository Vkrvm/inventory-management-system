-- ============================================
-- MIGRATION: Convert static brand/type to dynamic Brand and ProductCategory tables
-- ============================================

-- Step 1: Create new tables
CREATE TABLE IF NOT EXISTS "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert initial brands (Amazon, Safari, Rodeo)
INSERT INTO "Brand" ("id", "name", "createdAt", "updatedAt")
VALUES
    ('brand-amazon', 'Amazon', NOW(), NOW()),
    ('brand-safari', 'Safari', NOW(), NOW()),
    ('brand-rodeo', 'Rodeo', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Step 3: Insert product categories from existing ProductType enum
INSERT INTO "ProductCategory" ("id", "name", "createdAt", "updatedAt")
VALUES
    ('cat-wallet', 'WALLET', NOW(), NOW()),
    ('cat-belt', 'BELT', NOW(), NOW()),
    ('cat-bag', 'BAG', NOW(), NOW()),
    ('cat-accessory', 'ACCESSORY', NOW(), NOW()),
    ('cat-other', 'OTHER', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Step 4: Add new columns to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brandId" TEXT;

-- Step 5: Migrate existing data
-- Map existing product types to categoryId
UPDATE "Product" p
SET "categoryId" = pc."id"
FROM "ProductCategory" pc
WHERE pc."name" = p."type"::text;

-- Map existing brandName to brandId (create brands if they don't exist)
DO $$
DECLARE
    product_record RECORD;
    brand_id_var TEXT;
BEGIN
    FOR product_record IN SELECT DISTINCT "brandName" FROM "Product" WHERE "brandName" IS NOT NULL
    LOOP
        -- Insert brand if it doesn't exist
        INSERT INTO "Brand" ("id", "name", "createdAt", "updatedAt")
        VALUES ('brand-' || lower(replace(product_record."brandName", ' ', '-')), product_record."brandName", NOW(), NOW())
        ON CONFLICT ("name") DO NOTHING;

        -- Get the brand ID
        SELECT "id" INTO brand_id_var FROM "Brand" WHERE "name" = product_record."brandName";

        -- Update products with this brand
        UPDATE "Product" SET "brandId" = brand_id_var WHERE "brandName" = product_record."brandName";
    END LOOP;
END $$;

-- Step 6: Drop old constraint
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_type_brandName_code_key";

-- Step 7: Make new columns NOT NULL (after data migration)
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "brandId" SET NOT NULL;

-- Step 8: Add foreign key constraints
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 9: Add new unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Product_categoryId_brandId_code_key"
    ON "Product"("categoryId", "brandId", "code");

-- Step 10: Drop old columns (OPTIONAL - comment out if you want to keep for rollback)
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "type";
-- ALTER TABLE "Product" DROP COLUMN IF EXISTS "brandName";

-- Success message
SELECT 'Migration completed! Brand and ProductCategory tables created and data migrated.' AS message;
