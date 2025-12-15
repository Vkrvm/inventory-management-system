"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get all units
 */
export async function getUnits() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { materials: true },
        },
      },
    });

    return { success: true, units };
  } catch (error: any) {
    console.error("Get units error:", error);
    return { success: false, error: "Failed to fetch units" };
  }
}

/**
 * Create a new unit (ADMIN and above only)
 */
export async function createUnit(formData: { name: string; abbreviation: string }) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const unit = await prisma.unit.create({
      data: {
        name: formData.name,
        abbreviation: formData.abbreviation,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "CREATE_UNIT",
      entity: "Unit",
      entityId: unit.id,
      details: { name: unit.name, abbreviation: unit.abbreviation },
    });

    revalidatePath("/dashboard/units");
    revalidatePath("/dashboard/materials");
    return { success: true, unit };
  } catch (error: any) {
    console.error("Create unit error:", error);

    if (error.code === "P2002") {
      return { error: "A unit with this name already exists" };
    }

    return { error: "Failed to create unit" };
  }
}

/**
 * Update a unit (ADMIN and above only)
 */
export async function updateUnit(
  id: string,
  formData: { name: string; abbreviation: string }
) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const unit = await prisma.unit.update({
      where: { id },
      data: {
        name: formData.name,
        abbreviation: formData.abbreviation,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "UPDATE_UNIT",
      entity: "Unit",
      entityId: unit.id,
      details: { name: unit.name, abbreviation: unit.abbreviation },
    });

    revalidatePath("/dashboard/units");
    revalidatePath("/dashboard/materials");
    return { success: true, unit };
  } catch (error: any) {
    console.error("Update unit error:", error);

    if (error.code === "P2002") {
      return { error: "A unit with this name already exists" };
    }

    if (error.code === "P2025") {
      return { error: "Unit not found" };
    }

    return { error: "Failed to update unit" };
  }
}

/**
 * Delete a unit (ADMIN and above only)
 * Note: Cannot delete if materials exist for this unit
 */
export async function deleteUnit(id: string) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(session.user.role)
  ) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if unit has materials
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        _count: {
          select: { materials: true },
        },
      },
    });

    if (!unit) {
      return { error: "Unit not found" };
    }

    if (unit._count.materials > 0) {
      return {
        error: `Cannot delete unit. ${unit._count.materials} material(s) use this unit.`,
      };
    }

    await prisma.unit.delete({
      where: { id },
    });

    await logHistory({
      userId: session.user.id,
      action: "DELETE_UNIT",
      entity: "Unit",
      entityId: id,
    });

    revalidatePath("/dashboard/units");
    revalidatePath("/dashboard/materials");
    return { success: true };
  } catch (error: any) {
    console.error("Delete unit error:", error);

    if (error.code === "P2025") {
      return { error: "Unit not found" };
    }

    return { error: "Failed to delete unit" };
  }
}
