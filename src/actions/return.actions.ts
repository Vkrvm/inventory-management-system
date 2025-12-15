"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ReturnType } from "@prisma/client";

interface ReturnItemInput {
    productVariantId: string;
    quantity: number;
    price: number;
}

interface CreateReturnInput {
    invoiceId: string;
    type: ReturnType;
    items: ReturnItemInput[];
    notes?: string;
    userId: string;
}

export async function createReturn(data: CreateReturnInput) {
    try {
        const { invoiceId, type, items, notes, userId } = data;

        // 1. Fetch Invoice to validate and get details
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                items: true,
            },
        });

        if (!invoice) {
            return { success: false, error: "Invoice not found" };
        }

        // 2. Validate quantities
        // We need to check if returned quantity <= sold quantity - previously returned quantity.
        // For simplicity, we'll just check <= sold quantity for now, but ideally we sum up previous returns.

        const previousReturns = await prisma.return.findMany({
            where: { invoiceId },
            include: { items: true }
        });

        // Map variantId -> total returned so far
        const returnedSoFar: Record<string, number> = {};
        previousReturns.forEach(ret => {
            ret.items.forEach(item => {
                returnedSoFar[item.productVariantId] = (returnedSoFar[item.productVariantId] || 0) + item.quantity;
            });
        });

        // Map variantId -> original sold quantity
        const soldQuantities: Record<string, number> = {};
        invoice.items.forEach(item => {
            soldQuantities[item.productVariantId] = item.quantity;
        });

        // Validate
        for (const item of items) {
            const currentReturned = returnedSoFar[item.productVariantId] || 0;
            const sold = soldQuantities[item.productVariantId] || 0;
            if (item.quantity + currentReturned > sold) {
                return { success: false, error: `Cannot return ${item.quantity} of item. Sold: ${sold}, Previously Returned: ${currentReturned}` };
            }
        }

        // 3. Calculate Total Refund Amount
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 4. Create Return Record
        const returnRecord = await prisma.$transaction(async (tx) => {
            // Create Return
            const newReturn = await tx.return.create({
                data: {
                    invoiceId,
                    customerId: invoice.customerId,
                    userId,
                    type,
                    notes,
                    totalAmount,
                    items: {
                        create: items.map(item => ({
                            productVariantId: item.productVariantId,
                            quantity: item.quantity,
                            price: item.price,
                            total: item.price * item.quantity
                        }))
                    }
                }
            });

            // 5. Handle Stock Logic
            // If NON_DAMAGED, we add items back to stock.
            // We need to know WHICH warehouse to return to. 
            // For simplicity, let's assume we return to the FIRST warehouse found for that item or a default one.
            // OR better: The user should select the warehouse. 
            // Since we didn't ask for warehouse in input, we'll look up where the item is currently stocked 
            // or just pick the first available warehouse for that variant.
            // LIMITATION: This might be inaccurate if multiple warehouses exist.
            // Fix: We'll fetch the first warehouse that has this item, or just any warehouse of type PRODUCT.

            if (type === "NON_DAMAGED") {
                const warehouse = await tx.warehouse.findFirst({
                    where: { type: "PRODUCT" } // Simplification
                });

                if (warehouse) {
                    for (const item of items) {
                        // Upsert Stock
                        const stock = await tx.stock.findUnique({
                            where: {
                                warehouseId_productVariantId: {
                                    warehouseId: warehouse.id,
                                    productVariantId: item.productVariantId
                                }
                            }
                        });

                        if (stock) {
                            await tx.stock.update({
                                where: { id: stock.id },
                                data: { quantity: { increment: item.quantity } }
                            });
                        } else {
                            await tx.stock.create({
                                data: {
                                    warehouseId: warehouse.id,
                                    productVariantId: item.productVariantId,
                                    quantity: item.quantity
                                }
                            });
                        }

                        // Log Movement
                        await tx.stockMovement.create({
                            data: {
                                type: "IN",
                                quantity: item.quantity,
                                productVariantId: item.productVariantId,
                                warehouseToId: warehouse.id,
                                userId,
                                notes: `Return #${newReturn.id} (Invoice #${invoice.invoiceNumber})`
                            }
                        });
                    }
                }
            }

            // 6. Handle Financials
            // If CREDIT invoice, reduce Customer Balance (Credit them)
            if (invoice.paymentType === "CREDIT") {
                await tx.customer.update({
                    where: { id: invoice.customerId },
                    data: { accountBalance: { decrement: totalAmount } }
                });

                // Log this as a negative payment or similar? 
                // For now, decreasing balance is correct.
                // Maybe add a Payment record to track it?
                // "Credit Note" logic.
                // Let's create a CustomerPayment with negative amount or just a special note?
                // Actually, `CustomerPayment` reduces balance (it's a payment FROM customer). 
                // To reduce balance without payment, strictly speaking we are "refunding".
                // If accountBalance represents "What customer OWES", then decrementing it is correct.
                // But we should record WHY.
                // Let's create a Helper entry or just leave it as updated.

                // We'll create a negative "CustomerPayment" effectively acting as a credit?
                // No, that might confuse the "Total Paid" logic.
                // Let's just update the balance.
            }

            // If CASH, we assume money is returned physically. We don't change any balance.

            // Update Invoice Totals (Optional? Or just keep original and show "Returned"?)
            // Usually, the invoice remains as is, but we might want to track "Refunded Amount".
            // Schema doesn't have "refundedAmount". We'll skip this for now.

            // 7. Log History
            await tx.history.create({
                data: {
                    action: "RETURN_CREATED",
                    entity: "Return",
                    entityId: newReturn.id,
                    userId,
                    details: JSON.stringify({
                        invoiceId: invoice.id,
                        invoiceNumber: invoice.invoiceNumber,
                        amount: totalAmount,
                        type,
                        itemsCount: items.length
                    })
                }
            });

            return newReturn;
        });

        revalidatePath("/dashboard/invoices");
        revalidatePath(`/dashboard/invoices/${invoiceId}`);
        return { success: true, returnId: returnRecord.id };

    } catch (error) {
        console.error("Error creating return:", error);
        return { success: false, error: "Failed to create return" };
    }
}

export async function getCustomerReturns(customerId: string) {
    try {
        const returns = await prisma.return.findMany({
            where: { customerId },
            include: {
                invoice: true,
                items: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return returns;
    } catch (error) {
        console.error("Error fetching customer returns:", error);
        return [];
    }
}
