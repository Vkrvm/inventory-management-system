"use client";

import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

export default function DamagedReturnsClient({ returns }: { returns: any[] }) {
    const { t } = useTranslation();

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="text-danger">{t("returns.damagedTitle")}</h1>
            </div>
            <div className="card">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>{t("returns.date")}</th>
                                    <th>{t("returns.values")}</th>
                                    <th>{t("returns.item")}</th>
                                    <th>{t("products.brand")}</th>
                                    <th>{t("products.category")}</th>
                                    <th>{t("returns.qty")}</th>
                                    <th>{t("returns.invoiceLink")}</th>
                                    <th>{t("returns.notes")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.map((ret) => (
                                    ret.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td>{new Date(ret.createdAt).toLocaleDateString()}</td>
                                            <td>{formatCurrency(item.total, 'EGP')}</td>
                                            <td>
                                                {item.productVariant.product.code} - {item.productVariant.color}
                                            </td>
                                            <td>{item.productVariant.product.brand.name}</td>
                                            <td>{item.productVariant.product.category.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>
                                                <Link href={`/dashboard/invoices/${ret.invoiceId}`}>
                                                    {ret.invoice.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td>{ret.notes || '-'}</td>
                                        </tr>
                                    ))
                                ))}
                                {returns.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center">{t("returns.noDamaged")}</td>
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
