"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DamagedItemStatus } from "@prisma/client";

export async function getDamagedItems(filter?: { status?: DamagedItemStatus }) {
    try {
        const items = await prisma.damagedItem.findMany({
            where: filter ? { status: filter.status } : undefined,
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
                returnItem: {
                    include: {
                        return: {
                            include: {
                                invoice: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });
        return items;
    } catch (error) {
        console.error("Error fetching damaged items:", error);
        return [];
    }
}

export async function updateDamagedItemPrice(id: string, price: number) {
    try {
        const item = await prisma.damagedItem.update({
            where: { id },
            data: { resalePrice: price },
        });
        revalidatePath("/dashboard/returns/damaged");
        return { success: true, item };
    } catch (error) {
        console.error("Error updating damaged item price:", error);
        return { success: false, error: "Failed to update price" };
    }
}
