"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: {
  categoryId: string;
  brandId: string;
  code: string;
  description?: string;
}) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(
      session.user.role
    )
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const product = await prisma.product.create({
      data: formData,
      include: {
        category: true,
        brand: true,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "CREATE_PRODUCT",
      entity: "Product",
      entityId: product.id,
      details: {
        categoryId: product.categoryId,
        categoryName: product.category.name,
        brandId: product.brandId,
        brandName: product.brand.name,
        code: product.code
      },
    });

    revalidatePath("/dashboard/products");
    return { success: true, product };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Product with this combination already exists" };
    }
    console.error("Create product error:", error);
    return { error: "Failed to create product" };
  }
}

export async function createProductVariant(formData: {
  productId: string;
  color: string;
}) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(
      session.user.role
    )
  ) {
    return { error: "Unauthorized" };
  }

  try {
    const variant = await prisma.productVariant.create({
      data: formData,
    });

    await logHistory({
      userId: session.user.id,
      action: "CREATE_PRODUCT_VARIANT",
      entity: "ProductVariant",
      entityId: variant.id,
      details: { productId: variant.productId, color: variant.color },
    });

    revalidatePath("/dashboard/products");
    return { success: true, variant };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "This color already exists for this product" };
    }
    console.error("Create variant error:", error);
    return { error: "Failed to create variant" };
  }
}

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        brand: true,
        variants: {
          include: {
            _count: {
              select: { stocks: true },
            },
          },
        },
      },
    });

    return { success: true, products };
  } catch (error) {
    console.error("Get products error:", error);
    return { error: "Failed to fetch products" };
  }
}

export async function deleteProduct(id: string) {
  const session = await auth();

  if (
    !session?.user ||
    ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(
      session.user.role
    )
  ) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    await logHistory({
      userId: session.user.id,
      action: "DELETE_PRODUCT",
      entity: "Product",
      entityId: id,
    });

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    console.error("Delete product error:", error);
    return { error: "Failed to delete product" };
  }
}
