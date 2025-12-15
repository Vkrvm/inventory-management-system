"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
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
    const customer = await prisma.customer.create({
      data: formData,
    });

    await logHistory({
      userId: session.user.id,
      action: "CREATE_CUSTOMER",
      entity: "Customer",
      entityId: customer.id,
      details: { name: customer.name },
    });

    revalidatePath("/dashboard/customers");
    return { success: true, customer };
  } catch (error) {
    console.error("Create customer error:", error);
    return { error: "Failed to create customer" };
  }
}

export async function updateCustomer(
  id: string,
  formData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }
) {
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
    const customer = await prisma.customer.update({
      where: { id },
      data: formData,
    });

    await logHistory({
      userId: session.user.id,
      action: "UPDATE_CUSTOMER",
      entity: "Customer",
      entityId: customer.id,
      details: { name: customer.name },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${id}`);
    return { success: true, customer };
  } catch (error) {
    console.error("Update customer error:", error);
    return { error: "Failed to update customer" };
  }
}

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    return { success: true, customers };
  } catch (error) {
    console.error("Get customers error:", error);
    return { error: "Failed to fetch customers" };
  }
}

export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return { error: "Customer not found" };
    }

    return { success: true, customer };
  } catch (error) {
    console.error("Get customer error:", error);
    return { error: "Failed to fetch customer" };
  }
}
