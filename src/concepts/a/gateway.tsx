"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CONTINENT_INFO } from "@/data/continents";
import type { Continent } from "@/data/types";
import { WORLD_LAND_PATH, project } from "@/data/world-outline";
import type { MapPoint } from "@/components/landing/types";
import { useI18n } from "@/lib/i18n/client";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { BeamField, type BeamLink } from "@/concepts/shell/beam";
import { cn } from "@/lib/cn";
import { A_COPY } from "./copy";

/** Dipotong dari 180° penuh: Antartika memakan sepertiga bawah dan tidak pernah
    memuat satu pun warisan. Membiarkannya berarti mengecilkan semua yang lain
    demi es kosong. Nilai yang SAMA dengan `explorer.tsx` — dua peta di satu
    halaman yang memakai bingkai berbeda akan terbaca sebagai dua dunia. */
const VIEWBOX = "0 10 360 135";

/**
 * Pintu Masuk — lima benua, dan garis yang menunjukkan letaknya.
 *
 * Section ini adalah tempat beam paling pada tempatnya di seluruh konsep A,
 * dan alasannya struktural: hubungan yang digambarnya adalah hubungan
 * GEOGRAFIS, dan garis antar titik memang bagaimana atlas menceritakan
 * hubungan geografis. Ia tidak bisa dituduh dekoratif karena menghapusnya
 * benar-benar menghapus informasi — tanpa garis itu, kartu "Asia" tidak
 * menunjuk apa pun di peta.
 *
 * **Keempat kolom aturan beam §7 terisi:**
 *
 *     ORIGIN       kartu benua yang sedang di-hover atau difokus
 *     DESTINATION  penanda benua itu di peta di atasnya
 *     MEANING      kartu ini adalah wilayah itu
 *     TRIGGER      hover / fokus
 *
 * **Satu garis pada satu waktu**, jauh di bawah batas tiga — karena hanya ada
 * satu pointer dan satu fokus. Varian `leader`: kering, menggambar sekali, lalu
 * tinggal. Cahaya yang menyapu disimpan untuk A-01 di klimaks penyelaman;
 * kalau setiap garis di halaman ini berkilau, tidak ada satu pun yang berarti.
 *
 * Penanda benua diletakkan di **rata-rata bujur dan lintang warisan yang
 * benar-benar ada di benua itu**, bukan di pusat geometris benua. Jadi kalau
 * koleksi ini hanya punya satu situs di Oseania, penandanya duduk tepat di situ
 * — peta ini menggambarkan KOLEKSI, bukan dunia.
 */
