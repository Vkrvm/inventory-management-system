-- Add Language enum
CREATE TYPE "Language" AS ENUM ('AR', 'EN');

-- Add Currency enum
CREATE TYPE "Currency" AS ENUM ('EGP', 'USD', 'TRY');

-- Add language field to User table
ALTER TABLE "User" ADD COLUMN "language" "Language" NOT NULL DEFAULT 'AR';

-- Add currency fields to Invoice table
ALTER TABLE "Invoice" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'EGP';
ALTER TABLE "Invoice" ADD COLUMN "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
ALTER TABLE "Invoice" ADD COLUMN "subtotalInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "finalTotalInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "paidAmountInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN "remainingBalanceInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Update existing invoices to have currency totals equal to EGP totals
UPDATE "Invoice" SET
  "subtotalInCurrency" = "subtotal",
  "finalTotalInCurrency" = "finalTotal",
  "paidAmountInCurrency" = "paidAmount",
  "remainingBalanceInCurrency" = "remainingBalance";

-- Add currency fields to InvoiceItem table
ALTER TABLE "InvoiceItem" ADD COLUMN "priceInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "InvoiceItem" ADD COLUMN "totalInCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Update existing invoice items to have currency prices equal to EGP prices
UPDATE "InvoiceItem" SET
  "priceInCurrency" = "price",
  "totalInCurrency" = "total";
