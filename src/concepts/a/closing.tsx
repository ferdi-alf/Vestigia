"use client";

import Link from "next/link";
import { useRef } from "react";
import { CONTINENT_INFO } from "@/data/continents";
import type { MapPoint } from "@/components/landing/types";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { A_COPY } from "./copy";

/**
 * Bingkai terakhir.
 *
 * Dunia mundur sampai jadi satu titik, dan pernyataan penutup naik di
 * belakangnya. Ini bukan CTA dengan ruang kosong besar — ia adegan terakhir,
 * dan tombolnya kebetulan ada di dalamnya.
 *
 * Digambar SVG, bukan WebGL, dan itu bukan kompromi melainkan aturan: satu
 * konteks WebGL per halaman, dan konteks itu sudah dipakai penyelaman di atas.
 * Yang dibutuhkan di sini juga bukan bola sungguhan — melainkan ingatan akan
 * bola itu, dan cincin tipis dengan lima belas titik justru mengatakannya
 * lebih jelas daripada render kedua yang bersaing dengan yang pertama.
 *
 * Lima belas titik di bawah diletakkan menurut bujur aslinya, bukan dibagi
 * rata. Jaraknya yang tidak beraturan itulah informasinya — warisan memang
 * tidak tersebar merata di bumi.
 */
export function Closing({ points }: { points: MapPoint[] }) {
  const { locale } = useI18n();
  const root = useRef<HTMLElement>(null);

  useScrollScene(
    ({ still }, node) => {
      if (still) return;

      gsap.from(gsap.utils.toArray<HTMLElement>("[data-reveal]", node), {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.1,
        ease: EASE.enter,
        scrollTrigger: { trigger: node, start: "top 74%", once: true },
      });

      /* Dunia mundur. Ter-scrub, bukan berbasis waktu: cincin yang menyusut
         sendiri selamanya akan tetap menyusut ketika pengunjung sudah berhenti
         membaca dan hanya mencari tombolnya. */
      gsap.fromTo(
        node.querySelector("[data-orb]"),
        { scale: 1.25, autoAlpha: 0.35 },
        {
          scale: 0.72,
          autoAlpha: 1,
          ease: EASE.scrub,
          scrollTrigger: { trigger: node, start: "top bottom", end: "bottom bottom", scrub: true },
        },
      );
    },
    root,
    [points.length],
  );

  return (
    <section ref={root} id="tentang" className="relative overflow-hidden py-36 sm:py-52">
      {/* Cincin duduk di belakang teks dan dipotong tepi section — dunia yang
          sudah terlalu jauh untuk muat seluruhnya di dalam bingkai. */}
      <div
        aria-hidden="true"
        data-orb
        className="pointer-events-none absolute top-1/2 right-[-18%] h-[38rem] w-[38rem] -translate-y-1/2 sm:right-[-6%]"
      >
        <svg viewBox="-110 -110 220 220" className="h-full w-full">
          <circle r="100" className="stroke-line-strong" strokeWidth="0.5" fill="none" opacity="0.5" />
          <circle r="100" className="fill-surface" opacity="0.35" />
          <ellipse rx="100" ry="34" className="stroke-line-strong" strokeWidth="0.35" fill="none" opacity="0.35" />
          {points.map((point) => {
            /* Bujur → sudut di sekeliling cincin; lintang → jarak dari pusat,
               sehingga kutub berkumpul ke dalam seperti pada bola sungguhan. */
            const angle = ((point.lon + 180) / 360) * Math.PI * 2;
            const radius = 100 * Math.cos((point.lat / 90) * (Math.PI / 2) * 0.82);
            return (
              <circle
                key={point.slug}
                cx={Math.cos(angle) * radius}
                cy={-point.lat * 0.95}
                r="2.2"
                fill={`oklch(0.48 0.13 ${CONTINENT_INFO[point.continent].hue})`}
                opacity="0.9"
              />
            );
          })}
        </svg>
      </div>

      <div className="shell relative">
        <span data-reveal aria-hidden="true" className="carved-edge" />
        <h2
          data-reveal
          className="shell-text mt-8 font-display text-5xl leading-[1.04] text-ink sm:text-6xl lg:text-7xl"
        >
          {A_COPY.closeTitle[locale]}
        </h2>
        <p data-reveal className="mt-6 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
          {A_COPY.closeLead[locale]}
        </p>
        <div data-reveal className="mt-12">
          <Link href="#tujuan" className={buttonClass({ size: "lg" })}>
            {A_COPY.closeCta[locale]}
          </Link>
        </div>
      </div>
    </section>
  );
}
