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
import { useHandoff } from "./handoff";
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
  const { seal } = useHandoff();
  const [viewerGate, { visible }] = useInView<HTMLDivElement>({ rootMargin: "200px" });

  const [lat, lon] = heritage.coordinates;
  const coordinate = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}  ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;

  useScrollScene(
    ({ still }, node) => {
      /* Gerak dikurangi: tidak satu pun ScrollTrigger dipasang. Kartu tetap
         terlihat penuh dan wadah tetap di tempatnya — yang dilepas hanya
         urutan perakitannya, bukan satu pun isinya. */
      if (still) {
        /* Tidak satu pun ScrollTrigger dipasang, jadi tidak ada yang akan
           membuka komposisi nanti — ia wajib sudah terbuka sekarang. Panel
           cahaya disembunyikan lewat CSS (`motion-reduce:hidden`) karena di
           sini kedua kelompok berdiri berurutan dalam aliran biasa, dan bidang
           yang menutup tidak punya pekerjaan. */
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

      /* Keadaan awal dipasang GSAP, bukan CSS. Tanpa JavaScript seluruh
         komposisi tetap berdiri terbaca alih-alih hilang sama sekali. */
      gsap.set(node.querySelectorAll("[data-obj-card]"), { opacity: 0 });
      gsap.set(node.querySelector("[data-build]"), { autoAlpha: 0 });
      gsap.set(node.querySelector('[data-light="left"]'), { xPercent: -101 });
      gsap.set(node.querySelector('[data-light="right"]'), { xPercent: 101 });

      /* ── DUA PICU BERANTAI, keduanya BERBASIS WAKTU ──────────────────
         Bukan ter-scrub, dan itu seluruh perbaikannya.

         Selama penutupan digerakkan gulir, melihat komposisi berikutnya selalu
         menuntut gulir tambahan — tiga sesi dipakai memangkas jaraknya dari
         949px ke 463px ke 120px, dan ia tidak pernah bisa sampai nol. Begitu ia
         dipicu lalu berjalan sendiri atas waktu, jaraknya nol menurut definisi:
         pengguna berhenti menggulir, dan sisanya terjadi.

             picu 1   kelompok satu berakhir  →  bidang menutup dari dua sisi
             picu 2   bidang tertutup penuh   →  "Yang Hilang" dirakit

         Rantainya dibuat dengan `onComplete`, bukan dengan menumpuk keduanya
         pada satu timeline berlabel waktu: yang kedua HARUS mulai dari keadaan
         akhir yang pertama, dan `onComplete` menjaminnya bahkan ketika
         kecepatannya diubah di tengah jalan — lihat percepatan di bawah.

         `once` karena ia perakitan, bukan keadaan. Sesuatu yang dirakit ulang
         tiap kali dilewati berhenti terbaca sebagai sesuatu yang dibangun.

         Di-*ease*, bukan linear. Aturan "scrub wajib linear" berlaku bagi yang
         terikat gulir supaya bisa ditelusuri balik persis; timeline ini tidak
         terikat gulir, jadi easing justru yang benar. */

      const assemble = gsap.timeline({ paused: true, defaults: { ease: EASE.enter } });
      assemble
        /* 1 · wadah dan objectnya. Subjeknya lebih dulu; kartu dan garis
           sesudahnya melekat padanya, jadi ia yang harus ada duluan. */
        .from("[data-obj-frame]", { autoAlpha: 0, y: 22, scale: 0.97, duration: 0.7 }, 0)
        /* 2 · tiga kartu keterangan, `opacity` SAJA — lihat jebakan kedua di
           kepala berkas ini. */
        .to("[data-obj-card]", { opacity: 1, duration: 0.45, stagger: 0.14 }, 0.45)
        /* 3 · garis baru boleh diukur setelah ketiga kartunya berdiri diam. */
        .add(() => setBuilt(true), 1.1)
        /* 4 · teks kiri, terakhir. */
        .from("[data-reveal]", { autoAlpha: 0, y: 22, duration: 0.6, stagger: 0.08 }, 1.35);

      const close = gsap.timeline({
        paused: true,
        defaults: { ease: EASE.enter },
        onComplete: () => {
          /* Globe dilepas PERSIS di sini: bidangnya sudah menutup penuh, jadi
             melepasnya tidak terlihat sama sekali. Ini juga satu-satunya tempat
             yang TAHU kapan itu terjadi — ambang gulir tidak pernah terlewati
             kalau pengguna berhenti menggulir di titik picu. */
          seal();
          assemble.play();
        },
      });
      close
        .to('[data-light="left"]', { xPercent: 0, duration: 0.85 }, 0)
        .to('[data-light="right"]', { xPercent: 0, duration: 0.85 }, 0)
        /* Komposisi dibuka SETELAH bidangnya penuh — kalau tidak, ia terlihat
           sekejap di atas globe yang belum tertutup. */
        .set(node.querySelector("[data-build]"), { autoAlpha: 1 });

      ScrollTrigger.create({
        trigger: node,
        start: "top top",
        once: true,
        onEnter: () => close.play(),
      });

      /* ── Menggulir MEMPERCEPAT, bukan ditahan ────────────────────────
         Pemilik project memilih ini ketimbang memaku panggung sampai rangkaian
         selesai, dan pilihannya tepat: halaman yang menolak bergerak saat
         digulir terasa rusak, bukan terasa sinematik. §4 juga melarang
         mencegat `wheel`/`touch` untuk memaksa urutan.

         Jadi gulir tidak dihalangi — ia mengubah KECEPATAN. Makin cepat
         digulir, makin cepat rangkaiannya selesai; berhenti menggulir, ia
         berjalan pada kecepatan normal sampai tuntas. Pengguna yang buru-buru
         tidak pernah tertahan, dan pengguna yang diam tetap melihat semuanya.

         Kecepatannya mengendap kembali ke 1 lewat `delayedCall` yang
         diperbarui tiap update: tanpa itu, satu sentakan roda akan meninggalkan
         timeline berlari empat kali lipat sampai habis. */
      let decay: gsap.core.Tween | undefined;
      ScrollTrigger.create({
        trigger: node,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          const running = close.isActive() ? close : assemble.isActive() ? assemble : null;
          if (!running) return;
          running.timeScale(1 + Math.min(3, Math.abs(self.getVelocity()) / 900));
          decay?.kill();
          decay = gsap.delayedCall(0.18, () => running.timeScale(1));
        },
      });
    },
    root,
    [seal],
  );

  return (
    <section
      ref={root}
      id="yang-hilang"
      aria-labelledby="a-relic-title"
      /* Bantalan atas dipangkas habis-habisan, dan itu bukan penghematan ruang
         melainkan syarat sambungan.

         Bidang cahaya yang menutup di ujung penyelaman sudah menyediakan ruang
         napas di atas section ini. Membayar bantalan penuh lagi di sini berarti
         membayar dua kali untuk kekosongan yang sama — dan kekosongan kedua itu
         persis yang dikeluhkan: setelah cahaya menutup, masih harus digulir
         sebelum ada yang terbaca. */
      /* **KELOMPOK DUA, ditarik naik menumpuk di atas ekor kelompok satu.**

         `-mt` negatifnya setengah tinggi kelompok satu, dan angka itu
         berpasangan dengan `HANDOFF` di `dive-beats.ts` — turunannya satu baris:
         puncak kelompok ini menyentuh atas layar pada gulir `D + M`, sementara
         globe selesai zoom pada `HANDOFF x D`. Menyamakan keduanya memberi
         `M = -(1 - HANDOFF) x D`, yaitu setengahnya pada HANDOFF 0,5.

         Karena kelompok ini datang SESUDAH kelompok satu di DOM, panggungnya
         menggambar di atas panggung sana tanpa satu `z-index` pun yang perlu
         diadu — jadi panel cahayanya menutupi globe begitu saja.

         Tingginya memberi ruang bagi rangkaian untuk selesai sebelum panggung
         lepas. Ia TIDAK menahan siapa pun: menggulir di dalamnya mempercepat
         rangkaiannya, bukan dihalangi.

         Seluruhnya `motion-safe:`. Saat gerak dikurangi tidak satu pun
         ScrollTrigger dipasang, jadi kedua kelompok wajib kembali berdiri
         berurutan dalam aliran biasa — tumpang tindih tanpa animasi yang
         membukanya cuma akan menyembunyikan satu kelompok di balik yang lain. */
      className="relative motion-safe:-mt-[105svh] motion-safe:h-[185svh] md:motion-safe:-mt-[130svh] md:motion-safe:h-[210svh] motion-reduce:pt-2 motion-reduce:pb-24 sm:motion-reduce:pt-3 sm:motion-reduce:pb-32"
    >
      <div className="flex items-center overflow-hidden motion-safe:sticky motion-safe:top-0 motion-safe:h-svh">
      {/* Panel cahaya — milik KELOMPOK DUA, bukan kelompok satu.

          Di sana ia menutup pada bingkai hero, lalu komposisi ini tetap harus
          digulir untuk didatangi. Di sini ia menutup pada bingkai yang SAMA
          dengan tempat komposisi dirakit, dan itu yang membuat jaraknya nol.

          Lebarnya 62% dengan bagian pekat sampai 82% — aritmetika yang sudah
          terbukti di `globals.css`: 0,82 x 62% = 50,8% layar, jadi kedua bidang
          PEKAT sudah melewati tengah sebelum bertemu, dan ujung yang melandai
          hanya pernah jatuh di atas bagian pekat panel seberangnya. Dua gradien
          yang sama-sama melandai TIDAK boleh bertemu di tengah: hasilnya 75%,
          bukan 100%, dan yang terlihat pita lebih gelap persis di garis temunya.

          Keduanya digerakkan `transform` saja; §4 melarang menganimasikan
          `width` atau `left`. */}
      <div
        data-light="left"
        aria-hidden="true"
        className="light-wipe-l pointer-events-none absolute inset-y-0 left-0 z-0 w-[62%] motion-reduce:hidden"
      />
      <div
        data-light="right"
        aria-hidden="true"
        className="light-wipe-r pointer-events-none absolute inset-y-0 right-0 z-0 w-[62%] motion-reduce:hidden"
      />

      {/* `lg:items-start`, bukan `items-center`.

          Kolom kanan memuat penampil 3D yang tinggi, dan memusatkan kolom kiri
          terhadapnya mendorong judul jauh ke tengah section — terukur 178px di
          bawah puncaknya. Ditambah bantalan dan pemicu yang terlambat, jaraknya
          jadi 463px: hampir satu layar penuh cahaya kosong antara bidang yang
          menutup dan judul yang seharusnya berdiri di atasnya.

          Merapatkannya ke puncak TIDAK mengubah susunan section — teks tetap di
          kiri, object tetap di kanan. Yang bergeser cuma perataan vertikalnya.
          Di bawah `lg` susunannya sudah bertumpuk, jadi ponsel tidak tersentuh
          sama sekali. */}
      {/* TANPA `w-full`: di dalam panggung yang `flex`, `w-full` menimpa lebar
          milik `.shell` sehingga kisinya melebar dari tepi ke tepi layar —
          terukur, teks kiri terpotong dan kartu koordinat menggantung keluar.
          `.shell` sudah punya lebar dan `margin-inline: auto` sendiri, dan
          margin auto memang memusatkan item flex. */}
      <div
        data-build
        className="shell relative z-10 grid items-center gap-6 sm:gap-12 lg:grid-cols-12 lg:items-start lg:gap-8"
      >
        {/* ══ Kiri — kenapa object ini ada di sini ══════════════════ */}
        <div className="lg:col-span-4">
          <span data-reveal aria-hidden="true" className="carved-edge" />
          <p data-reveal className="kicker mt-3">
            {A_COPY.lossKicker[locale]}
          </p>
          <h2
            data-reveal
            id="a-relic-title"
            className="mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-5xl"
          >
            {A_COPY.lossTitle[locale]}
          </h2>
          <p data-reveal className="mt-5 text-sm leading-[1.75] text-ink-muted">
            {A_COPY.lossBody[locale]}
          </p>
          {/* Kalimat penutup disembunyikan di bawah `lg`.

              Komposisi ini kini berdiri di satu layar, dan terukur pada 375x780
              ia setinggi 857px — lebih tinggi daripada layarnya. Dua keterangan
              pendukung dilepas supaya judul, paragraf utama, object, dan CTA-nya
              muat utuh. Yang hilang pendukung, bukan isi. */}
          <p data-reveal className="mt-5 hidden text-sm leading-[1.75] text-ink-dim italic lg:block">
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
          {/* Ketiga kartu keterangan juga hanya dari `lg` ke atas — alasan yang
              sama, dan tanpa biaya: garis beam memang tidak pernah digambar di
              bawah `lg`, jadi menyembunyikan kartunya tidak menghapus satu garis
              pun. Koordinat, periode, dan peradaban tetap lengkap satu ketukan
              jauhnya di halaman warisan. */}
          <div className="mt-5 hidden flex-wrap gap-2 lg:contents">
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
      </div>
    </section>
  );
}
