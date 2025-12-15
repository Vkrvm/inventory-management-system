import DashboardLayout from "@/components/DashboardLayout";
import DashboardClient from "./DashboardClient";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { InvoiceStatus } from "@prisma/client";

async function getDashboardStats() {
  const [
    totalProducts,
    totalCustomers,
    totalInvoices,
    unpaidInvoices,
    recentInvoices,
    lowStockItems,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.invoice.count(),
    prisma.invoice.findMany({
      where: {
        status: {
          in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL],
        },
      },
      include: {
        customer: true,
      },
    }),
    prisma.invoice.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
      },
    }),
    prisma.stock.findMany({
      where: {
        quantity: {
          lt: 10,
        },
      },
      include: {
        warehouse: true,
        material: true,
        productVariant: {
          include: {
            product: true,
          },
        },
      },
      take: 10,
    }),
  ]);

  const totalRevenue = await prisma.invoice.aggregate({
    _sum: {
      finalTotal: true,
    },
  });

  const unpaidAmount = unpaidInvoices.reduce(
    (sum, invoice) => sum + invoice.remainingBalance,
    0
  );

  return {
    totalProducts,
    totalCustomers,
    totalInvoices,
    totalRevenue: totalRevenue._sum.finalTotal || 0,
    unpaidAmount,
    unpaidCount: unpaidInvoices.length,
    recentInvoices,
    lowStockItems,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <DashboardLayout>
      <DashboardClient stats={stats} />
    </DashboardLayout>
  );
}
