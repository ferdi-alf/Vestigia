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
import { ABOUT_COPY } from "./copy";

/** Dipotong dari 180° penuh: Antartika memakan sepertiga bawah dan tidak pernah
    memuat satu pun warisan. Membiarkannya berarti mengecilkan semua yang lain
    demi es kosong.

    Nilainya sama dengan yang dipakai peta konsep C — dua peta di satu situs yang
    memakai bingkai berbeda akan terbaca sebagai dua dunia. */
const VIEWBOX = "0 10 360 135";

/**
 * Lima benua, dan garis yang menunjukkan letaknya.
 *
 * **Dipulihkan, bukan ditulis ulang.** Ini section `Pintu Masuk` yang dulu
 * berdiri di landing dan dihapus saat landing dipadatkan jadi tiga babak.
 * Pemilik project memintanya kembali — dan tempatnya memang di sini, bukan di
 * landing: ia menjelaskan bentuk KOLEKSI, dan itu pertanyaan halaman Tentang.
 * Yang berubah cuma nama, id, dan sumber teksnya.
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
export function AtlasDoors({ points }: { points: MapPoint[] }) {
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
    ? [
        {
          from: `about-card-${hovered}`,
          to: `about-mark-${hovered}`,
          /* Diturunkan dari -26. Angka itu dipilih untuk lintasan TEGAK saat
             kartu masih berada di bawah peta; pada lintasan MENDATAR dari kolom
             kanan ke penanda di peta, busur sebesar itu melengkung jauh di atas
             kedua ujungnya dan terbaca sebagai hiasan, bukan sebagai hubungan. */
          curvature: -14,
        },
      ]
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
    <section ref={root} id="peta" aria-labelledby="about-map-title" className="relative pt-4 pb-24 sm:pb-32">
      <div>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p data-reveal className="kicker">
              {ABOUT_COPY.mapKicker[locale]}
            </p>
            <h2
              id="about-map-title"
              data-reveal
              className="mt-4 font-display text-3xl leading-[1.06] text-ink sm:text-4xl lg:text-5xl"
            >
              {ABOUT_COPY.mapTitle[locale]}
            </h2>
          </div>
          <p
            data-reveal
            className="text-sm leading-[1.75] text-ink-muted lg:col-span-4 lg:col-start-9 lg:self-end"
          >
            {ABOUT_COPY.mapLead[locale]}
          </p>
        </div>

        {/* Peta dan kartu BERDAMPINGAN dari `lg` ke atas.

            Keduanya tetap di dalam satu `scope`, dan itu syarat: `BeamField`
            mengukur posisi relatif terhadap container ini lalu men-cache-nya,
            jadi memecahnya jadi dua wadah akan membuat garisnya menunjuk ke
            tempat yang salah.

            Di bawah `lg` kartunya kembali ke bawah peta dalam dua kolom. Kolom
            selebar sepertiga tidak punya ruang untuk lima kartu di layar sempit,
            dan beam memang sudah tidak digambar di sana. */}
        <div ref={scope} className="relative mt-12 grid gap-4 lg:grid-cols-12 lg:gap-5">
          {/* Peta. Ia menyampaikan LETAK, bukan tautan — jadi ia diberi label
              sebagai satu gambar tunggal, dan navigasinya ada di kartu di
              sampingnya. Lima target sekecil ini tidak akan pernah jadi target
              sentuh atau target papan ketik yang layak. */}
          <div
            data-reveal
            role="img"
            aria-label={ABOUT_COPY.mapTitle[locale]}
            /* Dibiarkan MEREGANG setinggi kolom kartu di sebelahnya, dengan
               petanya dipusatkan di dalamnya. Peta ini dipotong lebar dan
               pendek (360x135 derajat), jadi pada lebar dua pertiga ia cuma
               setinggi 328px sementara lima kartu menumpuk sampai 494 —
               membiarkannya rata atas menyisakan lubang 166px di bawah peta. */
            className="overflow-hidden rounded-2xl border border-line bg-surface px-4 py-5 sm:px-6 lg:col-span-8 lg:flex lg:flex-col lg:justify-center"
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
                    data-beam={`about-mark-${anchor.continent}`}
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
              koleksi — jadi angkanya informasi, bukan hiasan.

              Satu kolom tegak di `lg`, dua kolom di bawahnya. `content-start`
              supaya kelimanya rapat di puncak alih-alih direnggangkan setinggi
              peta — lima kartu yang dipaksa mengisi tinggi peta akan punya
              bantalan dalam yang tidak pernah dipilih siapa pun. */}
          <div
            data-doors
            className="grid gap-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:content-start lg:gap-2.5"
          >
            {anchors.map(({ continent, count, slug }) => {
              const info = CONTINENT_INFO[continent];
              return (
                <Link
                  key={continent}
                  data-door
                  data-beam={`about-card-${continent}`}
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
                    "raking-card group relative isolate overflow-hidden rounded-2xl border bg-surface transition-colors",
                    /* Kartu tinggi di bawah `lg`, BARIS ramping dari `lg` ke
                       atas. Bentuk lamanya disetel untuk lima kartu berjajar
                       selebar halaman; lima di antaranya ditumpuk pada kolom
                       sepertiga akan jauh melampaui tinggi petanya. */
                    "flex flex-col justify-between p-5",
                    "lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:px-4 lg:py-3.5",
                    hovered === continent ? "border-line-strong" : "border-line hover:border-line-strong",
                  )}
                >
                  {/* Aksen benua — penanda wayfinding yang sama dengan yang
                      dipakai peta, jadi benua yang sama selalu berwarna sama di
                      seluruh situs ini.

                      Pindah tepi mengikuti bentuk kartunya: pada kartu yang
                      lebar ia garis judul di tepi atas, pada baris yang ramping
                      ia penanda di tepi kiri. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-0.5 lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-0.5"
                    style={{ backgroundColor: `oklch(0.48 0.13 ${info.hue})` }}
                  />
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl leading-none text-ink lg:text-xl">
                      {info.name[locale]}
                    </h3>
                    {/* Dua baris, bukan dipotong satu baris. Kolom selebar ini
                        memuat sekitar empat puluh huruf, dan tagline benua
                        semuanya lebih panjang — memotongnya di tengah kata
                        terbaca sebagai kerusakan, bukan sebagai ringkasan. */}
                    <p className="mt-3 text-xs leading-relaxed text-ink-muted lg:mt-1.5 lg:line-clamp-2">
                      {info.tagline[locale]}
                    </p>
                  </div>
                  {/* Angkanya jadi subjek, sejalan dengan chip metadata: yang
                      dibaca lebih dulu adalah BERAPA, bukan kata "situs". */}
                  <p className="mt-6 flex items-baseline gap-1.5 lg:mt-0 lg:shrink-0 lg:flex-col lg:items-end lg:gap-0.5">
                    <span className="font-display text-3xl leading-none tabular-nums text-ink lg:text-2xl">
                      {String(count).padStart(2, "0")}
                    </span>
                    <span className="text-[0.6rem] tracking-[0.16em] text-ink-dim uppercase">
                      {ABOUT_COPY.mapSites[locale]}
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
