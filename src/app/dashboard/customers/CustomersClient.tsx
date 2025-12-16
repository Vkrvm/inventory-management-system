"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, updateCustomer } from "@/actions/customer.actions";
import { registerCustomerPayment } from "@/actions/customer-payment.actions";
import Alert from "@/components/Alert";
import { useTranslation } from "@/hooks/useTranslation";
import { CurrencyAmount } from "@/contexts/UserPreferencesContext";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phones: string[];
  address: string | null;
  accountBalance: number;
  createdAt: Date;
  _count?: {
    invoices: number;
  };
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phones: [""] as string[],
    address: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    notes: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanedData = {
      ...formData,
      phones: formData.phones.filter(p => p.trim() !== "")
    };

    const result = await createCustomer(cleanedData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("customers.customerCreated") });
      setShowCreateModal(false);
      setFormData({ name: "", email: "", phones: [""], address: "" });
    }

    setLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setLoading(true);

    const cleanedData = {
      ...formData,
      phones: formData.phones.filter(p => p.trim() !== "")
    };

    const result = await updateCustomer(selectedCustomer.id, cleanedData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("customers.customerUpdated") });
      setShowEditModal(false);
      setSelectedCustomer(null);
      setFormData({ name: "", email: "", phones: [""], address: "" });
    }

    setLoading(false);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phones: customer.phones && customer.phones.length > 0 ? customer.phones : [""],
      address: customer.address || "",
    });
    setShowEditModal(true);
  };

  const openPaymentModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentForm({
      amount: 0,
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    if (paymentForm.amount > selectedCustomer.accountBalance) {
      setAlert({
        type: "danger",
        message: t("customers.exceedsBalance")
      });
      return;
    }

    setLoading(true);

    const result = await registerCustomerPayment({
      customerId: selectedCustomer.id,
      amount: paymentForm.amount,
      notes: paymentForm.notes,
    });

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      setAlert({ type: "success", message: t("customers.paymentRegistered") });
      setShowPaymentModal(false);
      setPaymentForm({ amount: 0, notes: "" });
      setSelectedCustomer(null);
    }

    setLoading(false);
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.phones];
    newPhones[index] = value;
    setFormData({ ...formData, phones: newPhones });
  };

  const addPhoneField = () => {
    setFormData({ ...formData, phones: [...formData.phones, ""] });
  };

  const removePhoneField = (index: number) => {
    if (formData.phones.length === 1) return; // Keep at least one
    const newPhones = formData.phones.filter((_, i) => i !== index);
    setFormData({ ...formData, phones: newPhones });
  };

  const renderPhoneInputs = (idPrefix: string) => (
    <div className="mb-3">
      <label className="form-label">
        {t("customers.phone")}
      </label>
      {formData.phones.map((phone, index) => (
        <div key={index} className="input-group mb-2">
          <input
            type="tel"
            id={`${idPrefix}-phone-${index}`}
            className="form-control"
            value={phone}
            onChange={(e) => handlePhoneChange(index, e.target.value)}
            placeholder={t("customers.phone")}
          />
          {index === formData.phones.length - 1 && (
            <button type="button" className="btn btn-outline-secondary" onClick={addPhoneField}>
              <i className="bi bi-plus">+</i>
            </button>
          )}
          {formData.phones.length > 1 && (
            <button type="button" className="btn btn-outline-danger" onClick={() => removePhoneField(index)}>
              <i className="bi bi-dash">-</i>
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">{t("customers.title")}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("customers.title")}</h5>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              {t("customers.addNewCustomer")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("customers.name")}</th>
                  <th>{t("customers.email")}</th>
                  <th>{t("customers.phone")}</th>
                  <th>{t("customers.accountBalance")}</th>
                  <th>{t("customers.invoices")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                    </td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.phones && customer.phones.length > 0 ? customer.phones.join(", ") : "-"}</td>
                    <td>
                      <strong className={customer.accountBalance > 0 ? "text-danger" : "text-success"}>
                        <CurrencyAmount amount={customer.accountBalance} />
                      </strong>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {customer._count?.invoices || 0} {t("customers.invoices").toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-info"
                          onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                          disabled={loading}
                        >
                          {t("customers.viewAccount")}
                        </button>
                        {customer.accountBalance > 0 && (
                          <button
                            className="btn btn-outline-success"
                            onClick={() => openPaymentModal(customer)}
                            disabled={loading}
                          >
                            {t("customers.registerPayment")}
                          </button>
                        )}
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => openEditModal(customer)}
                          disabled={loading}
                        >
                          {t("common.edit")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">
                      {t("customers.noCustomers")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("customers.addNewCustomer")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="customerName" className="form-label">
                      {t("customers.name")} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="customerEmail" className="form-label">
                      {t("customers.email")}
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  {renderPhoneInputs("create")}

                  <div className="mb-3">
                    <label htmlFor="customerAddress" className="form-label">
                      {t("customers.address")}
                    </label>
                    <textarea
                      id="customerAddress"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    {t("common.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t("common.creating") : t("customers.createCustomer")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && <div className="modal-backdrop show" />}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("customers.editCustomer")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleEdit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="editCustomerName" className="form-label">
                      {t("customers.name")} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="editCustomerName"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editCustomerEmail" className="form-label">
                      {t("customers.email")}
                    </label>
                    <input
                      type="email"
                      id="editCustomerEmail"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  {renderPhoneInputs("edit")}

                  <div className="mb-3">
                    <label htmlFor="editCustomerAddress" className="form-label">
                      {t("customers.address")}
                    </label>
                    <textarea
                      id="editCustomerAddress"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    {t("common.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t("common.updating") : t("customers.updateCustomer")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showEditModal && <div className="modal-backdrop show" />}

      {/* Register Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t("customers.registerPayment")} - {selectedCustomer.name}
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
                    <CurrencyAmount amount={selectedCustomer.accountBalance} />
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
                      max={selectedCustomer.accountBalance}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  {paymentForm.amount > 0 && (
                    <div className="alert alert-success">
                      <strong>{t("customers.remainingAfterPayment")}:</strong>{" "}
                      <CurrencyAmount amount={selectedCustomer.accountBalance - paymentForm.amount} />
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
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, notes: e.target.value })
                      }
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
      )}
      {showPaymentModal && <div className="modal-backdrop show" />}
    </>
  );
}
