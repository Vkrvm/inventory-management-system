"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get all materials
 */
export async function getMaterials() {
  try {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        unit: true,
        _count: {
          select: { stocks: true },
        },
      },
    });

    return { success: true, materials };
  } catch (error: any) {
    console.error("Get materials error:", error);
    return { success: false, error: "Failed to fetch materials" };
  }
}

/**
 * Create a new material (ADMIN and above only)
 */
export async function createMaterial(formData: { name: string; unitId: string }) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const material = await prisma.material.create({
      data: {
        name: formData.name,
        unitId: formData.unitId,
      },
      include: {
        unit: true,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "CREATE_MATERIAL",
      entity: "Material",
      entityId: material.id,
      details: { name: material.name, unitId: material.unitId },
    });

    revalidatePath("/dashboard/materials");
    return { success: true, material };
  } catch (error: any) {
    console.error("Create material error:", error);

    if (error.code === "P2002") {
      return { error: "A material with this name already exists" };
    }

    return { error: "Failed to create material" };
  }
}

/**
 * Update a material (ADMIN and above only)
 */
export async function updateMaterial(
  id: string,
  formData: { name: string; unitId: string }
) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const material = await prisma.material.update({
      where: { id },
      data: {
        name: formData.name,
        unitId: formData.unitId,
      },
      include: {
        unit: true,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "UPDATE_MATERIAL",
      entity: "Material",
      entityId: material.id,
      details: { name: material.name, unitId: material.unitId },
    });

    revalidatePath("/dashboard/materials");
    return { success: true, material };
  } catch (error: any) {
    console.error("Update material error:", error);

    if (error.code === "P2002") {
      return { error: "A material with this name already exists" };
    }

    if (error.code === "P2025") {
      return { error: "Material not found" };
    }

    return { error: "Failed to update material" };
  }
}

/**
 * Delete a material (ADMIN and above only)
 * Note: Cannot delete if stock exists for this material
 */
export async function deleteMaterial(id: string) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if material has stock
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        _count: {
          select: { stocks: true },
        },
      },
    });

    if (!material) {
      return { error: "Material not found" };
    }

    if (material._count.stocks > 0) {
      return {
        error: `Cannot delete material. ${material._count.stocks} stock record(s) exist for this material.`,
      };
    }

    await prisma.material.delete({
      where: { id },
    });

    await logHistory({
      userId: session.user.id,
      action: "DELETE_MATERIAL",
      entity: "Material",
      entityId: id,
    });

    revalidatePath("/dashboard/materials");
    return { success: true };
  } catch (error: any) {
    console.error("Delete material error:", error);

    if (error.code === "P2025") {
      return { error: "Material not found" };
    }

    return { error: "Failed to delete material" };
  }
}
