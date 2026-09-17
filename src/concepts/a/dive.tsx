"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Heritage } from "@/data/types";
import type { DiveProgress, GlobeMark } from "@/components/three/globe-stage";
import { CONCEPT_MEDIA } from "@/data/landing-media";
import { MediaLayer } from "@/components/landing/media-layer";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { useInView } from "@/lib/motion/use-in-view";
import { useStillPreference } from "@/lib/motion/use-still-preference";
import { useHandoff } from "./handoff";
import { StrataField } from "@/concepts/shell/strata-field";
import { A_COPY } from "./copy";
import { useDiveFilm } from "./use-dive-film";

const GlobeStage = dynamic(
  () => import("@/components/three/globe-stage").then((m) => m.GlobeStage),
  { ssr: false },
);

const slot = (id: string) => CONCEPT_MEDIA.find((s) => s.id === id)!;
const DUST = slot("a-dust");

/**
 * Pembuka — teks di kiri, globe di kanan, satu panggung lengket ter-scrub.
 *
 * ---
 *
 * **VIDEO DIBUANG SELURUHNYA.** Versi sebelumnya membuka dengan klip 7,95 MB
 * yang di-scrub, lalu menutupnya dengan dua panel kertas untuk menyerahkan
 * bingkai ke globe. Pemilik project memotongnya: halaman kini sepenuhnya
 * animasi, tanpa satu byte video pun.
 *
 * Yang ikut pergi bersamanya karena memang tidak punya pekerjaan lagi: kedua
 * panel tirai (tidak ada yang perlu disapu bersih) dan kerai keterbacaan (teks
 * berdiri di atas kertas sejak bingkai pertama, bukan di atas klip gelap).
 * Transfer halaman ini turun sekitar 8 MB karenanya.
 *
 * **Urutan lapisan, dan urutannya syarat:**
 *
 *     z-0    lapisan      medan strata, kanvas 2D; paling belakang
 *     z-[1]  kanvas 3D    globe, satu-satunya subjek
 *     z-[2]  debu         di DEPAN subjek; debu di belakang subjek cuma tekstur
 *     z-10   teks
 *
 * **Panel cahaya penutup tidak lagi di sini.** Ia pindah ke kelompok dua
 * (`relic.tsx`) bersama seluruh serah terimanya. Alasannya struktural: selama
 * cahaya hidup di panggung INI, ia menutup pada bingkai ini — lalu komposisi
 * berikutnya tetap harus digulir untuk didatangi. Di sana ia menutup pada
 * bingkai yang SAMA dengan tempat komposisi dirakit, dan jaraknya jadi nol.
 *
 * Latar strata berbagi gerbang `useInView` yang sama dengan globe alih-alih
 * memasang pengamatnya sendiri. Satu section, satu pengamat: dua yang mengawasi
 * kotak yang sama akan bisa berselisih pendapat tentang kapan ia terlihat.
 *
 * Tinggi section dan `sticky` adalah PASANGAN, tetapi BUKAN pasangan satu-satu.
 * ScrollTrigger di `use-dive-film` berjalan dari `top top` ke `bottom top` —
 * sengaja lebih jauh daripada lama elemen lengket bertahan di layar.
 *
 * Bedanya justru itu perbaikannya. Dengan `bottom bottom`, progres 1 jatuh saat
 * panggung lengket MULAI meluncur pergi, dan satu tinggi layar terakhir tidak
 * dianimasikan apa pun — 949 piksel kertas mengosong sebelum section berikutnya
 * berdiri, terukur pada viewport 730px. Dengan `bottom top`, layar terakhir itu
 * berhenti jadi sisa dan jadi rentang animasi penutup: bumi ditembus PERSIS
 * selagi panggungnya meluncur.
 */
