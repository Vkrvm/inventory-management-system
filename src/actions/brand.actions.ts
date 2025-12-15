"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get all brands
 */
export async function getAllBrands() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return { success: true, data: brands };
  } catch (error: any) {
    console.error("Error fetching brands:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new brand (ADMIN and above only)
 */
export async function createBrand(formData: { name: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Only ADMIN and above can create brands
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions. Only Admins and Managers can create brands." };
    }

    // Validate input
    if (!formData.name || formData.name.trim() === "") {
      return { success: false, error: "Brand name is required" };
    }

    const brand = await prisma.brand.create({
      data: {
        name: formData.name.trim(),
      },
    });

    revalidatePath("/dashboard/brands");
    revalidatePath("/dashboard/products");

    return { success: true, data: brand };
  } catch (error: any) {
    console.error("Error creating brand:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return { success: false, error: "A brand with this name already exists" };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Update a brand (ADMIN and above only)
 */
export async function updateBrand(id: string, formData: { name: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Only ADMIN and above can update brands
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    if (!formData.name || formData.name.trim() === "") {
      return { success: false, error: "Brand name is required" };
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: formData.name.trim(),
      },
    });

    revalidatePath("/dashboard/brands");
    revalidatePath("/dashboard/products");

    return { success: true, data: brand };
  } catch (error: any) {
    console.error("Error updating brand:", error);

    if (error.code === "P2002") {
      return { success: false, error: "A brand with this name already exists" };
    }

    if (error.code === "P2025") {
      return { success: false, error: "Brand not found" };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Delete a brand (ADMIN and above only)
 * Note: Cannot delete if products exist with this brand
 */
export async function deleteBrand(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Only ADMIN and above can delete brands
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if brand has products
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return { success: false, error: "Brand not found" };
    }

    if (brand._count.products > 0) {
      return {
        success: false,
        error: `Cannot delete brand. ${brand._count.products} product(s) are using this brand.`,
      };
    }

    await prisma.brand.delete({
      where: { id },
    });

    revalidatePath("/dashboard/brands");
    revalidatePath("/dashboard/products");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting brand:", error);

    if (error.code === "P2025") {
      return { success: false, error: "Brand not found" };
    }

    return { success: false, error: error.message };
  }
}
