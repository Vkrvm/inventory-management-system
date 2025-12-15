"use client";

import { InvoiceStatus } from "@prisma/client";
import { useTranslation } from "@/hooks/useTranslation";
import { CurrencyAmount } from "@/contexts/UserPreferencesContext";

export default function ReportsClient({ invoices, stocks }: any) {
  const { t } = useTranslation();
  // Calculate revenue statistics
  const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.finalTotal, 0);
  const paidRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0);
  const outstandingBalance = invoices.reduce((sum: number, inv: any) => sum + inv.remainingBalance, 0);

  const paidInvoices = invoices.filter((inv: any) => inv.status === InvoiceStatus.PAID).length;
  const unpaidInvoices = invoices.filter((inv: any) => inv.status === InvoiceStatus.UNPAID).length;
  const partialInvoices = invoices.filter((inv: any) => inv.status === InvoiceStatus.PARTIAL).length;

  // Stock statistics
  const totalStockItems = stocks.length;
  const lowStockItems = stocks.filter((s: any) => s.quantity < 10).length;
  const totalStockValue = stocks.reduce((sum: number, s: any) => sum + s.quantity, 0);

  // Group invoices by month
  const invoicesByMonth = invoices.reduce((acc: any, inv: any) => {
    const month = new Date(inv.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (!acc[month]) {
      acc[month] = { count: 0, total: 0 };
    }
    acc[month].count++;
    acc[month].total += inv.finalTotal;
    return acc;
  }, {});

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">{t("reports.title")}</h1>
      </div>
      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6 className="card-title">{t("reports.totalRevenue")}</h6>
              <h3><CurrencyAmount amount={totalRevenue} /></h3>
              <small>{invoices.length} {t("common.items")}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6 className="card-title">{t("reports.paidAmount")}</h6>
              <h3><CurrencyAmount amount={paidRevenue} /></h3>
              <small>{paidInvoices} {t("reports.paidInvoices")}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h6 className="card-title">{t("reports.outstanding")}</h6>
              <h3><CurrencyAmount amount={outstandingBalance} /></h3>
              <small>{unpaidInvoices + partialInvoices} {t("reports.pending")}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h6 className="card-title">{t("reports.stockItems")}</h6>
              <h3>{totalStockItems}</h3>
              <small>{lowStockItems} {t("reports.lowStock")}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Status Breakdown */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{t("reports.invoiceStatus")}</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <td>
                      <span className="badge bg-success">{t("invoices.status.PAID")}</span>
                    </td>
                    <td>{paidInvoices} {t("common.items")}</td>
                    <td className="text-end">
                      {invoices.length > 0 ? ((paidInvoices / invoices.length) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="badge bg-warning">{t("invoices.status.PARTIAL")}</span>
                    </td>
                    <td>{partialInvoices} {t("common.items")}</td>
                    <td className="text-end">
                      {invoices.length > 0 ? ((partialInvoices / invoices.length) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="badge bg-danger">{t("invoices.status.UNPAID")}</span>
                    </td>
                    <td>{unpaidInvoices} {t("common.items")}</td>
                    <td className="text-end">
                      {invoices.length > 0 ? ((unpaidInvoices / invoices.length) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{t("reports.stockSummary")}</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <td>{t("reports.totalStockItems")}</td>
                    <td className="text-end"><strong>{totalStockItems}</strong></td>
                  </tr>
                  <tr>
                    <td>{t("reports.totalUnits")}</td>
                    <td className="text-end"><strong>{totalStockValue}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-danger">{t("reports.lowStockItems")}</td>
                    <td className="text-end text-danger"><strong>{lowStockItems}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{t("reports.revenueByMonth")}</h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("reports.month")}</th>
                  <th>{t("reports.invoices")}</th>
                  <th>{t("reports.totalRevenue")}</th>
                  <th>{t("reports.average")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(invoicesByMonth).reverse().map(([month, data]: [string, any]) => (
                  <tr key={month}>
                    <td><strong>{month}</strong></td>
                    <td>{data.count}</td>
                    <td><CurrencyAmount amount={data.total} /></td>
                    <td><CurrencyAmount amount={data.total / data.count} /></td>
                  </tr>
                ))}
                {Object.keys(invoicesByMonth).length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      {t("reports.noDataAvailable")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
