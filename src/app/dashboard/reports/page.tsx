import DashboardLayout from "@/components/DashboardLayout";
import { getInvoices } from "@/actions/invoice.actions";
import { getStockByWarehouse } from "@/actions/stock.actions";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const [invoicesResult, stockResult] = await Promise.all([
    getInvoices(),
    getStockByWarehouse(),
  ]);

  return (
    <DashboardLayout>

      <ReportsClient
        invoices={invoicesResult.invoices || []}
        stocks={stockResult.stocks || []}
      />
    </DashboardLayout>
  );
}
