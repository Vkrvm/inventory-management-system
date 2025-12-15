"use client";

import { useState } from "react";
import { PaymentType, DiscountType, InvoiceStatus } from "@prisma/client";
import { createInvoice, addPayment } from "@/actions/invoice.actions";
import { payInvoiceWithCredit } from "@/actions/credit.actions";
import Link from "next/link";
import Alert from "@/components/Alert";
import { CurrencyAmount } from "@/contexts/UserPreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import Select from "react-select";

export default function InvoicesClient({ invoices, customers, products, warehouses, currentUser }: any) {
  const { t } = useTranslation();
  const { formatPrice } = useUserPreferences();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [payWithCredit, setPayWithCredit] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    customerId: "",
    paymentType: PaymentType.CASH,
    discountType: "" as any,
    discountValue: 0,
    warehouseId: "",
    notes: "",
    items: [] as Array<{ productVariantId: string; quantity: number; price: number }>,
  });

  const [currentItem, setCurrentItem] = useState({
    productVariantId: "",
    quantity: 1,
    price: 0,
  });

  const addItemToInvoice = () => {
    if (!currentItem.productVariantId || currentItem.quantity <= 0 || currentItem.price <= 0) {
      setAlert({ type: "danger", message: t("invoices.fillAllItemDetails") });
      return;
    }

    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { ...currentItem }],
    });

    setCurrentItem({ productVariantId: "", quantity: 1, price: 0 });
  };

  const removeItem = (index: number) => {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== index),
    });
  };

  const calculateSubtotal = () => {
    return invoiceForm.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateDiscount = (subtotal: number) => {
    if (!invoiceForm.discountType || !invoiceForm.discountValue) return 0;
    if (invoiceForm.discountType === DiscountType.FIXED) {
      return invoiceForm.discountValue;
    }
    return (subtotal * invoiceForm.discountValue) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    return subtotal - discount;
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (invoiceForm.items.length === 0) {
      setAlert({ type: "danger", message: t("invoices.addAtLeastOneItem") });
      return;
    }

    setLoading(true);

    // Prepare invoice data - only include discount fields if discount is applied
    // Prepare invoice data - only include discount fields if discount is applied
    // If paying with credit balance, forcing invoice type to CREDIT (Debt) first, then we apply the payment.
    const finalPaymentType = payWithCredit ? PaymentType.CREDIT : invoiceForm.paymentType;

    const invoiceData: any = {
      customerId: invoiceForm.customerId,
      paymentType: finalPaymentType,
      warehouseId: invoiceForm.warehouseId,
      notes: invoiceForm.notes,
      items: invoiceForm.items,
    };

    // Only add discount fields if a discount type is selected
    if (invoiceForm.discountType && invoiceForm.discountValue > 0) {
      invoiceData.discountType = invoiceForm.discountType;
      invoiceData.discountValue = invoiceForm.discountValue;
    }

    const result = await createInvoice(invoiceData);

    if (result.error) {
      setAlert({ type: "danger", message: result.error });
    } else {
      let successMessage = `${t("invoices.invoiceCreated")}${result.invoice?.invoiceNumber}`;

      // If Pay With Credit was selected and we have an invoice
      if (payWithCredit && result.invoice) {
        // We know total logic is: (subtotal - discount). 
        // But better to use the result.invoice.finalTotal if available, 
        // or calculate it locally if not returned fully. 
        // createInvoice usually returns the created object. Assuming it has finalTotal.
        const amountToPay = result.invoice.finalTotal || 0;

        // Execute Credit Payment
        const creditResult = await payInvoiceWithCredit(
          result.invoice.id,
          amountToPay,
          currentUser?.id || "unknown_user"
        );

        if (creditResult.error) {
          // Invoice created but credit payment failed.
          setAlert({ type: "warning", message: `${successMessage}. ${t("customers.creditPaymentFailed")}: ${creditResult.error}` });
        } else {
          successMessage += `. ${t("customers.paidWithCredit")}`;
          setAlert({ type: "success", message: successMessage });
        }
      } else {
        setAlert({ type: "success", message: successMessage });
      }

      setShowCreateModal(false);
      setInvoiceForm({
        customerId: "",
        paymentType: PaymentType.CASH,
        discountType: "" as any,
        discountValue: 0,
        warehouseId: "",
        notes: "",
        items: [],
      });
      setPayWithCredit(false);
    }

    setLoading(false);
  };

  const getProductVariants = () => {
    const variants: any[] = [];
    products.forEach((product: any) => {
      product.variants?.forEach((variant: any) => {
        variants.push({
          ...variant,
          product: product,
        });
      });
    });
    return variants;
  };

  const productVariants = getProductVariants();

  // Format product variants for react-select
  const productOptions = productVariants.map((v: any) => ({
    value: v.id,
    label: `${v.product.category.name} | ${v.product.brand.name} ${v.product.code} - ${v.color}`,
    variant: v,
  }));

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return <span className="badge bg-success">{t("invoices.status.PAID")}</span>;
      case InvoiceStatus.PARTIAL:
        return <span className="badge bg-warning">{t("invoices.status.PARTIAL")}</span>;
      case InvoiceStatus.UNPAID:
        return <span className="badge bg-danger">{t("invoices.status.UNPAID")}</span>;
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">{t("invoices.title")}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{t("invoices.title")}</h5>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              {t("invoices.createInvoice")}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t("invoices.invoiceNumber")}</th>
                  <th>{t("invoices.customer")}</th>
                  <th>{t("common.date")}</th>
                  <th>{t("common.type")}</th>
                  <th>{t("common.total")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td>
                      <code>{invoice.invoiceNumber}</code>
                    </td>
                    <td>{invoice.customer.name}</td>
                    <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${invoice.paymentType === "CASH" ? "bg-success" : "bg-info"}`}>
                        {t(`invoices.paymentTypes.${invoice.paymentType}`)}
                      </span>
                    </td>
                    <td><CurrencyAmount amount={invoice.finalTotal} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowViewModal(true);
                        }}
                      >
                        {t("common.view")}
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      {t("invoices.noInvoices")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("invoices.createNewInvoice")}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} aria-label={t("common.close")} />
              </div>
              <form onSubmit={handleCreateInvoice}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">{t("invoices.customer")} *</label>
                      <select
                        className="form-select"
                        value={invoiceForm.customerId}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                        required
                      >
                        <option value="">{t("invoices.selectCustomer")}</option>
                        {customers.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">{t("invoices.warehouse")} *</label>
                      <select
                        className="form-select"
                        value={invoiceForm.warehouseId}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, warehouseId: e.target.value })}
                        required
                      >
                        <option value="">{t("invoices.selectWarehouse")}</option>
                        {warehouses.filter((w: any) => w.type === "PRODUCT").map((w: any) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">{t("invoices.paymentType")}</label>
                      <select
                        className="form-select"
                        value={invoiceForm.paymentType}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentType: e.target.value as PaymentType })}
                      >
                        <option value={PaymentType.CASH}>{t("invoices.paymentTypes.CASH")}</option>
                        <option value={PaymentType.CREDIT}>{t("invoices.paymentTypes.CREDIT")}</option>
                      </select>
                    </div>

                    {/* Add Pay with Credit Checkbox */}
                    {invoiceForm.customerId && (() => {
                      const customer = customers.find((c: any) => c.id === invoiceForm.customerId);
                      // Credit balance is negative. e.g. -500.
                      // We can pay if we have credit (balance < 0).
                      const hasCredit = customer && customer.accountBalance < 0;
                      if (!hasCredit) return null;

                      const availableCredit = Math.abs(customer.accountBalance);
                      const estimatedTotal = calculateTotal();
                      const canCover = availableCredit >= estimatedTotal;

                      return (
                        <div className="col-md-12 mb-3">
                          <div className={`alert ${canCover ? 'alert-info' : 'alert-warning'} d-flex align-items-center`}>
                            <div className="form-check flex-grow-1">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="useCredit"
                                checked={payWithCredit}
                                onChange={(e) => setPayWithCredit(e.target.checked)}
                                disabled={!canCover && estimatedTotal > 0}
                              />
                              <label className="form-check-label" htmlFor="useCredit">
                                {t("invoices.payWithCredit")} ({t("customers.availableCredit")}: <CurrencyAmount amount={availableCredit} />)
                              </label>
                            </div>
                            {!canCover && estimatedTotal > 0 && <small className="ms-2">{t("customers.insufficientCredit")}</small>}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="col-md-4 mb-3">
                      <label className="form-label">{t("common.discount")} {t("common.type")}</label>
                      <select
                        className="form-select"
                        value={invoiceForm.discountType}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discountType: e.target.value as any })}
                      >
                        <option value="">{t("invoices.noDiscount")}</option>
                        <option value={DiscountType.FIXED}>{t("invoices.discountType.FIXED")}</option>
                        <option value={DiscountType.PERCENTAGE}>{t("invoices.discountType.PERCENTAGE")}</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">{t("invoices.discountValue")}</label>
                      <input
                        type="number"
                        className="form-control"
                        value={invoiceForm.discountValue}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discountValue: parseFloat(e.target.value) || 0 })}
                        disabled={!invoiceForm.discountType}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <hr />
                  <h6>{t("invoices.addItems")}</h6>
                  <div className="row">
                    <div className="col-md-5 mb-3">
                      <label className="form-label">{t("invoices.product")}</label>
                      <Select
                        options={productOptions}
                        value={productOptions.find((opt: any) => opt.value === currentItem.productVariantId) || null}
                        onChange={(option: any) => setCurrentItem({ ...currentItem, productVariantId: option?.value || "" })}
                        placeholder={t("invoices.selectProduct")}
                        isClearable
                        isSearchable
                        className="react-select-container"
                        classNamePrefix="react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: '38px',
                          }),
                        }}
                      />
                      {currentItem.productVariantId && (
                        <small className="text-muted">
                          {t("invoices.category")}: {productOptions.find((opt: any) => opt.value === currentItem.productVariantId)?.variant?.product?.category?.name}
                        </small>
                      )}
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">{t("invoices.quantity")}</label>
                      <input
                        type="number"
                        className="form-control"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                        min="1"
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">{t("invoices.price")}</label>
                      <input
                        type="number"
                        className="form-control"
                        value={currentItem.price}
                        onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-md-1 mb-3">
                      <label className="form-label">&nbsp;</label>
                      <button type="button" className="btn btn-success w-100" onClick={addItemToInvoice}>
                        +
                      </button>
                    </div>
                  </div>

                  {invoiceForm.items.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>{t("invoices.product")}</th>
                            <th>{t("invoices.qty")}</th>
                            <th>{t("invoices.price")}</th>
                            <th>{t("common.total")}</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceForm.items.map((item, index) => {
                            const variant = productVariants.find((v: any) => v.id === item.productVariantId);
                            return (
                              <tr key={index}>
                                <td>
                                  <strong>{variant?.product.category.name}</strong><br />
                                  <small>{variant?.product.brand.name} {variant?.product.code} - {variant?.color}</small>
                                </td>
                                <td>{item.quantity}</td>
                                <td>{formatPrice(item.price)}</td>
                                <td>{formatPrice(item.quantity * item.price)}</td>
                                <td>
                                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeItem(index)}>
                                    ×
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="text-end">
                              <strong>{t("common.subtotal")}:</strong>
                            </td>
                            <td colSpan={2}>
                              <strong>{formatPrice(calculateSubtotal())}</strong>
                            </td>
                          </tr>
                          {invoiceForm.discountType && (
                            <tr>
                              <td colSpan={3} className="text-end">
                                {t("common.discount")} ({invoiceForm.discountType === DiscountType.PERCENTAGE ? `${invoiceForm.discountValue}%` : t("invoices.discountType.FIXED")}):
                              </td>
                              <td colSpan={2}>-{formatPrice(calculateDiscount(calculateSubtotal()))}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan={3} className="text-end">
                              <strong>{t("common.total")}:</strong>
                            </td>
                            <td colSpan={2}>
                              <strong>{formatPrice(calculateTotal())}</strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">{t("common.notes")}</label>
                    <textarea
                      className="form-control"
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    {t("common.cancel")}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? t("invoices.creating") : t("invoices.createInvoice")}
                  </button>
                </div>
              </form>
            </div>
          </div >
        </div >
      )
      }

      {/* View Invoice Modal */}
      {
        showViewModal && selectedInvoice && (
          <div className="modal show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t("invoices.invoiceNumber")}{selectedInvoice.invoiceNumber}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowViewModal(false)} aria-label={t("common.close")} />
                </div>
                <div className="modal-body" id="invoice-print-area">
                  {/* Invoice Header */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h4 className="mb-3">{t("invoices.invoiceDetails")}</h4>
                      <p className="mb-1">
                        <strong>{t("invoices.invoiceNumber")}:</strong> {selectedInvoice.invoiceNumber}
                      </p>
                      <p className="mb-1">
                        <strong>{t("common.date")}:</strong> {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mb-1">
                        <strong>{t("invoices.paymentType")}:</strong>{" "}
                        <span className={`badge ${selectedInvoice.paymentType === "CASH" ? "bg-success" : "bg-info"}`}>
                          {t(`invoices.paymentTypes.${selectedInvoice.paymentType}`)}
                        </span>
                      </p>
                      <p className="mb-1">
                        <strong>{t("common.status")}:</strong> {getStatusBadge(selectedInvoice.status)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h4 className="mb-3">{t("invoices.customerInformation")}</h4>
                      <p className="mb-1">
                        <strong>{t("invoices.name")}:</strong> {selectedInvoice.customer.name}
                      </p>
                      {selectedInvoice.customer.email && (
                        <p className="mb-1">
                          <strong>{t("invoices.email")}:</strong> {selectedInvoice.customer.email}
                        </p>
                      )}
                      {selectedInvoice.customer.phone && (
                        <p className="mb-1">
                          <strong>{t("invoices.phone")}:</strong> {selectedInvoice.customer.phone}
                        </p>
                      )}
                      {selectedInvoice.customer.address && (
                        <p className="mb-1">
                          <strong>{t("invoices.address")}:</strong> {selectedInvoice.customer.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>{t("invoices.product")}</th>
                          <th>{t("invoices.quantity")}</th>
                          <th>{t("invoices.price")}</th>
                          <th>{t("common.total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item: any, index: number) => (
                          <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{item.productVariant.product.category.name}</strong><br />
                              <small>{item.productVariant.product.brand.name} {item.productVariant.product.code} - {item.productVariant.color}</small>
                            </td>
                            <td>{item.quantity}</td>
                            <td><CurrencyAmount amount={item.price} /></td>
                            <td><CurrencyAmount amount={item.total} /></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} className="text-end">
                            <strong>{t("common.subtotal")}:</strong>
                          </td>
                          <td>
                            <strong><CurrencyAmount amount={selectedInvoice.subtotal} /></strong>
                          </td>
                        </tr>
                        {selectedInvoice.discountAmount > 0 && (
                          <tr>
                            <td colSpan={4} className="text-end">
                              {t("common.discount")}:
                            </td>
                            <td>-<CurrencyAmount amount={selectedInvoice.discountAmount} /></td>
                          </tr>
                        )}
                        <tr className="table-active">
                          <td colSpan={4} className="text-end">
                            <strong>{t("invoices.finalTotal")}:</strong>
                          </td>
                          <td>
                            <strong><CurrencyAmount amount={selectedInvoice.finalTotal} /></strong>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <div className="mb-3">
                      <strong>{t("common.notes")}:</strong>
                      <p className="mb-0">{selectedInvoice.notes}</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer no-print">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                    {t("common.close")}
                  </button>
                  <Link href={`/dashboard/invoices/${selectedInvoice.id}/return`} className="btn btn-warning">
                    {t("invoices.createReturn")}
                  </Link>
                  <button type="button" className="btn btn-primary" onClick={handlePrintInvoice}>
                    {t("invoices.printInvoice")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {(showCreateModal || showViewModal) && <div className="modal-backdrop show" />}
    </>
  );
}
