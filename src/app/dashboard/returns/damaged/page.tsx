import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/db";
import DamagedReturnsClient from "./DamagedReturnsClient";

export const dynamic = 'force-dynamic';

export default async function DamagedReturnsPage() {
    const returns = await prisma.return.findMany({
        where: { type: 'DAMAGED' },
        include: {
            invoice: true,
            customer: true,
            user: true,
            items: {
                include: {
                    productVariant: {
                        include: {
                            product: {
                                include: {
                                    brand: true,
                                    category: true
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <DashboardLayout>
            <DamagedReturnsClient returns={returns} />
        </DashboardLayout>
    );
}
