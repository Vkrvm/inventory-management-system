"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function reconcileAllCustomers() {
    try {
        // 1. Get all customers with invoices
        const customers = await prisma.customer.findMany({
            include: {
                invoices: {
                    where: {
                        status: { in: ["UNPAID", "PARTIAL"] }
                    },
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        let updatedCount = 0;

        for (const customer of customers) {
            // Calculate what the invoices SAY they owe
            const totalInvoiceDebt = customer.invoices.reduce((sum, inv) => sum + inv.remainingBalance, 0);

            // Calculate what the Customer Balance SAYS they owe
            // (Assuming accountBalance is Debt. If it's negative, they have credit, so Debt is 0)
            const actualDebt = Math.max(0, customer.accountBalance);

            // Diff = Amount paid but not applied to invoices
            let amountToApply = totalInvoiceDebt - actualDebt;

            if (amountToApply > 0.01) { // Tolerance
                // Distribute this "missing payment" to invoices
                for (const inv of customer.invoices) {
                    if (amountToApply <= 0) break;

                    const paymentForThisInvoice = Math.min(amountToApply, inv.remainingBalance);

                    if (paymentForThisInvoice > 0) {
                        // Update invoice
                        const newPaid = inv.paidAmount + paymentForThisInvoice;
                        const newRemaining = inv.remainingBalance - paymentForThisInvoice;
                        const newStatus = newRemaining <= 0.01 ? "PAID" : "PARTIAL";

                        await prisma.invoice.update({
                            where: { id: inv.id },
                            data: {
                                paidAmount: newPaid,
                                remainingBalance: newRemaining,
                                status: newStatus
                            }
                        });

                        // We do NOT create a Payment record here because the money is already gone from the balance.
                        // This is just a data fix.
                        // However, it might be nice to log a system note if possible, but schema doesn't support Invoice notes easily without clutter.
                        // We'll skip logging to keep it clean, as this is a reconciliation.

                        amountToApply -= paymentForThisInvoice;
                        updatedCount++;
                    }
                }
            }
        }

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/invoices");
        revalidatePath("/dashboard/customers");

        return { success: true, updatedCount };
    } catch (error) {
        console.error("Reconciliation error:", error);
        return { success: false, error: "Failed to reconcile data" };
    }
}
