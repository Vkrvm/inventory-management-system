import { prisma } from "./src/lib/db";

async function main() {
  console.log("Updating currency schema...");

  try {
    // Currency enum should already exist from previous migration
    // Add currency field to User table
    console.log("Adding currency field to User table...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currency" "Currency" NOT NULL DEFAULT 'EGP';
    `);

    // Drop currency-related columns from Invoice table
    console.log("Removing currency fields from Invoice table...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "currency";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "exchangeRate";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "subtotalInCurrency";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "finalTotalInCurrency";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "paidAmountInCurrency";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" DROP COLUMN IF EXISTS "remainingBalanceInCurrency";
    `);

    // Drop currency fields from InvoiceItem table
    console.log("Removing currency fields from InvoiceItem table...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "priceInCurrency";
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "InvoiceItem" DROP COLUMN IF EXISTS "totalInCurrency";
    `);

    console.log("✅ Currency schema updated successfully!");
    console.log("   - Currency is now a user-level preference");
    console.log("   - All prices stored in EGP (base currency)");
    console.log("   - Prices will be converted on-the-fly based on user preference");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
