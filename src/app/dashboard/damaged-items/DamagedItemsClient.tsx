"use client";

import { useState } from "react";
import { updateDamagedItemPrice } from "@/actions/damaged-item.actions";
import { useTranslation } from "@/hooks/useTranslation";
import Alert from "@/components/Alert";

interface DamagedItem {
    id: string;
    productVariant: {
        product: {
            code: string;
            brand: { name: string };
            category: { name: string };
            description: string | null;
        };
        color: string;
    };
    resalePrice: number;
    status: "AVAILABLE" | "SOLD" | "DISCARDED";
    returnItem: {
        return: {
            invoice: {
                invoiceNumber: string;
            }
        }
    };
    createdAt: Date;
}

export default function DamagedItemsClient({ items }: { items: DamagedItem[] }) {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [priceInput, setPriceInput] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

    const startEditing = (item: DamagedItem) => {
        setEditingId(item.id);
        setPriceInput(item.resalePrice);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setPriceInput(0);
    };

    const savePrice = async (id: string) => {
        setLoading(true);
        const result = await updateDamagedItemPrice(id, priceInput);
        if (result.success) {
            setAlert({ type: "success", message: "Price updated successfully" });
            setEditingId(null);
        } else {
            setAlert({ type: "danger", message: result.error || "Failed to update" });
        }
        setLoading(false);
    };

    return (
        <>
            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{t("damagedItems.title")}</h2>
            </div>

            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>{t("common.date")}</th>
                                    <th>{t("products.productCode")}</th>
                                    <th>{t("products.color")}</th>
                                    <th>{t("products.brand")}</th>
                                    <th>{t("invoices.invoiceNumber")}</th>
                                    <th>{t("common.status")}</th>
                                    <th>{t("invoices.price")} ({t("damagedItems.resale")})</th>
                                    <th>{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <tr key={item.id}>
                                            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className="fw-bold">{item.productVariant.product.code}</span>
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary">{item.productVariant.color}</span>
                                            </td>
                                            <td>{item.productVariant.product.brand.name}</td>
                                            <td>{item.returnItem.return.invoice.invoiceNumber}</td>
                                            <td>
                                                <span className={`badge ${item.status === 'AVAILABLE' ? 'bg-success' :
                                                    item.status === 'SOLD' ? 'bg-secondary' : 'bg-danger'
                                                    }`}>
                                                    {t(`status.${item.status}`)}
                                                </span>
                                            </td>
                                            <td>
                                                {editingId === item.id ? (
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={priceInput}
                                                        onChange={(e) => setPriceInput(parseFloat(e.target.value))}
                                                        style={{ width: "100px" }}
                                                    />
                                                ) : (
                                                    <span>{item.resalePrice.toFixed(2)}</span>
                                                )}
                                            </td>
                                            <td>
                                                {item.status === 'AVAILABLE' && (
                                                    <>
                                                        {editingId === item.id ? (
                                                            <div className="btn-group btn-group-sm">
                                                                <button
                                                                    className="btn btn-success"
                                                                    onClick={() => savePrice(item.id)}
                                                                    disabled={loading}
                                                                >
                                                                    <i className="bi bi-check"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary"
                                                                    onClick={cancelEditing}
                                                                    disabled={loading}
                                                                >
                                                                    <i className="bi bi-x"></i>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={() => startEditing(item)}
                                                            >
                                                                {t("common.edit")}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-4 text-muted">
                                            {t("common.noItemsFound")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