export function Dive({ heritage, marks }: { heritage: Heritage; marks: GlobeMark[] }) {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef<DiveProgress>({ value: 0, intro: 0 });

  /* Dihitung dari penanda yang sama yang berdiri di globe, bukan dari daftar
     benua — supaya angkanya menyebut apa yang BENAR-BENAR ada di koleksi, bukan
     apa yang secara teori mungkin ada. */
  const continents = useMemo(() => new Set(marks.map((m) => m.continent)).size, [marks]);
  const [gateRef, { active, entered, visible }] = useInView<HTMLDivElement>({ rootMargin: "200px" });
  const still = useStillPreference();

  /* Pemilik kotak progres ada di sini, dan hanya di sini.
     Film menerbitkan angkanya; panggung 3D dan video membacanya. Identitasnya
     stabil, jadi ia tidak pernah memicu film dirakit ulang. */
  const publish = useCallback((patch: Partial<DiveProgress>) => {
    Object.assign(progress.current, patch);
  }, []);

  /* Apakah panggung ini sudah benar-benar dilewati.

     Bukan gerbang "boleh menggambar" melainkan gerbang "boleh ADA". Section
     `relic` di bawah sini memasang penampil warisannya sendiri dengan kanvas
     sendiri; membiarkan kanvas globe tetap terpasang berarti dua konteks WebGL
     hidup pada satu halaman, dan §7 menuntut satu.

     Dilepas saat panggung lewat, dipasang lagi saat pengunjung menggulir balik.
     Yang mahal dari memasang ulang — derau prosedural 2048x1024 — sudah tidak
     dihitung dua kali sejak `createGlobeMaps` menyimpan kanvasnya. */
  const [passed, setPassed] = useState(false);

  /* Globe juga dilepas begitu bidang cahaya kelompok dua menutup penuh.

     `passed` sendiri datang dari ambang gulir, dan ambang gulir tidak pernah
     terlewati kalau pengguna berhenti menggulir tepat di titik serah terima —
     yang justru persis yang diminta terjadi di sana. Tanpa sinyal kedua ini,
     halaman memegang dua konteks WebGL selama ia diam di situ. */
  const { sealed } = useHandoff();

  useDiveFilm(root, publish, setPassed);


  return (
    <section
      ref={root}
      aria-labelledby="a-hero-title"
      className="relative motion-safe:h-[210svh] md:motion-safe:h-[260svh]"
    >
      <div
        ref={stage}
        className="sticky top-0 flex h-svh items-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:py-28"
      >
        {/* z-0 · medan strata. Kanvas 2D, bukan konteks WebGL kedua — §7
            melarang yang kedua, dan hero sudah memakai jatahnya untuk globe. */}
        <StrataField active={active} still={still} />

        {/* z-[1] · panggung 3D — satu-satunya subjek section ini.

            `active` mematikan loop render saat kanvas keluar layar atau tab
            disembunyikan; `passed` MELEPASNYA sama sekali begitu panggung
            benar-benar lewat, supaya section di bawah tidak pernah berbagi
            halaman dengan konteks WebGL kedua.

            Syarat ketiga hanya berlaku saat gerak dikurangi, dan ia menambal
            lubang yang dibuka oleh §10 sendiri: `passed` datang dari
            ScrollTrigger, dan saat gerak dikurangi tidak satu pun ScrollTrigger
            dipasang — jadi panggung ini tidak pernah dilepas, dan terukur di
            peramban halaman berakhir memegang TIGA konteks WebGL sekaligus.
            `visible` tidak bergantung pada ScrollTrigger sama sekali. Dipakai
            `visible` dan bukan `active` supaya berpindah tab tidak melepas dan
            memasang ulang panggungnya. */}
        <div ref={gateRef} className="absolute inset-0 z-[1]">
          {entered && !passed && !sealed && (!still || visible) ? (
            <GlobeStage
              marks={marks}
              targetSlug={heritage.slug}
              progress={progress}
              active={active}
              still={still}
            />
          ) : null}
        </div>

        {/* z-[2] · debu, di DEPAN subjek. Debu di belakang subjek bukan debu;
            ia cuma tekstur langit. Masuk bersama globe, tidak sebelumnya. */}
        <div data-dive-dust className="absolute inset-0 z-[2]">
          <MediaLayer slot={DUST} sizes="100vw" />
        </div>


        <div className="shell relative z-10">
          {/* ══ Sambutan ══════════════════════════════════════════════ */}
          <div data-dive-hero>
            <p className="kicker">{A_COPY.heroKicker[locale]}</p>
            <h1
              id="a-hero-title"
              className="shell-text mt-6 font-display text-[2.6rem] leading-[1.04] text-ink sm:text-6xl lg:text-7xl"
            >
              {/* Jendela ber-overflow-hidden yang bergerak, bukan huruf per
                  huruf. Teksnya tetap satu blok utuh bagi pembaca layar dan
                  bagi Ctrl+F. */}
              <span data-reveal-line className="block overflow-hidden pb-[0.08em]">
                <span className="block">{A_COPY.heroTitle[locale]}</span>
              </span>
            </h1>
            <p data-dive-lead className="shell-text mt-7 text-base leading-relaxed text-ink-muted sm:text-lg">
              {A_COPY.heroLead[locale]}
            </p>

            {/* Kepadatan yang menyebutkan sesuatu — dan sekarang benar-benar
                ketiganya dibaca dari koleksi.

                Jumlah benua sebelumnya ditulis tangan sebagai `"5"` tepat di
                bawah komentar yang mengklaim ketiganya dihitung. Ia kini
                diturunkan dari `marks` yang sama, jadi menambah satu warisan di
                benua keenam mengubah angka ini tanpa menyentuh satu baris pun.

                Tanpa kartu. Versi sebelumnya membungkus ketiganya dalam
                `MetadataChip` — latar, tepi terukir, bayangan dalam — tiga
                kotak bersaing tepat di bawah judul yang seharusnya jadi titik
                fokus tunggal. Yang tersisa cuma angka dan labelnya, dipisah
                satu garis rambut. */}
            <div className="mt-9 flex flex-wrap items-start gap-x-6 gap-y-5 sm:gap-x-8">
              <HeroStat value={marks.length} label={A_COPY.chipSites[locale]} />
              <HeroStat value={continents} label={A_COPY.chipContinents[locale]} divided />
              {/* Format disembunyikan di layar paling sempit.

                  Ia satu-satunya dari ketiganya yang bukan angka, dan
                  satu-satunya yang melebar sampai ke sisi kanan bingkai —
                  tempat globe duduk di ponsel. Dua angka di kiri sudah
                  menyampaikan kepadatan koleksi; yang ketiga bisa menunggu
                  sampai ada lebar untuk menampungnya. */}
              <div data-dive-chip className="hidden border-l border-line pl-6 sm:block sm:pl-8">
                <p className="font-display text-xl leading-none text-ink-soft sm:text-2xl">
                  {A_COPY.chipFormatValue[locale]}
                </p>
                <p className="mt-2.5 text-[0.58rem] leading-none tracking-[0.18em] text-ink-dim uppercase">
                  {A_COPY.chipFormat[locale]}
                </p>
              </div>
            </div>

            {/* SATU ajakan, dan ia menuju object 3D-nya sendiri. */}
            <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                data-dive-action
                href={`/heritage/${heritage.slug}`}
                className={buttonClass({ size: "lg" })}
              >
                {dict.landing.heroPrimary}
              </Link>
            </div>
          </div>

          {/* ══ Jembatan ══════════════════════════════════════════════
              Satu kalimat, ditahan diam sepanjang `close` sementara globe
              mendekat. Ia menggambarkan
              apa yang sedang terjadi di layar, jadi ia bukan hiasan, dan ia
              tidak mengklaim apa pun tentang laju kerusakan warisan.

              Rata kiri dan dibatasi separuh lebar: globe duduk di kanan, dan
              kalimat yang melintasinya akan dibaca di atas bola. */}
          <p
            data-dive-bridge
            className="font-display text-3xl leading-snug text-ink-soft motion-safe:absolute motion-safe:top-1/2 motion-safe:-translate-y-1/2 motion-reduce:mt-16 sm:text-4xl lg:max-w-[46%]"
          >
            {A_COPY.bridgeLine[locale]}
          </p>
        </div>

        <p
          data-dive-hint
          className="pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center text-[0.65rem] tracking-[0.2em] text-ink-dim uppercase"
        >
          {A_COPY.scrollHint[locale]}
        </p>
      </div>
    </section>
  );
}

