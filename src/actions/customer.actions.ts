"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phones: z.array(z.string()).optional().default([]),
  address: z.string().optional(),
});

export async function createCustomer(formData: {
  name: string;
  email?: string;
  phones?: string[];
  address?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const result = customerSchema.safeParse(formData);

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: result.data.name,
        email: result.data.email || null,
        phones: result.data.phones,
        address: result.data.address || null,
      },
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
    phones?: string[];
    address?: string;
  }
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const result = customerSchema.safeParse(formData);

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: result.data.name,
        email: result.data.email || null,
        phones: result.data.phones,
        address: result.data.address || null,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "UPDATE_CUSTOMER",
      entity: "Customer",
      entityId: id,
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
