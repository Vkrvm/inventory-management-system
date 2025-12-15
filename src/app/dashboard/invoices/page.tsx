import DashboardLayout from "@/components/DashboardLayout";
import { getInvoices } from "@/actions/invoice.actions";
import { getCustomers } from "@/actions/customer.actions";
import { getProducts } from "@/actions/product.actions";
import { getWarehouses } from "@/actions/warehouse.actions";
import { getDamagedItems } from "@/actions/damaged-item.actions";
import InvoicesClient from "./InvoicesClient";
import { prisma } from "@/lib/db";

export default async function InvoicesPage() {
  const [invoicesResult, customersResult, productsResult, warehousesResult, damagedItems, currentUser] = await Promise.all([
    getInvoices(),
    getCustomers(),
    getProducts(),
    getWarehouses(),
    getDamagedItems({ status: "AVAILABLE" }),
    prisma.user.findFirst(),
  ]);

  if (!invoicesResult.success) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">Error loading invoices: {invoicesResult.error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <InvoicesClient
        invoices={invoicesResult.invoices || []}
        customers={customersResult.customers || []}
        products={productsResult.products || []}
        warehouses={warehousesResult.warehouses || []}
        damagedItems={damagedItems || []}
        currentUser={currentUser || { id: "unknown" }}
      />
    </DashboardLayout>
  );
}
