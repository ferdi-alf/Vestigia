"use client";

import { useMemo, useRef, useState } from "react";
import type { Continent } from "@/data/types";
import type { MapPoint } from "@/components/landing/types";
import { CONTINENT_INFO, CONTINENT_ORDER } from "@/data/continents";
import { useI18n } from "@/lib/i18n/client";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { cn } from "@/lib/cn";
import { A_COPY } from "./copy";

/**
 * Dunia — lima benua, lima belas yang bertahan.
 *
 * Section ini menggantikan EMPAT section sekaligus: Penjelajah (peta datar),
 * Pemandu Budaya, Pintu Masuk (lima kartu benua), dan Penutup. Yang dulu butuh
 * empat babak — melihat peta, bertanya, memilih pintu, lalu diajak masuk — di
 * sini jadi satu benda yang bisa diputar dan diklik.
 *
 * ---
 *
 * **ANIMASI SCROLL BERHENTI SEBELUM SINI.** Permintaan eksplisit pemilik
 * project: gulir yang men-scrub berakhir di "Yang Hilang". Section ini dan
 * seterusnya memakai animasi MASUK sekali saat menyentuh viewport — pola yang
 * sama dengan `relic.tsx`, supaya keduanya terbaca sebagai satu bahasa alih-alih
 * dua sistem gerak yang kebetulan bertetangga.
 *
 * Daftar benuanya `<button>` sungguhan di dalam `<ul>`: bisa ditempuh papan
 * ketik, punya `aria-pressed`, dan jumlah situsnya DIHITUNG dari registry —
 * bukan angka yang ditulis tangan lalu basi saat koleksi bertambah.
 */
export function World({ points }: { points: MapPoint[] }) {
  const { locale } = useI18n();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<Continent | null>(null);

  /* Dihitung dari koleksi, sekali. Menambah satu GLB mengubah angka ini tanpa
     menyentuh satu baris pun di sini — aturan §2, menambah isi tidak boleh
     mengubah arsitektur. */
  const counts = useMemo(() => {
    const out = {} as Record<Continent, number>;
    for (const key of CONTINENT_ORDER) out[key] = 0;
    for (const p of points) out[p.continent] += 1;
    return out;
  }, [points]);

  useScrollScene(
    ({ still }, node) => {
      /* Gerak dikurangi: tidak satu pun ScrollTrigger dipasang. Seluruh isinya
         sudah terlihat tanpa JavaScript — yang dilepas hanya urutan masuknya. */
      if (still) return;

      gsap
        .timeline({
          defaults: { ease: EASE.enter },
          scrollTrigger: { trigger: node, start: "top 74%", once: true },
        })
        .from("[data-reveal]", { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.08 }, 0)
        .from("[data-world-row]", { autoAlpha: 0, x: -18, duration: 0.55, stagger: 0.07 }, 0.2)
        .from("[data-world-stage]", { autoAlpha: 0, scale: 0.94, duration: 1.0 }, 0.25);
    },
    root,
    [],
  );

  return (
    <section
      ref={root}
      id="dunia"
      aria-labelledby="a-world-title"
      className="relative py-24 sm:py-32"
    >
      <div className="shell grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        {/* ══ Kiri — judul dan lima pintu ═══════════════════════════ */}
        <div className="lg:col-span-4">
          <span data-reveal aria-hidden="true" className="carved-edge" />
          <p data-reveal className="kicker mt-4">
            {A_COPY.worldKicker[locale]}
          </p>
          <h2
            data-reveal
            id="a-world-title"
            className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-5xl"
          >
            {A_COPY.worldTitle[locale]}
          </h2>
          <p data-reveal className="mt-5 text-sm leading-[1.75] text-ink-muted">
            {A_COPY.worldLead[locale]}
          </p>

          <ul className="mt-8 flex flex-col gap-1">
            {CONTINENT_ORDER.map((key) => {
              const info = CONTINENT_INFO[key];
              const selected = active === key;
              return (
                <li key={key} data-world-row>
                  <button
                    type="button"
                    aria-pressed={selected}
                    /* Memilih ulang benua yang sama melepasnya kembali ke
                       putaran bebas. Tanpa ini satu-satunya jalan keluar dari
                       sebuah benua adalah memilih benua lain, dan "lihat
                       semuanya lagi" jadi tidak mungkin. */
                    onClick={() => setActive(selected ? null : key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "bg-raised/70 text-ink"
                        : "text-ink-muted hover:bg-raised/40 hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `oklch(0.48 0.13 ${info.hue})` }}
                    />
                    <span className="font-display text-lg leading-none">{info.name[locale]}</span>
                    <span className="ml-auto text-[0.7rem] tracking-[0.14em] text-ink-dim tabular-nums uppercase">
                      {counts[key]} {A_COPY.worldSites[locale]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ══ Kanan — globe ═════════════════════════════════════════ */}
        <div data-world-stage className="lg:col-span-8">
          <div className="stage-backdrop relative aspect-square w-full overflow-hidden rounded-2xl border border-line sm:aspect-[4/3]" />
        </div>
      </div>
    </section>
  );
}
