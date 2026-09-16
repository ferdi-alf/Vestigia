"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/data/types";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { Flag } from "./flag";

const OPTIONS: { value: Locale; short: string; name: string }[] = [
  { value: "id", short: "ID", name: "Bahasa Indonesia" },
  { value: "en", short: "EN", name: "English" },
];

/**
 * Tombol ganti bahasa.
 *
 * Menulis cookie lewat server action lalu me-refresh, sehingga Server
 * Component ikut merender ulang dengan kamus baru. Tanpa refresh, hanya
 * bagian klien yang berubah dan halaman jadi setengah berbahasa lain.
 *
 * Bendera ditambahkan sebagai penanda, bukan sebagai pengganti label. Kode dua
 * hurufnya tetap ada dan tetap terbaca pembaca layar — bendera adalah simbol
 * negara, sedangkan yang dipilih pengguna di sini adalah bahasa, dan keduanya
 * tidak pernah benar-benar berpadanan satu lawan satu. Menghapus hurufnya akan
 * menukar kejelasan dengan dekorasi.
 */
export function LanguageToggle() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={dict.language.switch}
      className={cn(
        "flex items-center rounded-full border border-line bg-surface p-0.5 transition-opacity",
        pending && "opacity-60",
      )}
    >
      {OPTIONS.map((option) => {
        const active = option.value === locale;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            aria-current={active ? "true" : undefined}
            /* Nama bahasanya lengkap di sini, bukan cuma "ID". Dua huruf saja
               memaksa pengguna pembaca layar menebak. */
            aria-label={option.name}
            title={option.name}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tracking-wide transition-colors",
              active ? "bg-gold text-on-gold" : "text-ink-muted hover:bg-raised hover:text-ink",
            )}
          >
            <Flag
              locale={option.value}
              className={cn(
                "h-3 w-[1.125rem] shrink-0 transition-opacity",
                /* Yang tidak aktif diredam, bukan diabu-abukan. Bendera
                   berskala abu terbaca seperti kontrol yang dinonaktifkan. */
                active ? "opacity-100" : "opacity-70",
              )}
            />
            <span aria-hidden="true">{option.short}</span>
          </button>
        );
      })}
    </div>
  );
}
