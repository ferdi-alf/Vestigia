"use client";

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
}: {
  entries: RailEntry[];
  activeSlug: string;
  activeContinent: Continent;
}) {
  const { locale } = useI18n();
  const [filter, setFilter] = useState<Continent | "all">(activeContinent);

  /* Hanya benua yang benar-benar punya isi. Tab yang menyaring ke nol hasil
     adalah tab yang tidak pernah layak ditekan. */
  const groups = [...new Set(entries.map((e) => e.continent))] as Continent[];
  const shown = filter === "all" ? entries : entries.filter((e) => e.continent === filter);

  return (
    <div className="flex h-full min-h-0 flex-col">
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
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {shown.map((entry) => {
          const on = entry.slug === activeSlug;
          return (
            <li key={entry.slug}>
              <Link
                href={`/heritage/${entry.slug}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "group flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors",
                  on ? "bg-raised" : "hover:bg-raised/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full transition-transform",
                    on && "scale-150",
                  )}
                  style={{ backgroundColor: `oklch(0.48 0.13 ${CONTINENT_INFO[entry.continent].hue})` }}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate font-display text-base leading-tight transition-colors",
                      on ? "text-ink" : "text-ink-soft group-hover:text-ink",
                    )}
                  >
                    {entry.name[locale]}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.68rem] text-ink-dim">
                    {entry.country[locale]} · {entry.period[locale]}
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
