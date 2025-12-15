"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { CurrencyAmount } from "@/contexts/UserPreferencesContext";
import { InvoiceStatus } from "@prisma/client";

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalInvoices: number;
  totalRevenue: number;
  unpaidAmount: number;
  unpaidCount: number;
  recentInvoices: any[];
  lowStockItems: any[];
}

export default function DashboardClient({ stats }: { stats: DashboardStats }) {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="h3 mb-4">{t("dashboard.title")}</h1>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card stats-card">
            <div className="card-body">
              <h6 className="text-muted mb-2">{t("dashboard.totalProducts")}</h6>
              <h2 className="mb-0">{stats.totalProducts}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stats-card info">
            <div className="card-body">
              <h6 className="text-muted mb-2">{t("dashboard.totalCustomers")}</h6>
              <h2 className="mb-0">{stats.totalCustomers}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stats-card success">
            <div className="card-body">
              <h6 className="text-muted mb-2">{t("dashboard.totalRevenue")}</h6>
              <h2 className="mb-0">
                <CurrencyAmount amount={stats.totalRevenue} />
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stats-card warning">
            <div className="card-body">
              <h6 className="text-muted mb-2">{t("dashboard.unpaidInvoices")}</h6>
              <h2 className="mb-0">
                {stats.unpaidCount}
                <small className="text-muted ms-2" style={{ fontSize: "0.875rem" }}>
                  <CurrencyAmount amount={stats.unpaidAmount} />
                </small>
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">{t("dashboard.recentInvoices")}</h5>
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>{t("invoices.invoiceNumber")}</th>
                      <th>{t("invoices.customer")}</th>
                      <th>{t("invoices.amount")}</th>
                      <th>{t("common.status")}</th>
                      <th>{t("common.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{invoice.customer.name}</td>
                        <td>
                          <CurrencyAmount amount={invoice.finalTotal} />
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              invoice.status === InvoiceStatus.PAID
                                ? "bg-success"
                                : invoice.status === InvoiceStatus.PARTIAL
                                ? "bg-warning"
                                : "bg-danger"
                            }`}
                          >
                            {t(`invoices.status.${invoice.status}`)}
                          </span>
                        </td>
                        <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">{t("dashboard.lowStockAlert")}</h5>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>{t("dashboard.item")}</th>
                      <th>{t("dashboard.warehouse")}</th>
                      <th>{t("dashboard.quantity")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStockItems.map((stock) => (
                      <tr key={stock.id}>
                        <td>
                          {stock.material
                            ? stock.material.name
                            : `${stock.productVariant?.product.type} - ${stock.productVariant?.color}`}
                        </td>
                        <td>{stock.warehouse.name}</td>
                        <td>
                          <span className="badge bg-warning">{stock.quantity}</span>
                        </td>
                      </tr>
                    ))}
                    {stats.lowStockItems.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center text-muted">
                          {t("dashboard.allStockGood")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
