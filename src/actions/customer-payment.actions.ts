"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { logHistory } from "@/lib/history";

export async function registerCustomerPayment(data: {
  customerId: string;
  amount: number;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Validate amount
    if (data.amount <= 0) {
      return { error: "Payment amount must be greater than 0" };
    }

    // Get customer with current balance
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: { id: true, name: true, accountBalance: true },
    });

    if (!customer) {
      return { error: "Customer not found" };
    }

    // Check if payment would make balance negative
    if (customer.accountBalance - data.amount < 0) {
      return {
        error: `Payment amount (${data.amount}) exceeds customer account balance (${customer.accountBalance})`,
      };
    }

    // Create payment and update customer balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.customerPayment.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          notes: data.notes,
          paymentDate: new Date(),
        },
      });

      // Update customer account balance
      const updatedCustomer = await tx.customer.update({
        where: { id: data.customerId },
        data: {
          accountBalance: {
            decrement: data.amount,
          },
        },
      });

      return { payment, updatedCustomer };
    });

    // Log the payment
    await logHistory({
      userId: session.user.id,
      action: "REGISTER_PAYMENT",
      entity: "CustomerPayment",
      entityId: result.payment.id,
      details: {
        customerId: customer.id,
        customerName: customer.name,
        amount: data.amount,
        previousBalance: customer.accountBalance,
        newBalance: result.updatedCustomer.accountBalance,
        notes: data.notes,
      },
    });

    revalidatePath("/dashboard/customers");
    return { success: true, payment: result.payment };
  } catch (error) {
    console.error("Register payment error:", error);
    return { error: "Failed to register payment" };
  }
}

export async function getCustomerPayments(customerId: string) {
  try {
    const payments = await prisma.customerPayment.findMany({
      where: { customerId },
      orderBy: { paymentDate: "desc" },
    });

    return { success: true, data: payments };
  } catch (error) {
    console.error("Get payments error:", error);
    return { error: "Failed to fetch payments" };
  }
}

export async function deleteCustomerPayment(paymentId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Only SUPER_ADMIN can delete payments
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return { error: "Only Super Admin can delete payments" };
    }

    // Get payment details before deletion
    const payment = await prisma.customerPayment.findUnique({
      where: { id: paymentId },
      include: { customer: true },
    });

    if (!payment) {
      return { error: "Payment not found" };
    }

    // Delete payment and restore balance in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete payment
      await tx.customerPayment.delete({
        where: { id: paymentId },
      });

      // Restore balance to customer account
      await tx.customer.update({
        where: { id: payment.customerId },
        data: {
          accountBalance: {
            increment: payment.amount,
          },
        },
      });
    });

    // Log the deletion
    await logHistory({
      userId: session.user.id,
      action: "DELETE_PAYMENT",
      entity: "CustomerPayment",
      entityId: paymentId,
      details: {
        customerId: payment.customerId,
        customerName: payment.customer.name,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
      },
    });

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    console.error("Delete payment error:", error);
    return { error: "Failed to delete payment" };
  }
}
