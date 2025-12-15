"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CreditTransactionType } from "@prisma/client";

export async function getCreditHistory(customerId: string) {
    return await prisma.creditTransaction.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { name: true }
            }
        }
    });
}

export async function processCashRefund(customerId: string, amount: number, userId: string, notes?: string) {
    if (amount <= 0) return { success: false, error: "Amount must be greater than 0" };

    try {
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) return { success: false, error: "Customer not found" };

        // Ensure customer has enough credit (-ive balance)
        // If balance is -100, they have 100 credit. Can refund up to 100.
        // refund amount 50 -> new balance -50.
        // check: -100 + 50 = -50 (OK).
        // check if (currentBalance + amount > 0) -> trying to refund more than credit?
        // Actually, if balance is positive, they owe us. No refund possible?
        // Rule: Can only refund if balance is negative (credit). And cannot refund more than abs(balance).

        if (customer.accountBalance >= 0) {
            return { success: false, error: "Customer has no credit balance to refund." };
        }

        if (customer.accountBalance + amount > 0) {
            return { success: false, error: "Refund amount exceeds available credit." };
        }

        // Transaction
        await prisma.$transaction(async (tx) => {
            // 1. Create Credit Transaction Record
            await tx.creditTransaction.create({
                data: {
                    customerId,
                    userId,
                    amount: amount, // Positive amount reduces the negative balance (moves towards 0)
                    type: "CASH_REFUND",
                    description: notes || "Cash Refund to Customer"
                }
            });

            // 2. Update Customer Balance
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    accountBalance: { increment: amount }
                }
            });

            // 3. Log History
            await tx.history.create({
                data: {
                    userId,
                    action: "CREDIT_REFUND",
                    entity: "Customer",
                    entityId: customerId,
                    details: `Refunded ${amount} from credit balance`
                }
            });
        });

        revalidatePath(`/dashboard/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Refund error:", error);
        return { success: false, error: "Failed to process refund" };
    }
}

export async function payInvoiceWithCredit(invoiceId: string, amount: number, userId: string) {
    if (amount <= 0) return { success: false, error: "Amount must be greater than 0" };

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) return { success: false, error: "Invoice not found" };

        const customer = invoice.customer;

        if (customer.accountBalance >= 0) {
            // Technically if they have positive balance, they owe money, not credit. 
            // But maybe we just want to apply payment? 
            // The requirement is "Consume Customer Credit Balance". 
            // So we strictly check for credit availability.
            return { success: false, error: "Customer has no credit balance to use." };
        }

        if (customer.accountBalance + amount > 0) {
            // Allowing partial use implies we shouldn't exceed abs(balance)
            return { success: false, error: "Insufficient credit balance." };
        }

        if (amount > invoice.remainingBalance) {
            return { success: false, error: "Amount exceeds remaining invoice balance." };
        }

        await prisma.$transaction(async (tx) => {
            // 1. Create Invoice Payment Record (Visualizing the entry)
            // We use the existing Payment for CASH invoices or CustomerPayment for CREDIT flow?
            // If the invoice is CREDIT type, it affects Account Balance.
            // If Invoice is CASH type, it expects 'Payment' records.
            // Requirement said: "Any credit usage must be recorded... Deduct used amount from creditBalance".

            // Scenario: 
            // Customer has -1000 balance (Credit).
            // Buys new Item for 200.
            // If New Invoice is CREDIT: 
            //    - Invoice Created -> Balance becomes -1000 + 200 = -800.
            //    - This happens automatically if we just create a credit invoice.
            //    - BUT, usually Credit Invoices just add to the balance.
            //    - If we want to "Pay with Credit", it implies clearing a specific invoice?
            //    - If I have a CREDIT invoice of 200, and I have -1000 balance.
            //    - My total balance is ALREADY net -800? 
            //    - NO. Old system: Invoices add to balance. Returns subtract.
            //    - So if I have -1000. I buy 200 (Credit). Balance -> -800.
            //    - Result: I owe 200 less credit? No.
            //    - -1000 means Store owes Customer 1000.
            //    - Buy 200. Store gives goods worth 200.
            //    - Store now owes Customer 800.
            //    - This math happens naturally if we just "Create Invoice". 

            // HOWEVER, the request is for specific "Goods Exchange" or "Invoice Applied".
            // Explicitly applying credit to an invoice suggests we might simply create the invoice and mark it paid?
            // for CASH invoices (which don't touch balance automatically):
            //    - Create Cash Invoice 200.
            //    - Pay with Credit 200.
            //    - Customer Balance (-1000) -> (-800).
            //    - Invoice marked PAID.

            // logic below handles the CASH invoice scenario primarily as it's the one needing explicit action.
            // For CREDIT invoices, it's just 'adding a debit transaction'.

            // 1. Log Credit Usage
            await tx.creditTransaction.create({
                data: {
                    customerId: customer.id,
                    userId,
                    amount: amount,
                    type: "INVOICE_PAYMENT",
                    description: `Payment for Invoice #${invoice.invoiceNumber}`,
                    referenceId: invoiceId
                }
            });

            // 2. Reduce Customer Credit (Increment balance)
            await tx.customer.update({
                where: { id: customer.id },
                data: { accountBalance: { increment: amount } }
            });

            // 3. Register Payment on Invoice
            // We'll treat this as a "Payment" of type CASH (or close enough) to mark the invoice as paid.
            // Or add a note.
            await tx.payment.create({
                data: {
                    invoiceId: invoice.id,
                    amount: amount,
                    notes: "Paid using Customer Credit"
                }
            });

            // 4. Update Invoice Status
            const newPaid = invoice.paidAmount + amount;
            const newRemaining = invoice.finalTotal - newPaid;
            let status = invoice.status;
            if (newRemaining <= 0) status = "PAID";
            else if (newPaid > 0) status = "PARTIAL";

            await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    paidAmount: newPaid,
                    remainingBalance: newRemaining,
                    status
                }
            });

            // Log History
            await tx.history.create({
                data: {
                    userId,
                    action: "INVOICE_PAYMENT_CREDIT",
                    entity: "Invoice",
                    entityId: invoiceId,
                    details: `Paid ${amount} using customer credit`
                }
            });

        });

        revalidatePath(`/dashboard/invoices/${invoiceId}`);
        revalidatePath(`/dashboard/customers/${customer.id}`);
        return { success: true };

    } catch (error) {
        console.error("Credit Payment error:", error);
        return { success: false, error: "Failed to process credit payment" };
    }
}
