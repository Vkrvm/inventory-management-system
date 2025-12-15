"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerCustomerPayment } from "@/actions/customer-payment.actions";
import { processCashRefund } from "@/actions/credit.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";
import { CurrencyAmount } from "@/contexts/UserPreferencesContext";
import { PaymentType } from "@prisma/client";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  accountBalance: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    paymentType: PaymentType;
    finalTotal: number;
    createdAt: Date;
  }>;
}

interface CustomerPayment {
  id: string;
  amount: number;
  notes: string | null;
  paymentDate: Date;
}

export default function CustomerAccountClient({
  customer,
  payments,
  ...props
}: {
  customer: Customer;
  payments: CustomerPayment[];
  returns?: any[];
  creditTransactions?: any[];
  currentUser?: any;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    notes: "",
  });

  const [refundForm, setRefundForm] = useState({
    amount: 0,
    notes: "",
  });

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentForm.amount > customer.accountBalance) {
      setAlert({
        type: "danger",
        message: t("customers.exceedsBalance"),
      });
      return;
    }

    setLoading(true);

    const result = await registerCustomerPayment({
      customerId: customer.id,
      amount: paymentForm.amount,
      notes: paymentForm.notes,
    });

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("customers.paymentRegistered") });
      setShowPaymentModal(false);
      setPaymentForm({ amount: 0, notes: "" });
      router.refresh();
    }

    setLoading(false);
  };

  const handleRegisterRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if refund amount exceeds credit balance (credit is negative balance)
    // e.g. Balance -100. Refund 50. OK.
    // e.g. Balance -100. Refund 150. NO.
    const creditAvailable = Math.abs(customer.accountBalance);

    if (refundForm.amount > creditAvailable) {
      setAlert({
        type: "danger",
        message: t("customers.exceedsCredit"),
      });
      return;
    }

    setLoading(true);

    // In real app, server action gets user. Here we pass a placeholder or get it if we have context.
    const result = await processCashRefund(
      customer.id,
      refundForm.amount,
      props.currentUser?.id || "user-id-placeholder",
      refundForm.notes
    );

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("customers.refundRegistered") });
      setShowRefundModal(false);
      setRefundForm({ amount: 0, notes: "" });
      router.refresh();
    }

    setLoading(false);
  };

  const creditInvoices = customer.invoices.filter(
    (invoice) => invoice.paymentType === PaymentType.CREDIT
  );

  return (
    <>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">{t("customers.accountDetails")}</h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push("/dashboard/customers")}
        >
          {t("common.close")}
        </button>
      </div>

      {/* Customer Info Card */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{t("invoices.customerInformation")}</h5>
              <div className="row">
                <div className="col-md-6">
                  <p className="mb-2">
                    <strong>{t("customers.name")}:</strong> {customer.name}
                  </p>
                  {customer.email && (
                    <p className="mb-2">
                      <strong>{t("customers.email")}:</strong> {customer.email}
                    </p>
                  )}
                </div>
                <div className="col-md-6">
                  {customer.phone && (
                    <p className="mb-2">
                      <strong>{t("customers.phone")}:</strong> {customer.phone}
                    </p>
                  )}
                  {customer.address && (
                    <p className="mb-2">
                      <strong>{t("customers.address")}:</strong> {customer.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Balance Card */}
        <div className="col-md-4">
          <div className="card bg-light">
            <div className="card-body text-center">
              <h5 className="card-title">
                {customer.accountBalance >= 0 ? t("customers.accountBalance") : t("customers.creditBalance")}
              </h5>
              <h2
                className={`mb-3 ${customer.accountBalance > 0 ? "text-danger" : "text-success"}`}
              >
                <CurrencyAmount amount={Math.abs(customer.accountBalance)} />
                {customer.accountBalance < 0 && <span className="ms-2 fs-6 text-muted">({t("customers.credit")})</span>}
              </h2>
              {customer.accountBalance > 0 && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => setShowPaymentModal(true)}
                >
                  {t("customers.registerPayment")}
                </button>
              )}
              {customer.accountBalance < 0 && (
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => setShowRefundModal(true)}
                >
                  {t("customers.refundCash")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Credit Invoices */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{t("customers.creditInvoices")}</h5>
              {creditInvoices.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{t("invoices.invoiceNumber")}</th>
                        <th>{t("common.date")}</th>
                        <th>{t("common.total")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>
                            <code>{invoice.invoiceNumber}</code>
                          </td>
                          <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                          <td>
                            <CurrencyAmount amount={invoice.finalTotal} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">{t("invoices.noInvoices")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{t("customers.payments")}</h5>
              {payments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{t("common.date")}</th>
                        <th>{t("invoices.paymentAmount")}</th>
                        <th>{t("common.notes")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                          <td>
                            <CurrencyAmount amount={payment.amount} />
                          </td>
                          <td>{payment.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">{t("invoices.paymentHistory")}: {t("common.none")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Returns History */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{t("nav.returns")}</h5>
              {/* @ts-ignore */}
              {(props.returns && props.returns.length > 0) ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>{t("common.date")}</th>
                        <th>{t("invoices.invoiceNumber")}</th>
                        <th>{t("common.type")}</th>
                        <th>{t("invoices.amount")}</th>
                        <th>{t("common.items")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* @ts-ignore */}
                      {props.returns.map((ret: any) => (
                        <tr key={ret.id}>
                          <td>{new Date(ret.createdAt).toLocaleDateString()}</td>
                          <td>{ret.invoice.invoiceNumber}</td>
                          <td>
                            <span className={`badge ${ret.type === 'DAMAGED' ? 'bg-danger' : 'bg-primary'}`}>
                              {t(`returns.types.${ret.type}` as any)}
                            </span>
                          </td>
                          <td>
                            <CurrencyAmount amount={ret.totalAmount} />
                          </td>
                          <td>
                            {ret.items.length} {t("common.items")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">{t("common.none")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credit Transactions History */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{t("customers.creditHistory")}</h5>
              {/* @ts-ignore */}
              {(props.creditTransactions && props.creditTransactions.length > 0) ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>{t("common.date")}</th>
                        <th>{t("common.type")}</th>
                        <th>{t("common.amount")}</th>
                        <th>{t("common.notes")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* @ts-ignore */}
                      {props.creditTransactions.map((tx: any) => (
                        <tr key={tx.id}>
                          <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className="badge bg-info">{t(`customers.creditTypes.${tx.type}` as any)}</span>
                          </td>
                          <td>
                            <CurrencyAmount amount={tx.amount} />
                          </td>
                          <td>{tx.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">{t("common.none")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Register Payment Modal */}
      {
        showPaymentModal && (
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {t("customers.registerPayment")} - {customer.name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPaymentModal(false)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleRegisterPayment}>
                  <div className="modal-body">
                    <div className="alert alert-info">
                      <strong>{t("customers.accountBalance")}:</strong>{" "}
                      <CurrencyAmount amount={customer.accountBalance} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="paymentAmount" className="form-label">
                        {t("customers.paymentAmount")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        id="paymentAmount"
                        className="form-control"
                        value={paymentForm.amount}
                        onChange={(e) =>
                          setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })
                        }
                        max={customer.accountBalance}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    {paymentForm.amount > 0 && (
                      <div className="alert alert-success">
                        <strong>{t("customers.remainingAfterPayment")}:</strong>{" "}
                        <CurrencyAmount amount={customer.accountBalance - paymentForm.amount} />
                      </div>
                    )}
                    <div className="mb-3">
                      <label htmlFor="paymentNotes" className="form-label">
                        {t("customers.paymentNotes")}
                      </label>
                      <textarea
                        id="paymentNotes"
                        className="form-control"
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      {t("common.cancel")}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? t("common.processing") : t("customers.registerPayment")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
      {showPaymentModal && <div className="modal-backdrop show" />}

      {/* Refund Cash Modal */}
      {
        showRefundModal && (
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {t("customers.refundCash")} - {customer.name}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowRefundModal(false)}
                    aria-label="Close"
                  />
                </div>
                <form onSubmit={handleRegisterRefund}>
                  <div className="modal-body">
                    <div className="alert alert-success">
                      <strong>{t("customers.availableCredit")}:</strong>{" "}
                      <CurrencyAmount amount={Math.abs(customer.accountBalance)} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="refundAmount" className="form-label">
                        {t("customers.refundAmount")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        id="refundAmount"
                        className="form-control"
                        value={refundForm.amount}
                        onChange={(e) =>
                          setRefundForm({ ...refundForm, amount: parseFloat(e.target.value) || 0 })
                        }
                        max={Math.abs(customer.accountBalance)}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="refundNotes" className="form-label">
                        {t("customers.refundNotes")}
                      </label>
                      <textarea
                        id="refundNotes"
                        className="form-control"
                        value={refundForm.notes}
                        onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowRefundModal(false)}
                    >
                      {t("common.cancel")}
                    </button>
                    <button type="submit" className="btn btn-warning" disabled={loading}>
                      {loading ? t("common.processing") : t("customers.confirmRefund")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }
      {showRefundModal && <div className="modal-backdrop show" />}
    </>
  );
}
