"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { formatCurrency } from "@/lib/currency";

interface HistoryDetailsProps {
    action: string;
    details: any;
}

export function HistoryDetails({ action, details }: HistoryDetailsProps) {
    const { t, language } = useTranslation();

    if (!details) return null;

    // Ensure details is an object
    let parsedDetails = details;
    if (typeof details === "string") {
        try {
            parsedDetails = JSON.parse(details);
        } catch (e) {
            // If parsing fails, treat string as a simple message
            parsedDetails = { description: details };
        }
    }

    // Helper to translate or format a label
    const getLabel = (key: string) => {
        // Try to find a translation for the key under 'history.fields'
        const translationKey = `history.fields.${key}` as any;
        const translation = t(translationKey);

        // If translation returns the key itself (common behavior if missing), format it
        if (translation === translationKey || translation === key) {
            return key
                .replace(/([A-Z])/g, " $1") // Add space before capital letters
                .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
                .trim();
        }
        return translation;
    };

    const renderValue = (key: string, value: any) => {
        const locale = language.toLowerCase() === "ar" ? "ar-EG" : "en-US";

        if (key.toLowerCase().includes("id") && typeof value === "string") {
            const nameKey = key.replace("Id", "Name");
            if (parsedDetails[nameKey]) return null; // Skip ID if Name exists
            return value;
        }

        if (key === "price" || key === "total" || key === "amount" || key === "subtotal" || key === "finalTotal" || key === "paidAmount" || key === "remainingBalance" || key === "discountValue") {
            // use existing formatter, pass "ar" or "en"
            return formatCurrency(Number(value), "EGP", language.toLowerCase() as "ar" | "en");
        }

        if (key === "newQuantity" || key === "quantity" || key === "itemCount") {
            return Number(value).toLocaleString(locale);
        }

        if (typeof value === "string") {
            // Only attempt translation for known enum values to avoid "Translation missing" warnings
            const KNOWN_VALUES = [
                "DAMAGED", "NON_DAMAGED", "PAID", "UNPAID", "PARTIAL",
                "CASH", "CREDIT", "AVAILABLE", "SOLD", "DISCARDED",
                "IN", "OUT", "TRANSFER", "ADJUSTMENT"
            ];

            if (KNOWN_VALUES.includes(value)) {
                const valueKey = `history.values.${value}` as any;
                const translation = t(valueKey);
                if (translation !== valueKey && translation !== value && !translation.includes("history.values")) {
                    return translation;
                }
            }
        }

        if (typeof value === "string" && !isNaN(Date.parse(value)) && value.length > 20) {
            return new Date(value).toLocaleDateString(locale);
        }

        return value;
    };

    const entries = Object.entries(parsedDetails).map(([key, value]) => {
        const renderedValue = renderValue(key, value);
        if (renderedValue === null) return null;

        return (
            <div key={key} className="d-flex mb-1">
                <span className="fw-bold me-1">{getLabel(key)}:</span>
                <span>{renderedValue}</span>
            </div>
        );
    });

    if (entries.every(e => e === null)) return null;

    return <div className="text-small" style={{ fontSize: "0.85rem" }}>{entries}</div>;
}
