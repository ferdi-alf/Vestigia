"use client";

import Link from "next/link";
import { useRef } from "react";
import { HeritageCard, type HeritageCardData } from "@/components/heritage/heritage-card";
import { useI18n } from "@/lib/i18n/client";
import { useSectionReveal } from "@/lib/motion/use-section-reveal";
import { NameBand } from "./name-band";

/**
 * Strip koleksi.
 *
 * Gulir mendatar dengan snap, dan **gulir aslinya tidak dicegat sama sekali** —
 * tidak ada wheel yang dibajak, tidak ada transformasi palsu. Ia hanya elemen
 * yang meluap, sehingga trackpad, sentuhan, papan ketik, dan Ctrl+F bekerja
 * seperti di halaman mana pun.
 *
 * Arahkan kursor atau fokus ke sebuah kartu dan GLB-nya mulai diunduh, memakai
 * pola yang sama dengan halaman koleksi. Biayanya nol kalau tidak jadi diklik:
 * peramban hanya menyimpan berkas yang memang mungkin dipakai.
 */
export function CollectionStrip({ sites }: { sites: HeritageCardData[] }) {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  useSectionReveal(root, [sites.length]);

  if (sites.length === 0) return null;

  return (
    <section ref={root} className="relative py-24 sm:py-28">
      {/* Pemisah motif, bukan garis. `strata-rule` adalah salah satu dari lima
          motif dunia ini, jadi batas antar section ikut menceritakan sesuatu
          alih-alih sekadar memisahkan. */}
      <span aria-hidden="true" className="strata-rule absolute inset-x-0 top-0 block" />

      {/* Pita nama, hanyut mengikuti gulir. Ia menyebut isi koleksi sebelum
          kartunya muncul, sehingga bagian ini punya pembuka alih-alih langsung
          masuk ke daftar. */}
      <NameBand names={sites.map((site) => site.name[locale])} />

      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p data-reveal className="kicker">
              {dict.landing.collectionKicker}
            </p>
            <h2 data-reveal className="mt-6 font-display text-4xl leading-[1.08] text-ink sm:text-5xl">
              {dict.landing.collectionTitle}
            </h2>
          </div>
          <Link
            data-reveal
            href="#koleksi"
            className="text-sm text-ink-muted underline-offset-4 transition-colors hover:text-gold hover:underline"
          >
            {dict.landing.collectionAll} →
          </Link>
        </div>

        <p data-reveal className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
          {dict.landing.collectionLead}
        </p>
      </div>

      <div
        data-reveal
        tabIndex={0}
        role="region"
        aria-label={dict.landing.collectionTitle}
        className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 focus-visible:outline-2 focus-visible:outline-gold sm:px-6 [scrollbar-width:thin]"
      >
        {sites.map((site) => (
          <div key={site.slug} className="w-[17rem] shrink-0 snap-start sm:w-[19rem]">
            <HeritageCard heritage={site} headingLevel="h3" />
          </div>
        ))}
        {/* Penutup sisi kanan supaya kartu terakhir tidak menempel di tepi layar. */}
        <div aria-hidden="true" className="w-2 shrink-0 sm:w-6" />
      </div>
    </section>
  );
}
