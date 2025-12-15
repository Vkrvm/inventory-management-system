-- ============================================
-- QUICK SETUP FOR SUPABASE SQL EDITOR
-- Copy and paste this entire script into Supabase SQL Editor
-- ============================================

-- Step 1: Create all ENUM types
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'WAREHOUSE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "WarehouseType" AS ENUM ('MATERIAL', 'PRODUCT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MaterialUnit" AS ENUM ('KG', 'METER', 'PIECE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProductType" AS ENUM ('WALLET', 'BELT', 'BAG', 'ACCESSORY', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'PARTIAL', 'UNPAID');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Step 2: Install pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 3: Create all tables
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SALES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "type" "WarehouseType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "unit" "MaterialUnit" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "ProductType" NOT NULL,
    "brandName" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("type", "brandName", "code")
);

CREATE TABLE IF NOT EXISTS "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("productId", "color")
);

CREATE TABLE IF NOT EXISTS "Stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "materialId" TEXT,
    "productVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "warehouseFromId" TEXT,
    "warehouseToId" TEXT,
    "materialId" TEXT,
    "productVariantId" TEXT,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "discountType" "DiscountType",
    "discountValue" DOUBLE PRECISION DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "History" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Add foreign keys (only if not exist)
DO $$ BEGIN
    ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Stock" ADD CONSTRAINT "Stock_warehouseId_fkey"
        FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS "History_userId_idx" ON "History"("userId");
CREATE INDEX IF NOT EXISTS "History_action_idx" ON "History"("action");
CREATE INDEX IF NOT EXISTS "History_entity_idx" ON "History"("entity");
CREATE INDEX IF NOT EXISTS "History_createdAt_idx" ON "History"("createdAt");

-- Step 6: Insert seed data with bcrypt-hashed passwords
-- Password for all accounts: admin123, manager123, sales123
-- Bcrypt hash for "admin123": $2a$10$K7u5yLGJGjx.xF5e6rJ4yOZ7rP8fV5L5xN5K5K5K5K5K5K5K5K5K5K
-- Note: You'll need to generate real bcrypt hashes

INSERT INTO "User" ("id", "email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES
    ('clx1admin000', 'admin@example.com', crypt('admin123', gen_salt('bf')), 'Super Admin', 'SUPER_ADMIN', true, NOW(), NOW()),
    ('clx1manager00', 'manager@example.com', crypt('manager123', gen_salt('bf')), 'Store Manager', 'MANAGER', true, NOW(), NOW()),
    ('clx1sales0000', 'sales@example.com', crypt('sales123', gen_salt('bf')), 'Sales Person', 'SALES', true, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "Warehouse" ("id", "name", "type", "createdAt", "updatedAt")
VALUES
    ('clx1wh-product', 'Main Product Warehouse', 'PRODUCT', NOW(), NOW()),
    ('clx1wh-material', 'Raw Materials Warehouse', 'MATERIAL', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Material" ("id", "name", "unit", "createdAt", "updatedAt")
VALUES
    ('clx1mat-leather', 'Premium Leather', 'METER', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Customer" ("id", "name", "email", "phone", "address", "createdAt", "updatedAt")
VALUES
    ('clx1cust-john', 'John Doe', 'john@example.com', '+1234567890', '123 Main St, City, Country', NOW(), NOW()),
    ('clx1cust-jane', 'Jane Smith', 'jane@example.com', '+0987654321', '456 Oak Ave, City, Country', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Success message
SELECT 'Database setup complete! You can now login with admin@example.com / admin123' AS message;
