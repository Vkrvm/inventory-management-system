"use client";

import { useState } from "react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import type { Language, Currency } from "@prisma/client";

export default function PreferencesSwitcher() {
  const { preferences, setLanguage, setCurrency } = useUserPreferences();
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    await setLanguage(e.target.value as Language);
    setLoading(false);
  };

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    await setCurrency(e.target.value as Currency);
    setLoading(false);
  };

  return (
    <div className="d-flex gap-2 align-items-center">
      {/* Language Switcher */}
      <select
        className="form-select form-select-sm"
        style={{ width: "auto", minWidth: "100px" }}
        value={preferences.language}
        onChange={handleLanguageChange}
        disabled={loading}
      >
        <option value="AR">العربية</option>
        <option value="EN">English</option>
      </select>

      {/* Currency Switcher */}
      <select
        className="form-select form-select-sm"
        style={{ width: "auto", minWidth: "100px" }}
        value={preferences.currency}
        onChange={handleCurrencyChange}
        disabled={loading}
      >
        <option value="EGP">EGP (ج.م)</option>
        <option value="USD">USD ($)</option>
        <option value="TRY">TRY (₺)</option>
      </select>

      {loading && (
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
    </div>
  );
}
