"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { WarehouseType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createWarehouse(formData: {
  name: string;
  type: WarehouseType;
}) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const warehouse = await prisma.warehouse.create({
      data: {
        name: formData.name,
        type: formData.type,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "CREATE_WAREHOUSE",
      entity: "Warehouse",
      entityId: warehouse.id,
      details: { name: warehouse.name, type: warehouse.type },
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true, warehouse };
  } catch (error) {
    console.error("Create warehouse error:", error);
    return { error: "Failed to create warehouse" };
  }
}

export async function updateWarehouse(
  id: string,
  formData: {
    name: string;
    type: WarehouseType;
  }
) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name: formData.name,
        type: formData.type,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "UPDATE_WAREHOUSE",
      entity: "Warehouse",
      entityId: warehouse.id,
      details: { name: warehouse.name, type: warehouse.type },
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true, warehouse };
  } catch (error) {
    console.error("Update warehouse error:", error);
    return { error: "Failed to update warehouse" };
  }
}

export async function deleteWarehouse(id: string) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.warehouse.delete({
      where: { id },
    });

    await logHistory({
      userId: session.user.id,
      action: "DELETE_WAREHOUSE",
      entity: "Warehouse",
      entityId: id,
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true };
  } catch (error) {
    console.error("Delete warehouse error:", error);
    return { error: "Failed to delete warehouse" };
  }
}

export async function getWarehouses() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { stocks: true },
        },
      },
    });

    return { success: true, warehouses };
  } catch (error) {
    console.error("Get warehouses error:", error);
    return { error: "Failed to fetch warehouses" };
  }
}
