"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { Continent } from "@/data/types";
import type { MapPoint } from "@/components/landing/types";
import { CONTINENT_INFO, CONTINENT_ORDER } from "@/data/continents";
import { useI18n } from "@/lib/i18n/client";
import { useInView } from "@/lib/motion/use-in-view";
import { useStillPreference } from "@/lib/motion/use-still-preference";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { cn } from "@/lib/cn";
import { A_COPY } from "./copy";

/* Kanvas dimuat hanya di klien: WebGL tidak ada di server, dan menariknya ke
   bundle server hanya memperlambat render pertama tanpa menghasilkan satu
   piksel pun. */
const WorldGlobe = dynamic(
  () => import("@/components/three/world-globe").then((m) => m.WorldGlobe),
  { ssr: false },
);

/**
 * Dunia — lima benua, lima belas pintu masuk.
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
  const [gateRef, { active: visible, entered }] = useInView<HTMLDivElement>({ rootMargin: "300px" });
  const still = useStillPreference();

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
      {/* Sambungan dengan "Yang Hilang" di atasnya.

          Bidang cahaya yang menutup di sana berhenti tepat pada tepi bawah
          section-nya, dan di bawah tepi itu halaman kembali ke kertas. Kedua
          warnanya nyaris sama — selisih 3, 4, dan 6 dari 255 — tetapi dua
          bidang selebar layar yang bertemu pada tepi tegas tetap terbaca
          sebagai GARIS mendatar, dan garis itulah yang mengganggu.

          Pita ini berangkat dari warna panel itu persis, lalu melandai ke nol.
          Tepinya hilang; perbedaan warnanya tetap ada, dan memang tidak ada
          yang salah dengannya.

          `-z-10` menaruhnya di belakang seluruh isi section tetapi tetap di
          depan latar `concept-ground` — `ConceptFrame` memasang `isolate`, jadi
          z-index negatif berhenti di sana alih-alih tenggelam ke belakang
          halaman.

          `motion-reduce:hidden` karena pada mode itu panel cahayanya memang
          tidak pernah dipasang: kedua section berdiri berurutan di atas kertas
          yang sama, tidak ada sambungan untuk ditambal, dan pita yang tetap
          dilukis cuma jadi noda terang tanpa sebab. */}
      <div
        aria-hidden="true"
        className="light-field pointer-events-none absolute inset-x-0 top-0 -z-10 h-[18rem] motion-reduce:hidden"
      />

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
                    /* Terbaca sebagai TOMBOL sebelum disentuh.

                       Versi sebelumnya cuma teks dengan latar yang muncul saat
                       hover — dan latar yang baru muncul saat hover tidak
                       menolong siapa pun memutuskan untuk menyentuhnya. Di
                       layar sentuh ia bahkan tidak pernah ada. Sekarang tiap
                       baris membawa bingkai, permukaan, dan anak panah sejak
                       bingkai pertama; hover dan `aria-pressed` mempertegasnya,
                       bukan mengumumkannya.

                       `cursor-pointer` ditulis eksplisit: Tailwind v4
                       mengembalikan `cursor: default` pada `<button>` mengikuti
                       perilaku bawaan peramban, jadi tanpa ini penunjuk tidak
                       pernah berubah di atas sesuatu yang jelas-jelas bisa
                       diklik. */
                    className={cn(
                      "group flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      selected
                        ? "border-line-strong bg-raised text-ink"
                        : "border-line bg-surface/60 text-ink-muted hover:border-line-strong hover:bg-raised/70 hover:text-ink",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full transition-transform",
                        selected && "scale-125",
                      )}
                      style={{ backgroundColor: `oklch(0.48 0.13 ${info.hue})` }}
                    />
                    <span className="font-display text-lg leading-none">{info.name[locale]}</span>
                    <span className="ml-auto text-[0.7rem] tracking-[0.14em] text-ink-dim tabular-nums uppercase">
                      {counts[key]} {A_COPY.worldSites[locale]}
                    </span>
                    {/* Anak panah — penanda arah yang sama dengan yang dipakai
                        tautan di seluruh situs. Ia bergeser sedikit saat hover,
                        dan berputar jadi tanda silang saat benuanya sedang
                        dipilih: satu bentuk yang mengatakan "buka" lalu
                        "lepas", bukan dua ikon yang harus dipelajari. */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-300",
                        selected ? "rotate-45 text-gold-dim" : "text-ink-dim group-hover:translate-x-0.5",
                      )}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ══ Kanan — globe ═════════════════════════════════════════

            `entered` memasangnya sekali dan tidak pernah membatalkannya;
            `visible` yang menghidupkan dan mematikan loop rendernya. Membuka
            halaman lalu berhenti di pembuka tidak menarik satu byte pun untuk
            section ini — §7. */}
        <div data-world-stage ref={gateRef} className="lg:col-span-8">
          <div className="stage-backdrop relative aspect-square w-full overflow-hidden rounded-2xl border border-line sm:aspect-[4/3]">
            {entered ? (
              <WorldGlobe
                marks={points}
                activeContinent={active}
                active={visible}
                still={still}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
