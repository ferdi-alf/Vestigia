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
import { useMediaQuery } from "@/lib/motion/use-media-query";
import { cn } from "@/lib/cn";
import { EASE, ScrollTrigger, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { setNavOpened } from "@/lib/motion/nav-shell";
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
/**
 * Pengali kecepatan seluruh rangkaian serah terima.
 *
 * Satu angka, bukan dua belas durasi yang disetel satu per satu — dan itu
 * disengaja. Urutan dan jarak antar beat sudah benar; yang diminta pemilik
 * project cuma "sedikit naikkan kecepatannya". Menyetel tiap durasi berarti
 * membuka peluang salah satunya bergeser relatif terhadap yang lain, dan
 * hubungan antar beat di sini BUKAN selera: garis baru boleh diukur setelah
 * kartunya diam, dan globe baru boleh dilepas setelah bidangnya pekat.
 *
 * Berlaku untuk kedua arah. `timeScale` mengatur besar kecepatan, bukan
 * tandanya, jadi pembongkaran ikut naik seirama tanpa berbalik arah.
 *
 * Pada 1,35 rangkaian penuh turun dari sekitar 2,8 detik ke 2,1 detik.
 */
const PACE = 1.35;

/**
 * Pita gulir tempat pembongkaran terjadi, pecahan tinggi layar DI ATAS titik
 * picu.
 *
 * Ia ada karena pembongkaran berbasis waktu terbukti TIDAK PERNAH TERLIHAT, dan
 * sebabnya geometri, bukan durasi.
 *
 * Panggung "Yang Hilang" lengket hanya SELAMA section-nya menaungi puncak layar.
 * Begitu pengguna menggulir ke atas melewati titik picu, panggung itu langsung
 * meluncur turun bersama halamannya — dan rangkaian yang butuh dua detik untuk
 * membongkar diri menghabiskan sebagian besar waktunya di luar bingkai. Terukur
 * dengan gulir roda sungguhan: satu sentakan roda memindahkan 100 piksel dalam
 * sepersekian detik, jadi seluruh adegan pembongkaran selesai ketika panggungnya
 * tinggal sepertiga layar.
 *
 * Diikat ke gulir, ia tidak bisa dilewati: maju satu piksel ke atas berarti satu
 * langkah pembongkaran, dan berhenti berarti adegannya berhenti di situ juga.
 * Menggulir balik ke bawah menelusurinya persis — §6 memang menuntut itu untuk
 * apa pun yang terikat gulir.
 *
 * Perakitannya TIDAK ikut diikat gulir. Arah itu sudah benar dan sudah tiga sesi
 * diperjuangkan: dipicu sekali lalu berjalan sendiri, supaya berhenti menggulir
 * di titik picu tetap memperlihatkan seluruhnya.
 */
const UNWIND_BAND = 0.55;

const ELBOWS: BeamLink[] = [
  { from: "a-obj-coord", to: "a-obj-frame", shape: "elbow", elbow: "vertical-first", toEdgeAt: 0.34, delay: 0 },
  { from: "a-obj-period", to: "a-obj-frame", shape: "elbow", elbow: "vertical-first", toEdgeAt: 0.3, delay: 0.18 },
  { from: "a-obj-civ", to: "a-obj-frame", shape: "elbow", elbow: "vertical-first", toEdgeAt: 0.78, delay: 0.36 },
];

/**
 * Versi ponsel: tiga penunjuk LURUS, bukan siku.
 *
 * **Sikunya dibuang karena di lebar ponsel ia berhenti punya arti, bukan karena
 * ia tidak muat.** Sebuah siku 90 derajat mengatakan "berangkat dari sini,
 * belok, masuk di sana" — kalimat yang hanya bisa diucapkan kalau ada ruang di
 * SAMPING wadahnya untuk dibeloki. Pada 343 piksel wadah objectnya selebar
 * layar; tidak ada tepi luar untuk ditempati, dan ketiga kartu berdiri tepat di
 * bawahnya. Siku yang dipaksakan di sana akan berbelok DI ATAS wadahnya sendiri
 * atau berbalik menyeberangi kartunya — keduanya terbaca sebagai coretan.
 *
 * Yang benar untuk dua benda yang bertetangga langsung adalah penunjuk lurus,
 * dan `BeamField` sudah bisa menggambarnya: `shape` bawaannya busur, dan busur
 * dengan `curvature: 0` adalah garis lurus yang kedua ujungnya tetap dipotong
 * ke TEPI kotaknya masing-masing. Ketiganya sedikit menguncup ke arah pusat
 * wadah karena tiap garis dibidik dari pusat kartunya ke pusat wadah, dan
 * kuncup itulah yang membuat ketiganya terbaca menunjuk pada satu benda yang
 * sama.
 */
/**
 * Ambang TATA LETAK, bukan ambang gerak.
 *
 * Kartu keterangan baru pindah ke sudut wadah pada `lg:`, yaitu 1024px, sementara
 * `useMotionTier` berganti tingkat pada 768px. Memakai ambang gerak untuk memilih
 * bentuk garis menghasilkan cacat yang terukur: di antara 768 dan 1024 piksel,
 * garis bersiku digambar ke kartu yang pada lebar itu masih `display: none`, dan
 * kotak yang tidak dirender mengembalikan rect nol — ketiga garisnya berangkat
 * dari sudut kiri atas panggung.
 */
const WIDE = "(min-width: 1024px)";

/**
 * Ambang TINGGI tempat baris keterangan masih muat.
 *
 * Komposisi ini dipaku ke satu layar, jadi apa pun yang ditambahkan padanya
 * harus dibayar dari tinggi yang ada — dan sejak ada bantalan 80 piksel untuk
 * membebaskannya dari navbar, yang tersedia tinggal `svh - 80`.
 *
 * Terukur pada lebar 382: tanpa baris keterangan komposisinya 565 piksel,
 * dengan baris itu beserta jaraknya 684. Yang kedua menuntut layar setinggi
 * 764 piksel; di bawah itu panggung lengketnya memusatkan isi lalu memangkas
 * KEDUA ujungnya, jadi yang hilang bukan cuma kartunya melainkan juga garis
 * pembuka section di atas.
 *
 * **Lebarnya ikut dibatasi, dan itu bukan kehati-hatian berlebihan.** Tinggi
 * komposisi ini TUMBUH bersama lebar layar: di bawah `lg` object mengisi satu
 * kolom penuh, jadi wadahnya setinggi tiga perempat lebar itu. Terukur pada
 * 890x800 — lebar yang masih di bawah `lg` — komposisinya 868 piksel, terpotong
 * meski layarnya tinggi. Ambang tinggi saja tidak pernah bisa menangkap itu.
 *
 * 440px adalah batas atas ponsel sungguhan; di atasnya susunan satu kolom ini
 * memang tidak pernah punya ruang untuk baris tambahan apa pun.
 *
 * Jadi baris keterangan dan garisnya hanya dipasang di layar yang benar-benar
 * punya ruangnya. Di layar lain komposisinya kembali persis seperti sebelumnya
 * — bukan versi yang dipangkas, melainkan versi yang memang sudah terbukti
 * muat. Koordinat, periode, dan peradaban tetap lengkap satu ketukan jauhnya di
 * halaman warisan.
 */
const ROOMY = "(max-width: 440px) and (min-height: 770px)";

const LEADERS: BeamLink[] = [
  { from: "a-obj-coord", to: "a-obj-frame", curvature: 0, delay: 0 },
  { from: "a-obj-period", to: "a-obj-frame", curvature: 0, delay: 0.14 },
  { from: "a-obj-civ", to: "a-obj-frame", curvature: 0, delay: 0.28 },
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
  const wide = useMediaQuery(WIDE);
  const roomy = useMediaQuery(ROOMY);
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
  const { setSealed } = useHandoff();
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
         perbatasannya. Menembak sekali per lintasan, bukan tiap frame.

         **Empat sisi, bukan dua.** Versi pertama cuma melepas penampil saat
         section ini jauh DI ATAS layar. Itu cukup selama menggulir balik tidak
         pernah mengembalikan apa pun: globe kelompok satu tetap terlepas, jadi
         satu-satunya cara menumpuk konteks adalah lewat bawah.

         Sejak serah terima bisa dibongkar, sisi satunya jadi nyata — pengguna
         bisa berdiri di hero dengan globe hidup lagi sementara penampil ini
         masih terpasang di bawahnya. Terukur: tiga konteks WebGL di satu
         halaman, dan §7 memberi jatah satu. Sekarang ia dilepas di KEDUA arah
         dan dipasang kembali dari kedua arah juga. */
      ScrollTrigger.create({
        trigger: node,
        start: "top bottom",
        end: "bottom top",
        onLeave: () => setReleased(true),
        onEnterBack: () => setReleased(false),
        onLeaveBack: () => setReleased(true),
        onEnter: () => setReleased(false),
      });

      /* Keadaan awal dipasang GSAP, bukan CSS. Tanpa JavaScript seluruh
         komposisi tetap berdiri terbaca alih-alih hilang sama sekali. */
      gsap.set(node.querySelectorAll("[data-obj-card]"), { opacity: 0 });
      gsap.set(node.querySelector("[data-build]"), { autoAlpha: 0 });
      gsap.set(node.querySelector('[data-light="left"]'), { xPercent: -101 });
      gsap.set(node.querySelector('[data-light="right"]'), { xPercent: 101 });

      /* ── SATU RANGKAIAN, DIJALANKAN DUA ARAH ─────────────────────
         Dulu dua timeline berantai lewat `onComplete`, dan pemicunya `once`.
         Konsekuensinya baru terlihat saat digulir BALIK: tidak ada satu pun
         jalan untuk membatalkannya. Bidang cahaya tinggal tertutup, komposisi
         tinggal terakit, globe sudah dilepas dan tidak pernah dipasang lagi —
         jadi menggulir ke atas mendarat di hero yang kosong.

         Satu timeline yang sama, dijalankan mundur, mengembalikan seluruhnya
         tanpa satu baris koreografi kedua: teks pergi, kartu padam, wadah
         mundur, navbar terangkat, lalu bidangnya membuka. Urutannya jatuh
         sendiri dari cermin urutan maju — dan urutan itu persis yang diminta.

             maju     bidang menutup -> wadah -> navbar turun -> kartu
                      -> garis -> teks
             mundur   teks -> garis -> kartu -> globe dipasang lagi
                      -> navbar naik -> wadah -> bidang membuka

         `once` karena itu dilepas. Maju dipicu sekali lalu berjalan atas waktu;
         mundur diikat ke gulir lewat pita di bawah — lihat `UNWIND_BAND` untuk
         kenapa mundur TIDAK boleh berbasis waktu. Keduanya menggerakkan
         playhead timeline yang SAMA, jadi tidak pernah ada dua keadaan yang
         bisa berbeda pendapat.

         Di-*ease*, bukan linear. Aturan "scrub wajib linear" berlaku bagi yang
         terikat gulir supaya bisa ditelusuri balik persis; rangkaian ini tidak
         terikat gulir — ia dipicu sekali lalu berjalan atas waktu — jadi
         easing justru yang benar. */
      const handoff = gsap.timeline({ paused: true, defaults: { ease: EASE.enter } });

      /**
       * Penanda yang tahu arah.
       *
       * `tl.call()` dan `tl.add(fn)` hanya menembak saat playhead lewat KE
       * DEPAN; mundur, keduanya diam. Rangkaian ini memang dijalankan mundur,
       * jadi tiap keputusan yang harus bisa dibatalkan ditulis sebagai tween
       * sungguhan pada object kosong — cukup panjang untuk punya awal dan
       * akhir, sehingga `onComplete` dan `onReverseComplete` keduanya dijamin
       * menembak.
       *
       * Panjangnya bukan hiasan: ia jarak antara keputusan maju dan keputusan
       * mundur. Segel dibatalkan lebih dulu daripada bidang cahaya membuka,
       * dan jarak itulah yang memberi globe waktu terpasang di balik bidang
       * yang masih tertutup alih-alih muncul mendadak di depan mata.
       */
      const gate = (at: number, span: number, forward: () => void, backward: () => void) => {
        const box = { v: 0 };
        handoff.fromTo(
          box,
          { v: 0 },
          { v: 1, duration: span, ease: "none", onComplete: forward, onReverseComplete: backward },
          at,
        );
      };

      handoff
        /* 1 - bidang cahaya menutup dari dua sisi. */
        .to('[data-light="left"]', { xPercent: 0, duration: 0.85 }, 0)
        .to('[data-light="right"]', { xPercent: 0, duration: 0.85 }, 0)
        /* Komposisi dibuka SETELAH bidangnya penuh — kalau tidak, ia terlihat
           sekejap di atas globe yang belum tertutup. */
        .set(node.querySelector("[data-build]"), { autoAlpha: 1 }, 0.85)
        /* 2 - wadah dan objectnya. Subjeknya lebih dulu; kartu dan garis
           sesudahnya melekat padanya, jadi ia yang harus ada duluan. */
        .from("[data-obj-frame]", { autoAlpha: 0, y: 22, scale: 0.97, duration: 0.7 }, 0.85)
        /* 3 - tiga kartu keterangan, `opacity` SAJA — lihat jebakan kedua di
           kepala berkas ini. */
        .to("[data-obj-card]", { opacity: 1, duration: 0.45, stagger: 0.14 }, 1.3)
        /* 4 - teks kiri, terakhir. */
        .from("[data-reveal]", { autoAlpha: 0, y: 22, duration: 0.6, stagger: 0.08 }, 2.2);

      /* Globe dilepas saat bidangnya sudah menutup penuh, dan dipasang kembali
         seperempat detik SEBELUM bidang itu mulai membuka lagi. Keduanya
         terjadi di balik permukaan yang pekat, jadi tidak satu pun terlihat.

         Ini juga satu-satunya tempat yang TAHU kapan itu terjadi: ambang gulir
         tidak pernah terlewati kalau pengguna berhenti menggulir tepat di titik
         picu, dan berhenti di situ memang yang diminta terjadi. */
      gate(1.1, 0.25, () => setSealed(true), () => setSealed(false));

      /* Garis baru boleh diukur setelah ketiga kartunya berdiri diam, dan
         dilepas lagi sebelum kartunya bergerak mundur. */
      gate(1.75, 0.2, () => setBuilt(true), () => setBuilt(false));

      /* Navbar turun BERSAMA komposisi, bukan menunggu digulir.

         Sebelumnya ia dikembalikan film penyelaman yang ter-scrub pada
         `STATE.enter.from`, yang berarti baru penuh setelah seperempat section
         digulir lagi — padahal justru di titik ini seluruh sisa halaman dibuka,
         dan halaman yang membuka dirinya tanpa navigasi adalah halaman yang
         meminta digulir balik.

         Yang dilaporkan KEADAAN — "kelompok dua terbuka" — bukan perintah
         "tampilkan navbar", dan perbedaan itu bukan gaya penulisan. Dua penulis
         pada `transform` navbar sudah terukur meninggalkannya tersembunyi di
         hero, dan sepasang perintah yang menggantikannya mengulang cacat yang
         sama lewat urutan kedatangan. Lihat `lib/motion/nav-shell`.

         Ambangnya DI ATAS 0,85, tempat bidang cahaya selesai menutup. Maju, ia
         menyala tepat setelah bidangnya penuh; mundur, ia sudah terangkat
         sebelum bidang itu mulai membuka — urutan yang persis diminta. */
      gate(0.9, 0.15, () => setNavOpened(true), () => setNavOpened(false));

      handoff.timeScale(PACE);

      /* ── SATU PEMICU, DUA MESIN ─────────────────────────────
         Rentangnya membentang dari satu pita DI ATAS titik serah terima sampai
         titik itu sendiri, jadi `end` adalah ambang yang selama ini dipakai
         `start: "top top"`.

             onLeave       melewati ambang ke BAWAH  -> rakit, berbasis waktu
             onEnterBack   melewati ambang ke ATAS   -> bongkar, terikat gulir
             onUpdate      di dalam pita             -> playhead = progres gulir
             onLeaveBack   keluar pita ke atas       -> bongkar penuh, dan
                                                        rangkaiannya kembali
                                                        perawan sehingga turun
                                                        berikutnya memutarnya
                                                        lagi dari nol

         **Satu pemicu, bukan dua, dan itu perbaikan terukur.** Versi pertama
         memisahkannya: satu pemicu `top top` untuk kedua lintasan, satu pemicu
         ter-scrub untuk pitanya. Keduanya menggerakkan playhead yang sama, dan
         urutan panggilan di antara dua ScrollTrigger dalam satu pembaruan tidak
         dijamin. Akibatnya bisa dilihat: membongkar lalu menggulir turun lagi
         meninggalkan halaman KOSONG — tirai berhenti di 97% tertutup, komposisi
         tidak pernah dibuka, dan tidak ada satu pun yang bergerak lagi.

         `scrub` juga dicabut. Yang dibutuhkan cuma progres gulir mentah di
         `onUpdate`; `scrub` menambahkan pelicin yang tidak pernah dibaca
         siapa pun di sini dan justru membuat nilai yang terbaca sulit
         diperhitungkan. §6: apa pun yang terikat gulir memakai pemetaan
         langsung. */
      let unwinding = false;

      const unwind = ScrollTrigger.create({
        trigger: node,
        start: () => `top-=${Math.round(window.innerHeight * UNWIND_BAND)} top`,
        end: "top top",
        onLeave: () => {
          unwinding = false;
          handoff.play();
        },
        /* `pause`, bukan `reverse`. Yang menggerakkan playhead ke belakang
           adalah gulir; membiarkan timeline berjalan sendiri di saat yang sama
           berarti dua mesin mendorong satu playhead. */
        onEnterBack: () => {
          unwinding = true;
          handoff.pause();
        },
        onUpdate: (self) => {
          if (unwinding) handoff.progress(self.progress);
        },
        /* Keluar pita ke ATAS: rangkaiannya kembali PERAWAN.

           Di titik ini globe kelompok satu sudah dipasang lagi dan sudah
           terlihat penuh, jadi tidak ada lagi yang menunggu dibongkar — tetapi
           `unwinding` yang dibiarkan hidup punya akibat yang halus dan justru
           itu yang dikeluhkan. Selama ia true, menggulir turun lagi akan
           MENYERET playhead maju lewat `onUpdate`, sehingga komposisinya sudah
           terakit penuh sebelum ambangnya sempat dilintasi. `play()` lalu
           tidak punya apa pun untuk dimainkan, dan animasinya tidak pernah
           muncul untuk kedua kalinya.

           Dimatikan di sini, pita itu berhenti menyeret apa pun pada lintasan
           berikutnya. Turun lagi berarti melewati ambang dengan playhead masih
           di nol, dan yang terjadi persis seperti kunjungan pertama: tirai
           menutup, lalu komposisinya dirakit.

           Membalik arah DI DALAM pita tidak terpengaruh — `unwinding` masih
           true di sana, jadi naik-turun sedikit tetap menelusurinya persis
           seperti yang dituntut §6. Yang mengembalikan keadaan perawan hanya
           benar-benar keluar dari pitanya. */
        onLeaveBack: () => {
          if (!unwinding) return;
          handoff.progress(0);
          unwinding = false;
        },
      });

      /**
       * Mendarat LEWAT ambang tanpa pernah melintasinya.
       *
       * Lintasan adalah satu-satunya hal yang dilaporkan ScrollTrigger, dan itu
       * perilaku yang benar — tetapi ada satu jalan masuk yang tidak melintasi
       * apa pun: tautan jangkar dari halaman lain. Navigasi sisi klien menggulir
       * ke elemennya SEBELUM adegan ini dipasang, jadi pemicunya lahir dalam
       * keadaan sudah terlewat dan tidak punya apa pun untuk dilaporkan.
       *
       * Terukur dari halaman Tentang: gulir mendarat di 991 dengan ambang di
       * 920 — tujuh puluh piksel DI BAWAHNYA — dan tirainya tetap di -936,
       * komposisinya tetap 0. Layar yang didapat pengunjung kosong.
       *
       * Di sini rangkaiannya disetel langsung ke keadaan akhir, tanpa animasi:
       * yang mengklik "Yang Hilang" meminta section itu, bukan meminta menunggu
       * dua detik untuk melihatnya dirakit. Yang menggulir ke sana tetap
       * mendapat perakitannya, karena ia memang melintasi ambangnya.
       *
       * Dicoba dua kali. Urutan antara gulir jangkar dan pemasangan adegan
       * berbeda antara navigasi sisi klien dan muat halaman penuh, dan menebak
       * salah satunya berarti memperbaiki setengah kasus. `delayedCall` dibuat
       * di dalam scope `useGSAP`, jadi ia ikut dibersihkan saat teardown.
       */
      const settle = () => {
        if (unwinding || handoff.progress() > 0) return;
        if (unwind.scroll() <= unwind.end) return;
        handoff.progress(1);
      };
      settle();
      gsap.delayedCall(0.12, settle);

      /* ── Menggulir MEMPERCEPAT, bukan ditahan ────────────────────
         Pemilik project memilih ini ketimbang memaku panggung sampai rangkaian
         selesai, dan pilihannya tepat: halaman yang menolak bergerak saat
         digulir terasa rusak, bukan terasa sinematik. §4 juga melarang
         mencegat `wheel`/`touch` untuk memaksa urutan.

         Jadi gulir tidak dihalangi — ia mengubah KECEPATAN. Makin cepat
         digulir, makin cepat rangkaiannya selesai; berhenti menggulir, ia
         berjalan pada kecepatan normal sampai tuntas. Pengguna yang buru-buru
         tidak pernah tertahan, dan pengguna yang diam tetap melihat semuanya.

         Kecepatannya mengendap kembali lewat `delayedCall` yang diperbarui tiap
         update: tanpa itu, satu sentakan roda akan meninggalkan timeline
         berlari empat kali lipat sampai habis.

         **TANDANYA WAJIB DIPERTAHANKAN, dan mengabaikannya sudah menggigit.**

         `timeScale` di GSAP membawa ARAH, bukan cuma besar kecepatan:
         `reversed()` tidak lain pembacaan `_ts < 0`. Jadi menyetelnya ke angka
         positif tidak sekadar mempercepat rangkaian yang sedang mundur — ia
         MEMBALIKNYA jadi maju lagi.

         Versi pertama blok ini menyetel angka positif, dan komentarnya bahkan
         mengklaim sebaliknya. Terukur di peramban: menggulir balik selagi
         perakitan masih berjalan membuat rangkaian menyelesaikan perakitannya
         alih-alih membongkar — bidang cahaya tinggal tertutup, navbar tinggal
         turun, dan garisnya tetap tergambar meski pengguna sudah jauh di atas
         titik picu. Yang lolos dari uji pertama cuma kasus di mana gulirnya
         berhenti SEBELUM pembongkaran mulai, karena di situ tidak ada satu pun
         `onUpdate` yang menimpanya.

         Arahnya dibaca ulang di tiap panggilan, termasuk di dalam `delayedCall`
         — antara satu update dan endapannya, pengguna bisa berbalik lagi. */
      let decay: gsap.core.Tween | undefined;
      const paced = () => (handoff.reversed() ? -PACE : PACE);
      ScrollTrigger.create({
        trigger: node,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          if (!handoff.isActive()) return;
          handoff.timeScale(paced() * (1 + Math.min(3, Math.abs(self.getVelocity()) / 900)));
          decay?.kill();
          decay = gsap.delayedCall(0.18, () => handoff.timeScale(paced()));
        },
      });
    },
    root,
    [setSealed],
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
      /* `-scroll-mt` NEGATIF, dan itu memperbaiki cacat navigasi yang terukur.

         Tautan "Yang Hilang" mendarat pada puncak section ini, dan puncak itu
         PERSIS titik picu serah terima. `onEnter` ScrollTrigger menembak saat
         ambangnya dilintasi, bukan saat didarati — jadi tautan itu menurunkan
         pengunjung tepat di tempat globe hampir selesai membesar, dengan tirai
         yang tidak pernah menutup dan komposisi yang tidak pernah dirakit.
         Terukur: gulir 922, panel masih di -936, komposisi masih 0. Satu-satunya
         jalan keluar adalah menggulir lagi sedikit, yang persis yang dikeluhkan.

         Margin negatif menggeser titik pendaratannya 10svh ke BAWAH ambang,
         sehingga ambangnya benar-benar dilintasi dan rangkaiannya berjalan.
         Panggungnya lengket sepanjang 110svh pertama section, jadi mendarat
         sedikit lebih dalam tidak menggeser satu piksel pun dari komposisinya.

         `motion-safe:` — tanpa gerak tidak ada ambang untuk dilintasi, dan
         menggeser pendaratan cuma akan memotong kicker dan judulnya. */
      className="relative motion-safe:-scroll-mt-[10svh] motion-safe:-mt-[105svh] motion-safe:h-[185svh] md:motion-safe:-mt-[130svh] md:motion-safe:h-[210svh] motion-reduce:pt-2 motion-reduce:pb-24 sm:motion-reduce:pt-3 sm:motion-reduce:pb-32"
    >
      {/* Bantalan atas di ponsel, dan ia menambal tumpang tindih yang terukur.

          Komposisi ini DIPUSATKAN di panggung lengket setinggi satu layar.
          Navbar mengambang di 12..68 piksel dari puncak layar; pada 382x820
          komposisinya mulai di 41 piksel, jadi garis pembuka section dan
          kickernya duduk persis di bawah navbar dan tidak pernah terlihat.

          Bantalan menggeser titik mulainya setengah nilainya — isi yang
          dipusatkan bergerak `pt/2`, bukan `pt` — jadi 80 piksel memberi
          pergeseran 40 dan membawa puncaknya lewat navbar di semua ukuran
          ponsel yang diuji.

          `lg:` mengembalikannya ke nol: di layar lebar komposisinya sudah jauh
          di bawah navbar, dan bantalan di sana hanya akan menggesernya turun
          tanpa alasan. */}
      <div className="flex items-center overflow-hidden motion-safe:sticky motion-safe:top-0 motion-safe:h-svh motion-safe:pt-20 lg:motion-safe:pt-0">
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
                /* 16:10 di ponsel, bukan 4:3. Selisihnya 43 piksel pada lebar
                   350, dan 43 piksel itulah yang membayar jarak bebas navbar
                   tanpa memaksa baris keterangan ikut disembunyikan lagi.
                   Rasio `lg:` dibiarkan persis seperti sebelumnya. */
                aspect="aspect-[16/10] lg:aspect-[16/9]"
                released={released || (still && !visible)}
                idleLabel={dict.landing.stageIdle}
              />
            </div>
          </div>

          {/* `lg:contents` membuat pembungkus ini berhenti jadi kotak pada layar
              lebar, sehingga ketiga kartu di dalamnya diposisikan terhadap
              `stage` — bukan terhadap pembungkusnya. Di bawah `lg` ia kembali
              jadi baris biasa di bawah penampil.

              **Ketiganya TIDAK lagi disembunyikan di ponsel.** Dulu begitu,
              dengan alasan yang waktu itu benar: komposisi ini dipaku ke satu
              layar, dan tanpa garis beam yang digambar di sana kartunya memang
              tidak menghubungkan apa pun. Sejak beam ikut dirender di ponsel,
              kartu-kartu itu adalah UJUNGNYA — menyembunyikannya berarti
              menggambar tiga garis yang menunjuk ke ketiadaan.

              `mt-8`, bukan `mt-5`: jarak itu yang JADI panjang garisnya — tepi
              kartu ke tepi wadah 32 piksel, dikurangi renggang 4 piksel di tiap
              ujung, menyisakan garis 24 piksel. Pada `mt-5` yang lama garisnya
              tinggal 12 piksel, dan garis sependek itu tidak terbaca sebagai
              hubungan melainkan sebagai cacat render.

              Tidak lebih dari 32 karena tiap piksel di sini dibayar dari tinggi
              yang sama yang dipakai jarak bebas navbar — lihat `ROOMY`. */}
          <div
            className={cn(
              "lg:contents",
              roomy ? "mt-8 grid grid-cols-3 gap-1.5" : "hidden",
            )}
          >
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

          {/* Garis digambar di KEDUA lebar, dengan geometri yang berbeda.

              Siku dari `lg:` ke atas, penunjuk lurus di bawahnya — lihat
              `LEADERS` untuk kenapa siku di lebar ponsel berhenti punya arti,
              dan `WIDE` untuk kenapa ambangnya 1024 dan bukan 768.

              `roomy` menjaga agar keduanya tidak pernah menunjuk ke kartu yang
              disembunyikan karena layarnya terlalu pendek — lihat `ROOMY`.

              `still` tetap tidak menggambar apa pun: di sana tidak ada satu pun
              ScrollTrigger yang dipasang, jadi tidak ada urutan perakitan untuk
              diikuti garisnya, dan sebuah garis yang muncul begitu saja tanpa
              digambar adalah dekorasi. Hubungannya tetap tersampaikan lewat
              kedekatan dan label — apa pun yang dikatakan garis wajib juga ada
              sebagai teks di DOM. */}
          {built && tier !== "still" && (wide || roomy) ? (
            <BeamField
              container={stage}
              links={wide ? ELBOWS : LEADERS}
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
