import { cookies } from "next/headers";
import type { Locale } from "@/data/types";
import { DEFAULT_LOCALE, LOCALE_COOKIE, getDictionary, isLocale } from "./dictionaries";

/**
 * Bahasa aktif untuk request ini, dibaca dari cookie.
 *
 * Kenapa cookie dan bukan segmen rute `/[locale]/…`: segmen rute
 * menggandakan pohon rute dan membuat setiap tautan internal harus sadar
 * bahasa, demi keuntungan SEO per-bahasa yang tidak relevan di sini. Cookie
 * membuat URL tetap stabil — /heritage/borobudur sama di kedua bahasa.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Bahasa aktif beserta kamusnya. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}
