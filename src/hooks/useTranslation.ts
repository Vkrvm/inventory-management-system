"use client";

import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

type Messages = typeof enMessages;
type MessageKey = keyof Messages;
type NestedMessageKey<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedMessageKey<T[K]> & string}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationKey = NestedMessageKey<Messages>;

const messages: Record<"AR" | "EN", Messages> = {
  AR: arMessages,
  EN: enMessages,
};

export function useTranslation() {
  const { preferences } = useUserPreferences();
  const currentMessages = messages[preferences.language];

  const t = (key: TranslationKey): string => {
    const keys = key.split(".");
    let value: any = currentMessages;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  return { t, language: preferences.language };
}