/**
 * Satu angka besar dengan labelnya, tanpa kotak.
 *
 * `tabular-nums` bukan kosmetik: angkanya dihitung naik dari nol saat masuk,
 * dan digit berlebar-beda membuat seluruh baris bergoyang di tiap langkah
 * cacahan.
 *
 * Nilai benarnya dirender server sebagai teks sungguhan DAN disimpan di
 * `data-count`. Filmlah yang menimpa `textContent` tiap frame, jadi nilai
 * benarnya harus tinggal di tempat yang tidak ikut tertimpa — dan karena
 * teksnya nyata sejak HTML pertama, tanpa JavaScript, pada pembaca layar, dan
 * pada Ctrl+F angkanya tetap benar.
 */
function HeroStat({
  value,
  label,
  divided = false,
}: {
  value: number;
  label: string;
  divided?: boolean;
}) {
  return (
    <div data-dive-chip className={divided ? "border-l border-line pl-6 sm:pl-8" : undefined}>
      <p className="font-display text-4xl leading-none text-ink tabular-nums sm:text-5xl">
        <span data-count={value}>{value}</span>
      </p>
      <p className="mt-2.5 text-[0.58rem] leading-none tracking-[0.18em] text-ink-dim uppercase">
        {label}
      </p>
    </div>
  );
}
