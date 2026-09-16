"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CONTINENT_INFO } from "@/data/continents";
import { WORLD_LAND_PATH, project } from "@/data/world-outline";
import type { MapPoint } from "@/components/landing/types";
import { useI18n } from "@/lib/i18n/client";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { cn } from "@/lib/cn";
import { A_COPY } from "./copy";

/** Dipotong dari 180° penuh: Antartika memakan sepertiga bawah dan tidak pernah
    memuat satu pun warisan. Membiarkannya berarti mengecilkan semua yang lain
    demi es kosong. */
const VIEWBOX = "0 10 360 135";

/**
 * Penjelajah — dunia kembali, dan titik-titiknya menyala lagi.
 *
 * Section ini adalah jawaban naratif atas penyelaman sebelumnya. Di sana empat
 * belas penanda padam satu per satu; di sini kelima belasnya menyala kembali,
 * disapu dari barat ke timur seperti fajar yang melintasi bumi — dan sekarang
 * bisa diklik. Pemulihannya adalah intinya.
 *
 * Petanya duduk di `.shell`, lebar yang SAMA PERSIS dengan navbar. Itu yang
 * membuat halaman ini terbaca sebagai satu benda: bukan kemiripan lebar,
 * melainkan tepi yang benar-benar sama.
 */
export function Explorer({ points }: { points: MapPoint[] }) {
  const { locale } = useI18n();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);

  /* Diurut barat ke timur. Urutan inilah yang dipakai stagger. */
  const ordered = [...points].sort((a, b) => a.lon - b.lon);

  useScrollScene(
    ({ still }, node) => {
      if (still) return;

      const tl = gsap.timeline({
        scrollTrigger: { trigger: node, start: "top 72%", once: true },
      });

      tl.from(gsap.utils.toArray<HTMLElement>("[data-reveal]", node), {
        autoAlpha: 0,
        y: 22,
        duration: 0.7,
        stagger: 0.09,
        ease: EASE.enter,
      })
        .from(node.querySelector("[data-land]"), { autoAlpha: 0, duration: 1.1, ease: EASE.enter }, "-=0.45")
        /* Menyala kembali, bukan sekadar muncul: dari nol, satu per satu,
           dari barat ke timur. Ia membaca sebagai pemulihan karena ia
           kebalikan persis dari cara mereka padam di penyelaman tadi. */
        .from(
          gsap.utils.toArray<SVGGElement>("[data-mark]", node),
          { autoAlpha: 0, scale: 0.2, transformOrigin: "center", duration: 0.5, stagger: 0.055, ease: EASE.enter },
          "-=0.6",
        );
    },
    root,
    [ordered.length],
  );

  if (ordered.length === 0) return null;

  return (
    <section ref={root} id="peta" aria-labelledby="a-explorer-title" className="relative py-28 sm:py-36">
      <div className="shell">
        <p data-reveal className="kicker">
          {A_COPY.explorerKicker[locale]}
        </p>
        <h2
          id="a-explorer-title"
          data-reveal
          className="shell-text mt-6 font-display text-4xl leading-[1.08] text-ink sm:text-5xl"
        >
          {A_COPY.explorerTitle[locale]}
        </h2>
        <p data-reveal className="shell-text mt-6 text-base leading-relaxed text-ink-muted">
          {A_COPY.explorerLead[locale]}
        </p>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Peta menyampaikan sebaran, bukan tautan. Ia diberi label sebagai
              satu gambar tunggal, dan navigasinya ada di daftar di sebelahnya —
              lima belas target sekecil ini tidak akan pernah bisa jadi target
              sentuh atau target papan ketik yang layak. */}
          <div
            className="lg:col-span-8"
            role="img"
            aria-label={A_COPY.explorerTitle[locale]}
          >
            <svg viewBox={VIEWBOX} className="h-auto w-full overflow-visible">
              <g stroke="currentColor" className="text-line-strong" strokeWidth="0.15" opacity="0.3">
                {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
                  const x = project(0, lon).x;
                  return <line key={`lon${lon}`} x1={x} y1={10} x2={x} y2={145} />;
                })}
                {[60, 30, 0, -30].map((lat) => {
                  const y = project(lat, 0).y;
                  return <line key={`lat${lat}`} x1={0} y1={y} x2={360} y2={y} />;
                })}
              </g>

              <path
                data-land
                d={WORLD_LAND_PATH}
                className="fill-raised stroke-line-strong"
                strokeWidth="0.25"
                fillRule="evenodd"
              />

              {ordered.map((point) => {
                const { x, y } = project(point.lat, point.lon);
                const on = active === point.slug;
                const hue = CONTINENT_INFO[point.continent].hue;
                return (
                  <g key={point.slug} data-mark transform={`translate(${x} ${y})`}>
                    <circle
                      r={on ? 5 : 3.4}
                      fill={`oklch(0.48 0.13 ${hue})`}
                      opacity={on ? 0.28 : 0.15}
                      className="transition-all duration-300"
                    />
                    {/* Inti titik lebih GELAP daripada halonya, dan arah itu
                        baru saja DIBALIK bersama paletnya.

                        Di dalam gelap, "lebih padat" berarti lebih terang —
                        nilai lamanya 0,86 di atas halo 0,72. Di atas kapur
                        arah itu berlawanan: yang lebih terang justru mundur ke
                        latar. Sekarang inti 0,42 di atas halo 0,48, dan padat
                        kembali berarti di sini. */}
                    <circle
                      r={on ? 1.5 : 1.1}
                      fill={`oklch(0.42 0.13 ${hue})`}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <ul className="lg:col-span-4">
            {ordered.map((point) => (
              <li key={point.slug}>
                <Link
                  href={`/heritage/${point.slug}`}
                  onMouseEnter={() => setActive(point.slug)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(point.slug)}
                  onBlur={() => setActive(null)}
                  className={cn(
                    "flex items-baseline gap-3 rounded-md py-1.5 transition-colors",
                    active === point.slug ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 translate-y-[-0.15em] rounded-full"
                    style={{ backgroundColor: `oklch(0.48 0.13 ${CONTINENT_INFO[point.continent].hue})` }}
                  />
                  <span className="text-sm">{point.name[locale]}</span>
                  <span className="ml-auto text-xs text-ink-dim">{point.country[locale]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
