/**
 * Currency Exchange Utilities
 * Base currency: EGP (Egyptian Pound)
 * Supported currencies: EGP, USD, TRY
 */

export type SupportedCurrency = "EGP" | "USD" | "TRY";

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EGP: "ج.م",
  USD: "$",
  TRY: "₺",
};

export const CURRENCY_NAMES: Record<SupportedCurrency, { en: string; ar: string }> = {
  EGP: { en: "Egyptian Pound", ar: "جنيه مصري" },
  USD: { en: "US Dollar", ar: "دولار أمريكي" },
  TRY: { en: "Turkish Lira", ar: "ليرة تركية" },
};

// Cache for exchange rates (valid for 1 hour)
let exchangeRatesCache: {
  rates: Record<string, number>;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch current exchange rates from API
 * Using exchangerate-api.com (free tier: 1500 requests/month)
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    // Check cache first
    if (
      exchangeRatesCache &&
      Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION
    ) {
      return exchangeRatesCache.rates;
    }

    // Fetch from API with EGP as base currency
    const response = await fetch(
      "https://open.exchangerate-api.com/v6/latest/EGP",
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = await response.json();

    const rates = {
      EGP: 1.0, // Base currency
      USD: data.rates.USD || 0.032, // Fallback approximate rate
      TRY: data.rates.TRY || 0.95, // Fallback approximate rate
    };

    // Update cache
    exchangeRatesCache = {
      rates,
      timestamp: Date.now(),
    };

    return rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);

    // Return fallback rates if API fails
    return {
      EGP: 1.0,
      USD: 0.032, // Approximate: 1 EGP = 0.032 USD
      TRY: 0.95, // Approximate: 1 EGP = 0.95 TRY
    };
  }
}

/**
 * Get exchange rate from EGP to target currency
 */
export async function getExchangeRate(
  targetCurrency: SupportedCurrency
): Promise<number> {
  if (targetCurrency === "EGP") {
    return 1.0;
  }

  const rates = await fetchExchangeRates();
  return rates[targetCurrency] || 1.0;
}

/**
 * Convert amount from EGP to target currency
 */
export function convertFromEGP(
  amountInEGP: number,
  exchangeRate: number
): number {
  return amountInEGP * exchangeRate;
}

/**
 * Convert amount from any currency to EGP
 */
export function convertToEGP(
  amountInCurrency: number,
  exchangeRate: number
): number {
  if (exchangeRate === 0) return 0;
  return amountInCurrency / exchangeRate;
}

/**
 * Format currency with proper symbol and decimals
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  locale: "ar" | "en" = "en"
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = amount.toFixed(2);

  // Arabic uses Arabic-Indic numerals
  if (locale === "ar") {
    const arabicNumerals = formatted.replace(/\d/g, (d) =>
      "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]
    );
    return `${symbol} ${arabicNumerals}`;
  }

  return `${symbol} ${formatted}`;
}

/**
 * Get currency name in specified language
 */
export function getCurrencyName(
  currency: SupportedCurrency,
  language: "ar" | "en"
): string {
  return CURRENCY_NAMES[currency][language];
}
