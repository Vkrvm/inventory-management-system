import { prisma } from "./src/lib/db";

async function main() {
  console.log("Adding language and currency support...");

  try {
    // Add Language enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Language" AS ENUM ('AR', 'EN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add Currency enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Currency" AS ENUM ('EGP', 'USD', 'TRY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add language field to User table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language" "Language" NOT NULL DEFAULT 'AR';
    `);

    // Add currency fields to Invoice table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "currency" "Currency" NOT NULL DEFAULT 'EGP';
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "subtotalInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "finalTotalInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paidAmountInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "remainingBalanceInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);

    // Update existing invoices
    console.log("Updating existing invoices...");
    await prisma.$executeRawUnsafe(`
      UPDATE "Invoice" SET
        "subtotalInCurrency" = "subtotal",
        "finalTotalInCurrency" = "finalTotal",
        "paidAmountInCurrency" = "paidAmount",
        "remainingBalanceInCurrency" = "remainingBalance"
      WHERE "subtotalInCurrency" = 0;
    `);

    // Add currency fields to InvoiceItem table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "priceInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "totalInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);

    // Update existing invoice items
    console.log("Updating existing invoice items...");
    await prisma.$executeRawUnsafe(`
      UPDATE "InvoiceItem" SET
        "priceInCurrency" = "price",
        "totalInCurrency" = "total"
      WHERE "priceInCurrency" = 0;
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
