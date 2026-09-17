"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CONTINENT_INFO } from "@/data/continents";
import type { Continent, LocalizedText } from "@/data/types";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";

export interface RailEntry {
  slug: string;
  continent: Continent;
  name: LocalizedText;
  country: LocalizedText;
  period: LocalizedText;
  /**
   * Gambar kecil yang dirender dari geometri modelnya sendiri, kalau ada.
   *
   * Opsional dengan sengaja: daftar ini tetap utuh tanpa satu gambar pun, dan
   * barisnya kembali ke bentuk lamanya. Lihat `scripts/make-thumbs.mjs`.
   */
  thumb?: string;
}

/**
 * Rail koleksi — pilihan benua di atas, daftar object 3D di bawahnya.
 *
 * **Penyaring benua adalah keadaan LOKAL, bukan route.** Menggeser penyaring
 * tidak boleh mengganti object yang sedang diputar: seseorang yang membuka
 * Borobudur harus bisa menelusuri daftar Eropa tanpa kehilangan modelnya.
 * Penyaring yang mengganti isi panggung bukan penyaring; itu navigasi yang
 * menyamar.
 *
 * Penyaring dimulai pada benua warisan yang sedang dibuka, sehingga bingkai
 * pertama sudah memperlihatkan tetangga terdekatnya alih-alih lima belas nama
 * sekaligus.
 *
 * Tiap entri adalah `Link` sungguhan ke route-nya sendiri. Konsekuensinya dua,
 * dan keduanya diinginkan: URL-nya bisa dibagikan dan bisa di-bookmark, DAN
 * perpindahannya tetap tanpa muat ulang halaman karena App Router menanganinya
 * di klien. Kanvas 3D memang di-mount ulang — modelnya berbeda, jadi ia harus.
 */
