"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { MovementType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateStock(formData: {
  warehouseId: string;
  materialId?: string;
  productVariantId?: string;
  quantity: number;
  type: MovementType;
  notes?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const { warehouseId, materialId, productVariantId, quantity, type, notes } =
      formData;

    // Validate that only one of materialId or productVariantId is provided
    if (
      (!materialId && !productVariantId) ||
      (materialId && productVariantId)
    ) {
      return { error: "Must provide either materialId or productVariantId" };
    }

    // Find or create stock entry
    const stockWhere = materialId
      ? { warehouseId, materialId }
      : { warehouseId, productVariantId };

    let stock = await prisma.stock.findFirst({
      where: stockWhere as any,
    });

    const delta = type === MovementType.IN ? quantity : -quantity;
    const newQuantity = (stock?.quantity || 0) + delta;

    if (newQuantity < 0) {
      return { error: "Insufficient stock" };
    }

    if (stock) {
      stock = await prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: newQuantity },
      });
    } else {
      stock = await prisma.stock.create({
        data: {
          warehouseId,
          materialId,
          productVariantId,
          quantity: newQuantity,
        },
      });
    }

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        type,
        quantity,
        warehouseToId: type === MovementType.IN ? warehouseId : undefined,
        warehouseFromId: type === MovementType.OUT ? warehouseId : undefined,
        materialId,
        productVariantId,
        userId: session.user.id,
        notes,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: `STOCK_${type}`,
      entity: "Stock",
      entityId: stock.id,
      details: { quantity, newQuantity },
    });

    revalidatePath("/dashboard/stock");
    return { success: true, stock };
  } catch (error) {
    console.error("Update stock error:", error);
    return { error: "Failed to update stock" };
  }
}

export async function transferStock(formData: {
  warehouseFromId: string;
  warehouseToId: string;
  materialId?: string;
  productVariantId?: string;
  quantity: number;
  notes?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const {
      warehouseFromId,
      warehouseToId,
      materialId,
      productVariantId,
      quantity,
      notes,
    } = formData;

    if (
      (!materialId && !productVariantId) ||
      (materialId && productVariantId)
    ) {
      return { error: "Must provide either materialId or productVariantId" };
    }

    // Reduce from source warehouse
    const fromStockWhere = materialId
      ? { warehouseId: warehouseFromId, materialId }
      : { warehouseId: warehouseFromId, productVariantId };

    const fromStock = await prisma.stock.findFirst({
      where: fromStockWhere as any,
    });

    if (!fromStock || fromStock.quantity < quantity) {
      return { error: "Insufficient stock in source warehouse" };
    }

    await prisma.stock.update({
      where: { id: fromStock.id },
      data: { quantity: fromStock.quantity - quantity },
    });

    // Add to destination warehouse
    const toStockWhere = materialId
      ? { warehouseId: warehouseToId, materialId }
      : { warehouseId: warehouseToId, productVariantId };

    let toStock = await prisma.stock.findFirst({
      where: toStockWhere as any,
    });

    if (toStock) {
      await prisma.stock.update({
        where: { id: toStock.id },
        data: { quantity: toStock.quantity + quantity },
      });
    } else {
      await prisma.stock.create({
        data: {
          warehouseId: warehouseToId,
          materialId,
          productVariantId,
          quantity,
        },
      });
    }

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        type: MovementType.TRANSFER,
        quantity,
        warehouseFromId,
        warehouseToId,
        materialId,
        productVariantId,
        userId: session.user.id,
        notes,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "STOCK_TRANSFER",
      entity: "Stock",
      details: { warehouseFromId, warehouseToId, quantity },
    });

    revalidatePath("/dashboard/stock");
    return { success: true };
  } catch (error) {
    console.error("Transfer stock error:", error);
    return { error: "Failed to transfer stock" };
  }
}

export async function getStockByWarehouse() {
  try {
    const stocks = await prisma.stock.findMany({
      include: {
        warehouse: true,
        material: {
          include: {
            unit: true,
          },
        },
        productVariant: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, stocks };
  } catch (error) {
    console.error("Get stock error:", error);
    return { error: "Failed to fetch stock" };
  }
}
