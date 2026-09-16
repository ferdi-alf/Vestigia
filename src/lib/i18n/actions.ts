"use server";

import { cookies } from "next/headers";
import type { Locale } from "@/data/types";
import { LOCALE_COOKIE, isLocale } from "./dictionaries";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Simpan pilihan bahasa. Dipanggil dari tombol ganti bahasa; komponen
 * pemanggil yang memicu refresh supaya Server Component merender ulang
 * dengan kamus yang baru.
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
}
