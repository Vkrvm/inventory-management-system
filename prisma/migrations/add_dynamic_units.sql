-- Create Unit table
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- Create unique index on Unit name
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- Insert default units (migrating from enum)
INSERT INTO "Unit" ("id", "name", "abbreviation", "createdAt", "updatedAt") VALUES
    (gen_random_uuid()::text, 'Kilogram', 'KG', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Meter', 'M', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Piece', 'PCS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add unitId column to Material table (nullable first)
ALTER TABLE "Material" ADD COLUMN "unitId" TEXT;

-- Migrate existing material units to new Unit references
UPDATE "Material" m
SET "unitId" = (
    SELECT "id" FROM "Unit" u
    WHERE
        (m."unit" = 'KG' AND u."abbreviation" = 'KG') OR
        (m."unit" = 'METER' AND u."abbreviation" = 'M') OR
        (m."unit" = 'PIECE' AND u."abbreviation" = 'PCS')
    LIMIT 1
);

-- Make unitId NOT NULL now that all rows have values
ALTER TABLE "Material" ALTER COLUMN "unitId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "Material" ADD CONSTRAINT "Material_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old unit enum column (keep enum for backward compatibility)
ALTER TABLE "Material" DROP COLUMN "unit";
