"use client";

import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export default function ReturnsClient({ returns }: { returns: any[] }) {
    const { t } = useTranslation();

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>{t("returns.title")}</h1>
            </div>
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>{t("returns.date")}</th>
                                    <th>{t("returns.returnNumber")}</th>
                                    <th>{t("returns.invoiceNumber")}</th>
                                    <th>{t("returns.customer")}</th>
                                    <th>{t("returns.type")}</th>
                                    <th>{t("returns.amount")}</th>
                                    <th>{t("common.items")}</th>
                                    <th>{t("returns.status")}</th>
                                    <th>{t("returns.actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.map((ret) => (
                                    <tr key={ret.id}>
                                        <td>{new Date(ret.createdAt).toLocaleDateString()}</td>
                                        <td>{ret.id.substring(0, 8).toUpperCase()}</td>
                                        <td>
                                            <Link href={`/dashboard/invoices/${ret.invoiceId}`}>
                                                {ret.invoice.invoiceNumber}
                                            </Link>
                                        </td>
                                        <td>{ret.customer.name}</td>
                                        <td>
                                            <span className={`badge ${ret.type === 'DAMAGED' ? 'bg-danger' : 'bg-primary'}`}>
                                                {t(`returns.types.${ret.type}` as any)}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(ret.totalAmount, 'EGP')}</td>
                                        <td>
                                            <ul className="list-unstyled mb-0">
                                                {ret.items.map((item: any) => (
                                                    <li key={item.id} className="mb-1">
                                                        <div>
                                                            <strong>{item.productVariant.product.code}</strong>
                                                            <span className="text-muted mx-1">-</span>
                                                            {item.productVariant.color}
                                                            <span className="badge bg-light text-dark ms-2">{item.quantity}</span>
                                                        </div>
                                                        <div className="text-muted small">
                                                            {item.productVariant.product.brand.name} | {item.productVariant.product.category.name}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary">{ret.status}</span>
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-secondary">{t("returns.view")}</button>
                                        </td>
                                    </tr>
                                ))}
                                {returns.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center">{t("returns.noReturns")}</td>
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
