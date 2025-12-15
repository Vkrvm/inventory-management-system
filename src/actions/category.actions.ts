"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get all product categories
 */
export async function getAllCategories() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const categories = await prisma.productCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return { success: true, data: categories };
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new product category (ADMIN and above only)
 */
export async function createCategory(formData: { name: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Only ADMIN and above can create categories
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions. Only Admins and Managers can create categories." };
    }

    // Validate input
    if (!formData.name || formData.name.trim() === "") {
      return { success: false, error: "Category name is required" };
    }

    const category = await prisma.productCategory.create({
      data: {
        name: formData.name.trim().toUpperCase(), // Store in uppercase for consistency
      },
    });

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");

    return { success: true, data: category };
  } catch (error: any) {
    console.error("Error creating category:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return { success: false, error: "A category with this name already exists" };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Update a product category (ADMIN and above only)
 */
export async function updateCategory(id: string, formData: { name: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Only ADMIN and above can update categories
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    if (!formData.name || formData.name.trim() === "") {
      return { success: false, error: "Category name is required" };
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        name: formData.name.trim().toUpperCase(),
      },
    });

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");

    return { success: true, data: category };
  } catch (error: any) {
    console.error("Error updating category:", error);

    if (error.code === "P2002") {
      return { success: false, error: "A category with this name already exists" };
    }

    if (error.code === "P2025") {
      return { success: false, error: "Category not found" };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Delete a product category (ADMIN and above only)
 * Note: Cannot delete if products exist with this category
 */
export async function deleteCategory(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Only ADMIN and above can delete categories
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if category has products
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    if (category._count.products > 0) {
      return {
        success: false,
        error: `Cannot delete category. ${category._count.products} product(s) are using this category.`,
      };
    }

    await prisma.productCategory.delete({
      where: { id },
    });

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);

    if (error.code === "P2025") {
      return { success: false, error: "Category not found" };
    }

    return { success: false, error: error.message };
  }
}