export function Gateway({ points }: { points: MapPoint[] }) {
  const { locale } = useI18n();
  const root = useRef<HTMLElement>(null);
  /* Ruang koordinat beam. Ia memuat peta DAN kartu; keduanya wajib berbagi
     container yang sama supaya jarak antar ujung garis tidak pernah berubah. */
  const scope = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Continent | null>(null);

  /* Hanya benua yang benar-benar punya isi. Kartu yang menjanjikan nol situs
     adalah pintu yang membuka ke ruang kosong. */
  const groups = [...new Set(points.map((p) => p.continent))] as Continent[];

  /* Titik tambat per benua: rata-rata koordinat situsnya. */
  const anchors = groups.map((continent) => {
    const inside = points.filter((p) => p.continent === continent);
    const lat = inside.reduce((n, p) => n + p.lat, 0) / inside.length;
    const lon = inside.reduce((n, p) => n + p.lon, 0) / inside.length;
    return {
      continent,
      count: inside.length,
      slug: inside[0].slug,
      ...project(lat, lon),
    };
  });

  const links: BeamLink[] = hovered
    ? [{ from: `a-gw-card-${hovered}`, to: `a-gw-mark-${hovered}`, curvature: -26 }]
    : [];

  useScrollScene(
    ({ still }, node) => {
      if (still) return;

      gsap.from(gsap.utils.toArray<HTMLElement>("[data-reveal]", node), {
        autoAlpha: 0,
        y: 20,
        duration: 0.7,
        stagger: 0.08,
        ease: EASE.enter,
        scrollTrigger: { trigger: node, start: "top 76%", once: true },
      });

      gsap.from("[data-door]", {
        autoAlpha: 0,
        y: 22,
        duration: 0.6,
        stagger: 0.07,
        /* `back.out` yang ringan: sedikit lewat lalu mendarat. Lebih dari ini
           terbaca sebagai mainan. */
        ease: "back.out(1.3)",
        scrollTrigger: { trigger: node.querySelector("[data-doors]"), start: "top 84%", once: true },
      });
    },
    root,
    [groups.length],
  );

  if (anchors.length === 0) return null;

  return (
    <section ref={root} id="tujuan" aria-labelledby="a-gateway-title" className="relative py-24 sm:py-32">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p data-reveal className="kicker">
              {A_COPY.gatewayKicker[locale]}
            </p>
            <h2
              id="a-gateway-title"
              data-reveal
              className="mt-4 font-display text-3xl leading-[1.06] text-ink sm:text-4xl lg:text-5xl"
            >
              {A_COPY.gatewayTitle[locale]}
            </h2>
          </div>
          <p
            data-reveal
            className="text-sm leading-[1.75] text-ink-muted lg:col-span-4 lg:col-start-9 lg:self-end"
          >
            {A_COPY.gatewayLead[locale]}
          </p>
        </div>

        <div ref={scope} className="relative mt-12">
          {/* Peta. Ia menyampaikan LETAK, bukan tautan — jadi ia diberi label
              sebagai satu gambar tunggal, dan navigasinya ada di kartu di
              bawahnya. Lima target sekecil ini tidak akan pernah jadi target
              sentuh atau target papan ketik yang layak. */}
          <div
            data-reveal
            role="img"
            aria-label={A_COPY.gatewayTitle[locale]}
            className="overflow-hidden rounded-2xl border border-line bg-surface px-4 py-5 sm:px-6"
          >
            <svg viewBox={VIEWBOX} className="h-auto w-full overflow-visible">
              <path
                d={WORLD_LAND_PATH}
                className="fill-raised stroke-line-strong"
                strokeWidth="0.25"
                fillRule="evenodd"
                opacity="0.9"
              />

              {anchors.map((anchor) => {
                const on = hovered === anchor.continent;
                const hue = CONTINENT_INFO[anchor.continent].hue;
                return (
                  <g
                    key={anchor.continent}
                    data-beam={`a-gw-mark-${anchor.continent}`}
                    transform={`translate(${anchor.x} ${anchor.y})`}
                    className="transition-opacity duration-300"
                    opacity={hovered && !on ? 0.28 : 1}
                  >
                    <circle
                      r={on ? 6 : 4}
                      fill={`oklch(0.48 0.13 ${hue})`}
                      opacity="0.18"
                      className="transition-all duration-300"
                    />
                    <circle
                      r={on ? 2 : 1.4}
                      fill={`oklch(0.48 0.13 ${hue})`}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Kartu tujuan. Satu per benua, dengan jumlah situs dibaca dari
              koleksi — jadi angkanya informasi, bukan hiasan. */}
          <div data-doors className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {anchors.map(({ continent, count, slug }) => {
              const info = CONTINENT_INFO[continent];
              return (
                <Link
                  key={continent}
                  data-door
                  data-beam={`a-gw-card-${continent}`}
                  href={`/heritage/${slug}`}
                  /* `--lit` ditulis langsung ke gaya, bukan lewat state:
                     sorotnya milik CSS, dan merender ulang pohon komponen demi
                     satu angka opacity adalah biaya yang tidak perlu. Keadaan
                     `hovered` tetap React karena ia menentukan beam mana yang
                     digambar — itu memang perubahan struktur. */
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty("--lit", "1");
                    setHovered(continent);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty("--lit", "0");
                    setHovered(null);
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.setProperty("--lit", "1");
                    setHovered(continent);
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.setProperty("--lit", "0");
                    setHovered(null);
                  }}
                  className={cn(
                    /* `.raking-card` — sapuan cahaya dari KIRI, arah yang sama
                       dengan matahari di seluruh situs. Kelasnya sudah ada di
                       `globals.css` tetapi tidak pernah dipakai konsep A;
                       kartunya selama ini cuma border yang berganti warna. */
                    "raking-card group relative isolate flex flex-col justify-between overflow-hidden rounded-2xl border bg-surface p-5 transition-colors",
                    hovered === continent ? "border-line-strong" : "border-line hover:border-line-strong",
                  )}
                >
                  {/* Aksen benua sebagai pita tipis di tepi atas — penanda
                      wayfinding yang sama dengan yang dipakai peta, jadi benua
                      yang sama selalu berwarna sama di seluruh situs ini. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-0.5"
                    style={{ backgroundColor: `oklch(0.48 0.13 ${info.hue})` }}
                  />
                  <div>
                    <h3 className="font-display text-2xl leading-none text-ink">
                      {info.name[locale]}
                    </h3>
                    <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                      {info.tagline[locale]}
                    </p>
                  </div>
                  {/* Angkanya jadi subjek, sejalan dengan chip metadata: yang
                      dibaca lebih dulu adalah BERAPA, bukan kata "situs". */}
                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-3xl leading-none tabular-nums text-ink">
                      {String(count).padStart(2, "0")}
                    </span>
                    <span className="text-[0.6rem] tracking-[0.16em] text-ink-dim uppercase">
                      {A_COPY.gatewaySites[locale]}
                    </span>
                  </p>
                </Link>
              );
            })}
          </div>

          {/* A-02 · kartu benua → penanda benua itu di peta.
              Hubungan yang digambarnya juga tertulis sebagai teks di pengantar
              section ini, supaya pengguna pembaca layar tidak kehilangan
              informasinya hanya karena ia disampaikan lewat bentuk. */}
          <BeamField container={scope} links={links} variant="leader" className="z-[5] text-gold-dim" />
        </div>
      </div>
    </section>
  );
}
