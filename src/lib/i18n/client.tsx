"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/data/types";
import type { Dictionary } from "./dictionaries";
import { DEFAULT_LOCALE, getDictionary } from "./dictionaries";

interface I18nValue {
  locale: Locale;
  dict: Dictionary;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  dict: getDictionary(DEFAULT_LOCALE),
});

/**
 * Menyediakan bahasa aktif ke Client Component.
 *
 * Kamus diteruskan dari server sebagai nilai, bukan diimpor ulang di klien —
 * dengan begitu hanya satu bahasa yang ikut ke bundle klien, dan tidak ada
 * kedipan bahasa salah saat hidrasi.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, dict: getDictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** Pintasan untuk membaca sisi bahasa yang benar dari LocalizedText. */
export function useT() {
  const { locale } = useI18n();
  return (text: { id: string; en: string }) => text[locale];
}
