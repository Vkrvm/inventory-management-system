"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Language, Currency } from "@prisma/client";
import { getExchangeRate, convertFromEGP, formatCurrency, CURRENCY_SYMBOLS } from "@/lib/currency";

interface UserPreferences {
  language: Language;
  currency: Currency;
  exchangeRate: number;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  setLanguage: (language: Language) => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
  formatPrice: (amountInEGP: number) => string;
  convertPrice: (amountInEGP: number) => number;
  isRTL: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({
  children,
  initialLanguage,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
  initialCurrency: Currency;
}) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: initialLanguage,
    currency: initialCurrency,
    exchangeRate: 1.0,
  });

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getExchangeRate(preferences.currency);
      setPreferences((prev) => ({ ...prev, exchangeRate: rate }));
    };
    fetchRate();
  }, [preferences.currency]);

  // Update HTML dir and lang attributes
  useEffect(() => {
    const isRTL = preferences.language === "AR";
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = preferences.language.toLowerCase();
  }, [preferences.language]);

  const setLanguage = async (language: Language) => {
    try {
      // Call server action to update user language
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });

      if (response.ok) {
        setPreferences((prev) => ({ ...prev, language }));
        // Reload page to apply new language
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to update language:", error);
    }
  };

  const setCurrency = async (currency: Currency) => {
    try {
      // Call server action to update user currency
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });

      if (response.ok) {
        const rate = await getExchangeRate(currency);
        setPreferences((prev) => ({ ...prev, currency, exchangeRate: rate }));
      }
    } catch (error) {
      console.error("Failed to update currency:", error);
    }
  };

  const formatPrice = (amountInEGP: number): string => {
    const converted = convertFromEGP(amountInEGP, preferences.exchangeRate);
    return formatCurrency(
      converted,
      preferences.currency,
      preferences.language === "AR" ? "ar" : "en"
    );
  };

  const convertPrice = (amountInEGP: number): number => {
    return convertFromEGP(amountInEGP, preferences.exchangeRate);
  };

  const value: UserPreferencesContextType = {
    preferences,
    setLanguage,
    setCurrency,
    formatPrice,
    convertPrice,
    isRTL: preferences.language === "AR",
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
}

// Currency display component
export function CurrencyAmount({ amount }: { amount: number }) {
  const { formatPrice } = useUserPreferences();
  return <span>{formatPrice(amount)}</span>;
}
