"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { reconcileAllCustomers } from "@/actions/reconcile.actions";

export default function SettingsClient({ user }: any) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleReconcile = async () => {
        if (!confirm("Are you sure you want to reconcile all customer data? This will mark unpaid invoices as PAID if the customer has a 0 balance.")) return;

        setLoading(true);
        setMessage(null);
        try {
            const result = await reconcileAllCustomers();
            if (result.success) {
                setMessage({ type: "success", text: `Reconciliation complete. Updated ${result.updatedCount} invoices.` });
            } else {
                setMessage({ type: "error", text: result.error || "Failed to reconcile." });
            }
        } catch (err) {
            setMessage({ type: "error", text: "An unexpected error occurred." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <h1 className="h3 mb-4">{t("settings.title")}</h1>

            <div className="row">
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h5 className="mb-0 card-title">System Maintenance</h5>
                        </div>
                        <div className="card-body">
                            <p className="text-muted small">
                                Run this if your "Unpaid Invoices" dashboard card shows a value, but your customers have 0 balance.
                            </p>

                            {message && (
                                <div className={`alert alert-${message.type === "success" ? "success" : "danger"} mb-3`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                onClick={handleReconcile}
                                disabled={loading}
                                className="btn btn-warning"
                            >
                                {loading ? "Fixing Data..." : "Fix Invoice Discrepancies"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
