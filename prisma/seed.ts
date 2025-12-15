import { PrismaClient, UserRole, WarehouseType, ProductType, MaterialUnit } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create Super Admin
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log("✅ Created Super Admin:", superAdmin.email);

  // Create additional users
  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      password: await bcrypt.hash("manager123", 10),
      name: "Store Manager",
      role: UserRole.MANAGER,
      isActive: true,
    },
  });
  console.log("✅ Created Manager:", manager.email);

  const sales = await prisma.user.upsert({
    where: { email: "sales@example.com" },
    update: {},
    create: {
      email: "sales@example.com",
      password: await bcrypt.hash("sales123", 10),
      name: "Sales Person",
      role: UserRole.SALES,
      isActive: true,
    },
  });
  console.log("✅ Created Sales:", sales.email);

  // Create Warehouses
  const productWarehouse = await prisma.warehouse.upsert({
    where: { name: "Main Product Warehouse" },
    update: {},
    create: {
      name: "Main Product Warehouse",
      type: WarehouseType.PRODUCT,
    },
  });
  console.log("✅ Created Product Warehouse:", productWarehouse.name);

  const materialWarehouse = await prisma.warehouse.upsert({
    where: { name: "Raw Materials Warehouse" },
    update: {},
    create: {
      name: "Raw Materials Warehouse",
      type: WarehouseType.MATERIAL,
    },
  });
  console.log("✅ Created Material Warehouse:", materialWarehouse.name);

  // Create Materials
  const leather = await prisma.material.upsert({
    where: { name: "Premium Leather" },
    update: {},
    create: {
      name: "Premium Leather",
      unit: MaterialUnit.METER,
    },
  });
  console.log("✅ Created Material:", leather.name);

  // Create Products
  const wallet1 = await prisma.product.upsert({
    where: {
      type_brandName_code: {
        type: ProductType.WALLET,
        brandName: "LuxBrand",
        code: "W001",
      },
    },
    update: {},
    create: {
      type: ProductType.WALLET,
      brandName: "LuxBrand",
      code: "W001",
      description: "Premium leather wallet with RFID protection",
    },
  });
  console.log("✅ Created Product:", `${wallet1.brandName} ${wallet1.code}`);

  const belt1 = await prisma.product.upsert({
    where: {
      type_brandName_code: {
        type: ProductType.BELT,
        brandName: "LuxBrand",
        code: "B001",
      },
    },
    update: {},
    create: {
      type: ProductType.BELT,
      brandName: "LuxBrand",
      code: "B001",
      description: "Classic leather belt",
    },
  });
  console.log("✅ Created Product:", `${belt1.brandName} ${belt1.code}`);

  // Create Product Variants (Colors)
  const walletBlack = await prisma.productVariant.upsert({
    where: {
      productId_color: {
        productId: wallet1.id,
        color: "Black",
      },
    },
    update: {},
    create: {
      productId: wallet1.id,
      color: "Black",
    },
  });
  console.log("✅ Created Variant: Wallet - Black");

  const walletBrown = await prisma.productVariant.upsert({
    where: {
      productId_color: {
        productId: wallet1.id,
        color: "Brown",
      },
    },
    update: {},
    create: {
      productId: wallet1.id,
      color: "Brown",
    },
  });
  console.log("✅ Created Variant: Wallet - Brown");

  const beltBlack = await prisma.productVariant.upsert({
    where: {
      productId_color: {
        productId: belt1.id,
        color: "Black",
      },
    },
    update: {},
    create: {
      productId: belt1.id,
      color: "Black",
    },
  });
  console.log("✅ Created Variant: Belt - Black");

  // Add Stock
  await prisma.stock.upsert({
    where: {
      warehouseId_productVariantId: {
        warehouseId: productWarehouse.id,
        productVariantId: walletBlack.id,
      },
    },
    update: {},
    create: {
      warehouseId: productWarehouse.id,
      productVariantId: walletBlack.id,
      quantity: 50,
    },
  });

  await prisma.stock.upsert({
    where: {
      warehouseId_productVariantId: {
        warehouseId: productWarehouse.id,
        productVariantId: walletBrown.id,
      },
    },
    update: {},
    create: {
      warehouseId: productWarehouse.id,
      productVariantId: walletBrown.id,
      quantity: 30,
    },
  });

  await prisma.stock.upsert({
    where: {
      warehouseId_productVariantId: {
        warehouseId: productWarehouse.id,
        productVariantId: beltBlack.id,
      },
    },
    update: {},
    create: {
      warehouseId: productWarehouse.id,
      productVariantId: beltBlack.id,
      quantity: 25,
    },
  });

  await prisma.stock.upsert({
    where: {
      warehouseId_materialId: {
        warehouseId: materialWarehouse.id,
        materialId: leather.id,
      },
    },
    update: {},
    create: {
      warehouseId: materialWarehouse.id,
      materialId: leather.id,
      quantity: 100,
    },
  });
  console.log("✅ Created Stock entries");

  // Create Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      address: "123 Main St, City, Country",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: "seed-customer-2" },
    update: {},
    create: {
      id: "seed-customer-2",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+0987654321",
      address: "456 Oak Ave, City, Country",
    },
  });
  console.log("✅ Created Customers");

  console.log("🎉 Database seed completed successfully!");
  console.log("\n📝 Login Credentials:");
  console.log("Super Admin: admin@example.com / admin123");
  console.log("Manager: manager@example.com / manager123");
  console.log("Sales: sales@example.com / sales123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
