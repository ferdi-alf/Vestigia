"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CONTINENT_INFO } from "@/data/continents";
import { SECTION_MEDIA } from "@/data/landing-media";
import { WORLD_LAND_PATH, project } from "@/data/world-outline";
import { useI18n } from "@/lib/i18n/client";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { cn } from "@/lib/cn";
import { MediaLayer, IllustrationNote, hasMedia } from "./media-layer";
import type { MapPoint } from "./types";

const BACKDROP = SECTION_MEDIA.find((slot) => slot.id === "world-backdrop")!;

/**
 * Dipotong dari 180° penuh ke lintang +80 … −55.
 * Antarktika memakan sepertiga bawah peta dan tidak pernah memuat satu pun
 * warisan; membiarkannya berarti mengecilkan semua yang lain demi es kosong.
 */
const VIEWBOX = "0 10 360 135";

const GRATICULE_LON = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const GRATICULE_LAT = [60, 30, 0, -30];

/**
 * Aksen benua, dari hue di registry.
 *
 * Lightness-nya turun dari 0,72 ke 0,48 saat halaman jadi terang, dan itu bukan
 * penyesuaian selera. Di atas langit malam, penanda terbaca karena ia **lebih
 * terang** daripada latarnya. Di atas kertas survei, satu-satunya cara ia
 * terbaca adalah dengan menjadi **lebih gelap**. Menyalin angka lama akan
 * membuat kelima belas titik lenyap ke dalam kertas.
 *
 * Yang terendah dari kelima hue pada 0,48 tetap mencapai 5,36:1 terhadap kertas.
 */
function accent(continent: MapPoint["continent"], lightness = 0.48) {
  return `oklch(${lightness} 0.13 ${CONTINENT_INFO[continent].hue})`;
}

export function WorldMap({ points }: { points: MapPoint[] }) {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);

  /* Diurut dari barat ke timur. Urutan ini yang dipakai stagger, sehingga
     titik-titik menyala seperti fajar yang menyapu bumi — bukan acak. */
  const ordered = [...points].sort((a, b) => a.lon - b.lon);

  useScrollScene(
    ({ still }, node) => {
      if (still) return;

      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", node);
      const marks = gsap.utils.toArray<SVGGElement>("[data-mark]", node);

      const tl = gsap.timeline({
        scrollTrigger: { trigger: node, start: "top 74%", once: true },
      });

      tl.from(items, { autoAlpha: 0, y: 22, duration: 0.7, stagger: 0.09, ease: EASE.enter })
        .from(
          node.querySelector("[data-land]"),
          { autoAlpha: 0, duration: 1, ease: EASE.enter },
          "-=0.5",
        )
        .from(
          marks,
          { autoAlpha: 0, scale: 0.2, transformOrigin: "center", duration: 0.5, stagger: 0.05, ease: EASE.enter },
          "-=0.55",
        );
    },
    root,
    [ordered.length],
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      <MediaLayer slot={BACKDROP} sizes="100vw" />
      <div
        aria-hidden="true"
        className="scrim-vertical pointer-events-none absolute inset-0"
      />

      {/* Rapat dan selebar mungkin. Peta butuh lebar, dan memberinya padding
          vertikal sebesar section teks membuatnya terapung di tengah ruang
          kosong alih-alih mengisi layar. */}
      <div className="relative mx-auto max-w-[110rem] px-4 py-20 sm:px-8 sm:py-24">
        <p data-reveal className="kicker">
          {dict.landing.worldKicker}
        </p>
        <h2 data-reveal className="mt-6 max-w-2xl font-display text-4xl leading-[1.08] text-ink sm:text-5xl">
          {dict.landing.worldTitle}
        </h2>
        <p data-reveal className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
          {dict.landing.worldLead}
        </p>

        {ordered.length === 0 ? (
          <p className="mt-16 text-sm text-ink-dim">{dict.landing.worldEmpty}</p>
        ) : (
          <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Peta menyampaikan sebaran, bukan tautan. Ia diberi label sebagai
                satu gambar tunggal, dan navigasinya ada di daftar di sebelahnya —
                lima belas target sekecil ini tidak pernah bisa jadi target sentuh
                atau target papan ketik yang layak. */}
            <div
              className="lg:col-span-8"
              role="img"
              aria-label={`${dict.landing.worldTitle} — ${dict.explore.objectCount(ordered.length)}`}
            >
              <svg viewBox={VIEWBOX} className="h-auto w-full overflow-visible">
                {/* Garis lintang-bujur — motif `coordinate-mark`.
                    Warnanya pindah dari `line` ke `line-strong`: di atas kertas,
                    `line` nyaris sewarna dengan latarnya, dan garis survei yang
                    tidak terlihat bukan lagi motif. Opacity-nya turun sebagai
                    gantinya, supaya ia tetap hairline dan tidak bersaing dengan
                    daratan. */}
                <g stroke="currentColor" className="text-line-strong" strokeWidth="0.15" opacity="0.28">
                  {GRATICULE_LON.map((lon) => {
                    const x = project(0, lon).x;
                    return <line key={`lon${lon}`} x1={x} y1={10} x2={x} y2={145} />;
                  })}
                  {GRATICULE_LAT.map((lat) => {
                    const y = project(lat, 0).y;
                    return <line key={`lat${lat}`} x1={0} y1={y} x2={360} y2={y} />;
                  })}
                </g>

                {/* Daratan naik dari `raised` ke `overlay`. Di tema gelap, selisih
                    satu anak tangga sudah cukup karena langitnya nyaris hitam;
                    di atas kertas selisih itu hilang dan benua melebur. */}
                <path
                  data-land
                  d={WORLD_LAND_PATH}
                  className="fill-overlay stroke-line-strong"
                  strokeWidth="0.25"
                  fillRule="evenodd"
                />

                {ordered.map((point) => {
                  const { x, y } = project(point.lat, point.lon);
                  const on = active === point.slug;
                  return (
                    <g key={point.slug} data-mark transform={`translate(${x} ${y})`}>
                      <circle
                        r={on ? 5 : 3.4}
                        fill={accent(point.continent)}
                        opacity={on ? 0.28 : 0.14}
                        className="transition-all duration-300"
                      />
                      {/* Inti titik lebih GELAP daripada halonya, bukan lebih
                          terang. Di atas kertas, itulah arah yang membaca
                          sebagai "lebih padat", dan padat berarti di sini. */}
                      <circle r={on ? 1.5 : 1.1} fill={accent(point.continent, 0.42)} className="transition-all duration-300" />
                    </g>
                  );
                })}
              </svg>
            </div>

            <ul className="lg:col-span-4 lg:columns-1">
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
                      style={{ backgroundColor: accent(point.continent) }}
                    />
                    <span className="text-sm">{point.name[locale]}</span>
                    <span className="ml-auto text-xs text-ink-dim">{point.country[locale]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <IllustrationNote
          show={hasMedia(BACKDROP)}
          label={dict.landing.illustration}
          className="mt-14"
        />
      </div>
    </section>
  );
}
