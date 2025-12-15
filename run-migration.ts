import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Starting migration to dynamic Brand and ProductCategory...\n');

    // Step 1: Create Brand table (via raw SQL)
    console.log('📦 Creating Brand table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Brand" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Step 2: Create ProductCategory table
    console.log('📦 Creating ProductCategory table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProductCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Step 3: Insert initial brands (Amazon, Safari, Rodeo)
    console.log('🏷️  Inserting initial brands (Amazon, Safari, Rodeo)...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Brand" ("id", "name", "createdAt", "updatedAt")
      VALUES
        ('brand-amazon', 'Amazon', NOW(), NOW()),
        ('brand-safari', 'Safari', NOW(), NOW()),
        ('brand-rodeo', 'Rodeo', NOW(), NOW())
      ON CONFLICT ("name") DO NOTHING
    `);

    // Step 4: Insert product categories
    console.log('📂 Inserting product categories...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ProductCategory" ("id", "name", "createdAt", "updatedAt")
      VALUES
        ('cat-wallet', 'WALLET', NOW(), NOW()),
        ('cat-belt', 'BELT', NOW(), NOW()),
        ('cat-bag', 'BAG', NOW(), NOW()),
        ('cat-accessory', 'ACCESSORY', NOW(), NOW()),
        ('cat-other', 'OTHER', NOW(), NOW())
      ON CONFLICT ("name") DO NOTHING
    `);

    // Step 5: Add new columns to Product table
    console.log('➕ Adding categoryId and brandId columns to Product table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "categoryId" TEXT
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brandId" TEXT
    `);

    // Step 6: Migrate existing data - map types to categories
    console.log('🔄 Migrating existing product data...');
    await prisma.$executeRawUnsafe(`
      UPDATE "Product" p
      SET "categoryId" = pc."id"
      FROM "ProductCategory" pc
      WHERE pc."name" = p."type"::text
    `);

    // Step 7: Migrate brand names
    console.log('🔄 Migrating brand names...');
    const existingProducts = await prisma.$queryRawUnsafe<Array<{brandName: string}>>(`
      SELECT DISTINCT "brandName" FROM "Product" WHERE "brandName" IS NOT NULL
    `);

    for (const product of existingProducts) {
      const brandId = 'brand-' + product.brandName.toLowerCase().replace(/\s+/g, '-');

      // Insert brand if doesn't exist
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Brand" ("id", "name", "createdAt", "updatedAt")
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT ("name") DO NOTHING
      `, brandId, product.brandName);

      // Update products with this brand
      await prisma.$executeRawUnsafe(`
        UPDATE "Product" SET "brandId" = $1 WHERE "brandName" = $2
      `, brandId, product.brandName);
    }

    // Step 8: Drop old constraint
    console.log('🗑️  Dropping old unique constraint...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_type_brandName_code_key"
    `);

    // Step 9: Make new columns NOT NULL
    console.log('✅ Making new columns NOT NULL...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ALTER COLUMN "brandId" SET NOT NULL
    `);

    // Step 10: Add foreign key constraints
    console.log('🔗 Adding foreign key constraints...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
          FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `);
    } catch (e: any) {
      if (!e.message.includes('already exists')) throw e;
      console.log('   - categoryId FK already exists, skipping...');
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey"
          FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `);
    } catch (e: any) {
      if (!e.message.includes('already exists')) throw e;
      console.log('   - brandId FK already exists, skipping...');
    }

    // Step 11: Add new unique constraint
    console.log('🔒 Creating new unique constraint...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Product_categoryId_brandId_code_key"
        ON "Product"("categoryId", "brandId", "code")
    `);

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Summary:');
    const brandCount = await prisma.$queryRawUnsafe<Array<{count: bigint}>>(`SELECT COUNT(*) as count FROM "Brand"`);
    const categoryCount = await prisma.$queryRawUnsafe<Array<{count: bigint}>>(`SELECT COUNT(*) as count FROM "ProductCategory"`);
    console.log(`   - Brands: ${brandCount[0].count}`);
    console.log(`   - Categories: ${categoryCount[0].count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
