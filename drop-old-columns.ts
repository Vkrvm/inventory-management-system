import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dropOldColumns() {
  try {
    console.log('🔄 Dropping old Product columns (type, brandName)...\n');

    // Drop old columns that are no longer needed
    console.log('Dropping "type" column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" DROP COLUMN IF EXISTS "type"
    `);

    console.log('Dropping "brandName" column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" DROP COLUMN IF EXISTS "brandName"
    `);

    console.log('\n✅ Old columns dropped successfully!');
    console.log('The Product table now only uses categoryId and brandId.');

  } catch (error) {
    console.error('❌ Failed to drop columns:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

dropOldColumns();
