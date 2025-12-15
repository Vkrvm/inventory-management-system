-- Add accountBalance to Customer table
ALTER TABLE "Customer" ADD COLUMN "accountBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Create CustomerPayment table for account-based payments
CREATE TABLE "CustomerPayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPayment_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "CustomerPayment_customerId_idx" ON "CustomerPayment"("customerId");
CREATE INDEX "CustomerPayment_paymentDate_idx" ON "CustomerPayment"("paymentDate");

-- Migrate existing CREDIT invoices to new account balance system
-- For each customer with CREDIT invoices, sum up their remaining balances
UPDATE "Customer" c
SET "accountBalance" = COALESCE((
    SELECT SUM(i."remainingBalance")
    FROM "Invoice" i
    WHERE i."customerId" = c."id"
    AND i."paymentType" = 'CREDIT'
), 0);
