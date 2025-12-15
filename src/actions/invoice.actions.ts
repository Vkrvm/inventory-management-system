"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logHistory } from "@/lib/history";
import { generateInvoiceNumber, calculateDiscount } from "@/lib/utils";
import {
  PaymentType,
  DiscountType,
  InvoiceStatus,
  MovementType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createInvoice(formData: {
  customerId: string;
  paymentType: PaymentType;
  discountType?: DiscountType;
  discountValue?: number;
  items: Array<{
    productVariantId: string;
    quantity: number;
    price: number;
  }>;
  warehouseId: string;
  notes?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const { customerId, paymentType, discountType, discountValue, items, warehouseId, notes } =
      formData;

    // Calculate subtotal
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate final total with discount
    const finalTotal = calculateDiscount(subtotal, discountType || null, discountValue || null);

    // Determine initial status and payment handling
    let status: InvoiceStatus;
    let paidAmount: number;
    let remainingBalance: number;

    if (paymentType === PaymentType.CASH) {
      // CASH invoices: marked as PAID immediately
      status = InvoiceStatus.PAID;
      paidAmount = finalTotal;
      remainingBalance = 0;
    } else {
      // CREDIT invoices: don't track payment status in invoice
      // Account balance is managed separately in Customer model
      status = InvoiceStatus.UNPAID; // This is legacy, not used for credit
      paidAmount = 0;
      remainingBalance = finalTotal; // Legacy field, kept for compatibility
    }

    // Create invoice with items and update customer balance in transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          customerId,
          userId: session.user.id,
          paymentType,
          status,
          discountType,
          discountValue,
          subtotal,
          finalTotal,
          paidAmount,
          remainingBalance,
          notes,
          items: {
            create: items.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
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
          },
          customer: true,
        },
      });

      // If CREDIT invoice, increase customer account balance
      if (paymentType === PaymentType.CREDIT) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            accountBalance: {
              increment: finalTotal,
            },
          },
        });
      }

      return newInvoice;
    });

    // Reduce stock for each item
    for (const item of items) {
      const stock = await prisma.stock.findFirst({
        where: {
          warehouseId,
          productVariantId: item.productVariantId,
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for item`);
      }

      await prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: stock.quantity - item.quantity },
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          type: MovementType.OUT,
          quantity: item.quantity,
          warehouseFromId: warehouseId,
          productVariantId: item.productVariantId,
          userId: session.user.id,
          notes: `Invoice: ${invoice.invoiceNumber}`,
        },
      });
    }

    await logHistory({
      userId: session.user.id,
      action: "CREATE_INVOICE",
      entity: "Invoice",
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        customerId,
        total: finalTotal,
      },
    });

    revalidatePath("/dashboard/invoices");
    return { success: true, invoice };
  } catch (error: any) {
    console.error("Create invoice error:", error);
    return { error: error.message || "Failed to create invoice" };
  }
}

export async function addPayment(formData: {
  invoiceId: string;
  amount: number;
  notes?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const { invoiceId, amount, notes } = formData;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return { error: "Invoice not found" };
    }

    if (invoice.paymentType !== PaymentType.CREDIT) {
      return { error: "Cannot add payment to cash invoice" };
    }

    const newPaidAmount = invoice.paidAmount + amount;
    const newRemainingBalance = invoice.finalTotal - newPaidAmount;

    if (newRemainingBalance < 0) {
      return { error: "Payment amount exceeds remaining balance" };
    }

    // Create payment
    await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        notes,
      },
    });

    // Update invoice
    const newStatus =
      newRemainingBalance === 0
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIAL;

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        remainingBalance: newRemainingBalance,
        status: newStatus,
      },
    });

    await logHistory({
      userId: session.user.id,
      action: "ADD_PAYMENT",
      entity: "Payment",
      details: {
        invoiceId,
        amount,
      },
    });

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { success: true };
  } catch (error) {
    console.error("Add payment error:", error);
    return { error: "Failed to add payment" };
  }
}

export async function getInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: {
          include: {
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
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { payments: true },
        },
      },
    });

    return { success: true, invoices };
  } catch (error) {
    console.error("Get invoices error:", error);
    return { error: "Failed to fetch invoices" };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        items: {
          include: {
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
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    return { success: true, invoice };
  } catch (error) {
    console.error("Get invoice error:", error);
    return { error: "Failed to fetch invoice" };
  }
}
