import DashboardLayout from "@/components/DashboardLayout";
import { prisma } from "@/lib/db";
import ReturnCreationClient from "./ReturnCreationClient";

export default async function ReturnCreationPage({ params }: { params: { id: string } }) {
    const invoice = await prisma.invoice.findUnique({
        where: { id: params.id },
        include: {
            items: {
                include: {
                    productVariant: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                    brand: true
                                }
                            }
                        }
                    }
                }
            },
            customer: true
        }
    });

    if (!invoice) {
        return (
            <DashboardLayout>
                <div className="alert alert-danger">Invoice not found</div>
            </DashboardLayout>
        );
    }

    // Fetch previous returns to calculate remaining returnable items
    const previousReturns = await prisma.return.findMany({
        where: { invoiceId: invoice.id },
        include: { items: true }
    });

    return (
        <DashboardLayout>
            <ReturnCreationClient invoice={invoice} previousReturns={previousReturns} />
        </DashboardLayout>
    );
}