export function CollectionRail({
  entries,
  activeSlug,
  activeContinent,
  layout = "rail",
}: {
  entries: RailEntry[];
  activeSlug: string;
  activeContinent: Continent;
  /**
   * `rail` — kolom tegak yang bergulir sendiri, untuk sisi kiri workspace.
   * `strip` — baris mendatar yang bergulir ke samping, untuk layar sempit.
   *
   * Di ponsel kolom tegak setinggi 60svh memakan hampir seluruh layar untuk
   * sesuatu yang tugasnya cuma MEMILIH, dan ia duduk di bawah object sehingga
   * harus ditemukan dengan menggulir jauh. Sebagai baris mendatar di puncak
   * halaman, kelima belas pilihan terbaca sekaligus sebagai deretan gambar dan
   * tidak merebut tinggi dari object yang jadi subjeknya.
   */
  layout?: "rail" | "strip";
}) {
  const { locale } = useI18n();
  const [filter, setFilter] = useState<Continent | "all">(activeContinent);

  /* Hanya benua yang benar-benar punya isi. Tab yang menyaring ke nol hasil
     adalah tab yang tidak pernah layak ditekan. */
  const groups = [...new Set(entries.map((e) => e.continent))] as Continent[];
  const shown = filter === "all" ? entries : entries.filter((e) => e.continent === filter);
  const strip = layout === "strip";

  return (
    <div className={cn("flex min-h-0 flex-col", !strip && "h-full")}>
      {/* ── Pilihan benua ─────────────────────────────────────────────
          Di ATAS daftar, dan itu yang diminta: benua adalah cara koleksi ini
          dibagi, jadi ia harus terbaca sebelum isinya — bukan sebagai
          penyaring yang ditemukan belakangan di bawah daftar panjang. */}
      <div className="shrink-0 border-b border-line px-4 py-3">
        <p className="text-[0.6rem] tracking-[0.16em] text-ink-dim uppercase">
          {CONTINENT_LABEL[locale]}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={ALL_LABEL[locale]}
            count={entries.length}
          />
          {groups.map((continent) => (
            <FilterChip
              key={continent}
              active={filter === continent}
              onClick={() => setFilter(continent)}
              label={CONTINENT_INFO[continent].name[locale]}
              count={entries.filter((e) => e.continent === continent).length}
              hue={CONTINENT_INFO[continent].hue}
            />
          ))}
        </div>
      </div>

      {/* ── Daftar object ─────────────────────────────────────────────
          Satu-satunya bagian yang bergulir. Rail-nya sendiri tidak ikut
          bergulir bersama halaman; itu yang membuat workspace ini terbaca
          sebagai alat alih-alih sebagai halaman panjang. */}
      <ul
        className={cn(
          "min-h-0 px-2 py-2",
          strip
            ? /* Bergulir ke SAMPING. `snap-x` membuat tiap pilihan berhenti
                 rapi di tepi kiri alih-alih mendarat setengah terpotong —
                 pada deretan gambar, potongan setengah terbaca sebagai
                 kerusakan. */
              "flex snap-x snap-mandatory gap-2 overflow-x-auto"
            : "flex-1 overflow-y-auto",
        )}
      >
        {shown.map((entry) => {
          const on = entry.slug === activeSlug;
          return (
            <li key={entry.slug} className={strip ? "snap-start" : undefined}>
              <Link
                href={`/heritage/${entry.slug}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "group rounded-lg transition-colors",
                  on ? "bg-raised" : "hover:bg-raised/60",
                  strip
                    ? "flex w-[8.5rem] flex-col gap-2 p-2"
                    : "flex items-start gap-3 px-2.5 py-2.5",
                )}
              >
                {/* Gambar lebih dulu, lalu nama.

                    Lima belas baris teks yang seragam tidak memberi mata satu
                    pun pegangan; siluet memberi. Titik benua tetap ada dan
                    pindah ke pojok gambar — ia informasi yang berbeda (wilayah,
                    bukan bentuk), dan membuangnya memutus warna yang
                    menghubungkan daftar ini dengan penyaring di atasnya. */}
                <span className={cn("relative", strip ? "block" : "mt-0.5 flex-none")}>
                  <span
                    className={cn(
                      "flex items-center justify-center overflow-hidden rounded-lg border transition-colors",
                      on ? "border-line-strong bg-raised" : "border-line bg-raised/50",
                      strip ? "aspect-square w-full" : "h-11 w-11",
                    )}
                  >
                    {entry.thumb ? (
                      <Image
                        src={entry.thumb}
                        alt=""
                        width={strip ? 120 : 44}
                        height={strip ? 120 : 44}
                        className="h-full w-full object-contain"
                      />
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -top-0.5 -left-0.5 h-1.5 w-1.5 rounded-full transition-transform",
                      on && "scale-150",
                    )}
                    style={{ backgroundColor: `oklch(0.48 0.13 ${CONTINENT_INFO[entry.continent].hue})` }}
                  />
                </span>
                <span className={cn("min-w-0", !strip && "flex-1")}>
                  <span
                    className={cn(
                      "block truncate font-display leading-tight transition-colors",
                      strip ? "text-sm" : "text-base",
                      on ? "text-ink" : "text-ink-soft group-hover:text-ink",
                    )}
                  >
                    {entry.name[locale]}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.68rem] text-ink-dim">
                    {/* Periode dibuang pada strip: lebar 8,5rem tidak memuat
                        negara DAN periode tanpa keduanya terpotong, dan negara
                        yang menempatkan situs di peta lebih berguna di sini. */}
                    {strip ? entry.country[locale] : `${entry.country[locale]} · ${entry.period[locale]}`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  hue,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  hue?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-line-strong bg-raised text-ink"
          : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {hue !== undefined ? (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: `oklch(0.48 0.13 ${hue})` }}
        />
      ) : null}
      {label}
      {/* Jumlahnya dibaca dari koleksi, jadi ia informasi — bukan lencana
          yang menghias tombol. */}
      <span className="font-mono text-[0.62rem] tabular-nums text-ink-dim">{count}</span>
    </button>
  );
}

/* Dua label yang tidak punya rumah di kamus bersama karena keduanya hanya
   dipakai di sini. Begitu workspace ini punya section kedua yang memakainya,
   keduanya pindah ke `dictionaries.ts`. */
const CONTINENT_LABEL: LocalizedText = { id: "Benua", en: "Continent" };
const ALL_LABEL: LocalizedText = { id: "Semua", en: "All" };
