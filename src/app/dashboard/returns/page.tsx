import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/db";
import ReturnsClient from "./ReturnsClient";

export const dynamic = 'force-dynamic';

export default async function ReturnsPage() {
    const returns = await prisma.return.findMany({
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
            <ReturnsClient returns={returns} />
        </DashboardLayout>
    );
}
