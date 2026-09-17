"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Heritage } from "@/data/types";
import { HeritageViewer } from "@/components/three/heritage-viewer";
import { useInView } from "@/lib/motion/use-in-view";
import { useStillPreference } from "@/lib/motion/use-still-preference";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { useMotionTier } from "@/lib/motion/use-motion-tier";
import { EASE, ScrollTrigger, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { BeamField, type BeamLink } from "@/concepts/shell/beam";
import { MetadataChip } from "@/concepts/shell/metadata-chip";
import { A_COPY } from "./copy";

/**
 * Tiga keterangan, tiga siku.
 *
 * Semuanya `vertical-first`, dan perbedaan bentuknya jatuh sendiri dari posisi
 * kartunya — `BeamField` memilih sisi keberangkatan dari apakah wadah berada di
 * bawah atau di atas kartu. Kartu di ATAS menghasilkan L terbalik, kartu di
 * BAWAH menghasilkan L biasa. Tidak ada satu pun cabang khusus untuk itu.
 *
 * `delay` menaikkannya beruntun: garisnya tumbuh satu per satu, bukan bertiga
 * sekaligus. Yang serentak terbaca sebagai tiga garis yang muncul; yang
 * berurutan terbaca sebagai satu benda yang sedang dirakit.
 */
const ELBOWS: BeamLink[] = [
  { from: "a-obj-coord", to: "a-obj-frame", shape: "elbow", elbow: "vertical-first", toEdgeAt: 0.34, delay: 0 },
  { from: "a-obj-period", to: "a-obj-frame", shape: "elbow", elbow: "vertical-first", toEdgeAt: 0.3, delay: 0.18 },
  { from: "a-obj-civ", to: "a-obj-frame", shape: "elbow", elbow: "vertical-first", toEdgeAt: 0.78, delay: 0.36 },
];

/**
 * Yang Hilang — satu warisan, dalam wadahnya sendiri.
 *
 * Sebelumnya beat ini tinggal di dalam panggung penyelaman: object mendarat di
 * kanvas yang sama dengan globe, tanpa bingkai, tanpa kontrol, tanpa cara
 * memutarnya. Sekarang ia section tersendiri dengan penampil yang SAMA PERSIS
 * dengan `/heritage/[slug]` — bisa diputar, didekati, dan sudah berputar pelan
 * sejak awal.
 *
 * ---
 *
 * **DUA KELOMPOK, DUA KECEPATAN.** Kolom kiri masuk seperti section mana pun di
 * situs ini: stagger pendek, sekali, saat section menyentuh viewport. Kolom
 * kanan dirakit BERTAHAP, dan urutannya adalah seluruh maksudnya —
 *
 *     1. wadah dan object                masuk lebih dulu
 *     2. tiga garis tumbuh dari wadah    satu per satu
 *     3. kartu keterangan menyala        di ujung tiap garis
 *
 * Yang dibaca bukan "tiga kartu muncul" melainkan "wadah ini punya tiga hal
 * yang bisa dikatakan, dan inilah letaknya".
 *
 * ---
 *
 * **DUA JEBAKAN YANG SUDAH PERNAH MENGGIGIT PROJECT INI, dan keduanya dipegang
 * di sini secara struktural, bukan lewat kehati-hatian:**
 *
 * 1. `BeamField` mengukur sekali lalu men-cache, dan ujungnya TIDAK BOLEH
 *    berada di dalam elemen yang di-`transform`. Karena itu `built` baru
 *    dinyalakan SETELAH tween `scale`/`y` wadah selesai, dan `BeamField` tidak
 *    dirender sama sekali sebelum itu. Beam dipasang saat seluruh transform
 *    sudah kembali identitas.
 *
 * 2. Kartu keterangan dianimasikan dengan `opacity` SAJA — bukan `autoAlpha`,
 *    bukan `y`, bukan `scale`. Kartu itulah ujung beam-nya; menggesernya
 *    sesudah garis diukur berarti garis yang menunjuk ke tempat kartu dulu
 *    berada.
 */
export function Relic({ heritage }: { heritage: Heritage }) {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tier = useMotionTier();
  const [built, setBuilt] = useState(false);

  /* Apakah section ini sudah jauh terlewat.

     Bukan gerbang "boleh menggambar" melainkan gerbang "boleh ADA". Section
     Dunia di bawah memasang globe relief dengan kanvasnya sendiri; membiarkan
     penampil ini terpasang berarti dua konteks WebGL hidup pada satu halaman,
     dan §7 menuntut satu. */
  const [released, setReleased] = useState(false);

  /**
   * Gerbang kedua untuk penampil, dan ia hanya bekerja saat gerak dikurangi.
   *
   * `released` di atas digerakkan ScrollTrigger, dan §10 menuntut ScrollTrigger
   * TIDAK DIPASANG SAMA SEKALI saat gerak dikurangi — jadi pada mode itu
   * penampil ini tidak pernah punya cara untuk dilepas. Terukur di peramban:
   * setelah melewati ketiga section, halaman memegang tiga konteks WebGL
   * sekaligus, dan §7 memberi jatah satu.
   *
   * `visible`, bukan `active`: berpindah tab tidak boleh membuang model yang
   * sudah terurai dan sudut kamera yang sudah diatur pengguna.
   */
  const still = useStillPreference();
  const [viewerGate, { visible }] = useInView<HTMLDivElement>({ rootMargin: "200px" });

  const [lat, lon] = heritage.coordinates;
  const coordinate = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}  ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;

  useScrollScene(
    ({ still }, node) => {
      /* Gerak dikurangi: tidak satu pun ScrollTrigger dipasang. Kartu tetap
         terlihat penuh dan wadah tetap di tempatnya — yang dilepas hanya
         urutan perakitannya, bukan satu pun isinya. */
      if (still) {
        setBuilt(true);
        return;
      }

      /* `start`/`end` sengaja selebar mungkin: yang ditunggu bukan "section
         keluar viewport" melainkan "section benar-benar jauh", supaya penampil
         tidak dilepas-pasang tiap kali pengunjung menggulir bolak-balik di
         perbatasannya. Menembak sekali per lintasan, bukan tiap frame. */
      ScrollTrigger.create({
        trigger: node,
        start: "top bottom",
        end: "bottom top",
        onLeave: () => setReleased(true),
        onEnterBack: () => setReleased(false),
      });

      gsap.set("[data-obj-card]", { opacity: 0 });

      gsap
        .timeline({
          defaults: { ease: EASE.enter },
          scrollTrigger: { trigger: node, start: "top 72%", once: true },
        })
        .from("[data-reveal]", { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.09 }, 0)
        .from("[data-obj-frame]", { autoAlpha: 0, y: 26, scale: 0.97, duration: 0.85 }, 0.15)
        /* Beam baru boleh diukur di sini, dan tidak sedetik pun lebih awal. */
        .add(() => setBuilt(true))
        .to("[data-obj-card]", { opacity: 1, duration: 0.5, stagger: 0.18 }, ">+=0.45");
    },
    root,
    [],
  );

  return (
    <section
      ref={root}
      id="yang-hilang"
      aria-labelledby="a-relic-title"
      className="relative py-24 sm:py-32"
    >
      <div className="shell grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* ══ Kiri — kenapa object ini ada di sini ══════════════════ */}
        <div className="lg:col-span-4">
          <span data-reveal aria-hidden="true" className="carved-edge" />
          <p data-reveal className="kicker mt-4">
            {A_COPY.lossKicker[locale]}
          </p>
          <h2
            data-reveal
            id="a-relic-title"
            className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-5xl"
          >
            {A_COPY.lossTitle[locale]}
          </h2>
          <p data-reveal className="mt-5 text-sm leading-[1.75] text-ink-muted">
            {A_COPY.lossBody[locale]}
          </p>
          <p data-reveal className="mt-5 text-sm leading-[1.75] text-ink-dim italic">
            {A_COPY.lossClose[locale]}
          </p>
          <div data-reveal className="mt-8">
            <Link href={`/heritage/${heritage.slug}`} className={buttonClass()}>
              {dict.landing.heroPrimary}
            </Link>
          </div>
        </div>

        {/* ══ Kanan — object, wadahnya, dan tiga keterangannya ══════ */}
        <div ref={stage} className="relative lg:col-span-8">
          {/* Pita di sekeliling wadah tempat ketiga kartu duduk. Hanya ada dari
              `lg` ke atas: di bawah itu kartunya kembali ke aliran normal, dan
              pita kosong hanya akan memangkas lebar penampil tanpa alasan. */}
          <div className="lg:px-[9.5rem] lg:py-12">
            <div
              ref={viewerGate}
              data-obj-frame
              data-beam="a-obj-frame"
              className="overflow-hidden rounded-2xl border border-line"
            >
              <HeritageViewer
                heritage={heritage}
                defer
                initialAutoRotate
                initialHotspots={false}
                released={released || (still && !visible)}
                idleLabel={dict.landing.stageIdle}
              />
            </div>
          </div>

          {/* `lg:contents` membuat pembungkus ini berhenti jadi kotak pada layar
              lebar, sehingga ketiga kartu di dalamnya diposisikan terhadap
              `stage` — bukan terhadap pembungkusnya. Di bawah `lg` ia kembali
              jadi baris biasa di bawah penampil. */}
          <div className="mt-5 flex flex-wrap gap-2 lg:contents">
            <MetadataChip
              data-obj-card
              data-beam="a-obj-coord"
              className="lg:absolute lg:top-0 lg:right-0 lg:w-[8.75rem]"
              label={A_COPY.coordinateLabel[locale]}
              value={coordinate}
              tone="mark"
              size="sm"
            />
            <MetadataChip
              data-obj-card
              data-beam="a-obj-period"
              className="lg:absolute lg:top-0 lg:left-0 lg:w-[8.75rem]"
              label={dict.heritage.period}
              value={heritage.period[locale]}
            />
            <MetadataChip
              data-obj-card
              data-beam="a-obj-civ"
              className="lg:absolute lg:bottom-0 lg:left-0 lg:w-[8.75rem]"
              label={dict.heritage.civilization}
              value={heritage.civilization[locale]}
            />
          </div>

          {/* Garis hanya ada di layar lebar.

              Pada 375px ketiga kartu duduk di bawah penampil dalam aliran
              normal, dan siku 90 derajat di antara mereka akan melintasi teks —
              yang dilarang aturan beam project ini. Hubungannya tetap
              tersampaikan di sana lewat kedekatan dan label, persis seperti yang
              dituntut: apa pun yang dikatakan garis wajib juga ada sebagai teks
              di DOM. */}
          {built && tier === "full" ? (
            <BeamField
              container={stage}
              links={ELBOWS}
              variant="leader"
              className="z-[1] text-gold-dim"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
