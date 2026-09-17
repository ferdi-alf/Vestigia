"use client";

import type { RefObject } from "react";
import type { DiveProgress } from "@/components/three/globe-stage";
import { SCRUB, STATE, STILL_PROGRESS } from "./dive-beats";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";

/**
 * Film pembuka.
 *
 * Satu timeline ter-scrub memegang SELURUH DOM di dalam panggung lengket, dan
 * panggung 3D memegang kamera dan globe. Keduanya bertemu hanya lewat satu kotak
 * berisi dua angka — `value` dari gulir, `intro` dari waktu.
 *
 * **CSS `sticky` memiliki posisi, GSAP hanya memiliki progres.** Tidak ada `pin`
 * di mana pun — dua sistem yang sama-sama memiliki posisi sudah pernah menyita
 * satu sesi di project ini.
 *
 * Rentangnya `top top` sampai `bottom top`: progres 1 jatuh saat section
 * benar-benar habis dari layar, bukan saat panggungnya mulai meluncur. Lihat
 * catatan panjang di `end` di bawah untuk kenapa perbedaan itu menentukan.
 *
 * ---
 *
 * **TANPA VIDEO.** Yang hilang bersamanya: kedua panel tirai, kerai
 * keterbacaan, dan jendela video. Tidak ada lagi yang perlu disapu bersih dan
 * tidak ada lagi yang perlu dijaga keterbacaannya — teks berdiri di atas kertas
 * sejak bingkai pertama. Yang tersisa satu subjek: globe.
 */
export function useDiveFilm(
  scope: RefObject<HTMLElement | null>,
  /**
   * Terbitkan angka ke kotak progres.
   *
   * Sebuah fungsi, bukan ref — dan itu bukan kosmetik. Hook ini tidak
   * membutuhkan kotaknya; ia hanya butuh cara mengumumkan. Menerima ref berarti
   * hook menulis ke dalam argumennya sendiri, yang ditolak
   * `react-hooks/immutability` dan yang memang layak ditolak: pemilik kotak itu
   * `Dive`, dan film hanya penyewa.
   *
   * Menerima PATCH dan bukan satu angka karena ada dua sumber yang berbeda
   * sifatnya: `value` digerakkan gulir dan bisa dibalik, `intro` digerakkan
   * waktu dan hanya berjalan sekali. Keduanya tinggal di kotak yang sama supaya
   * panggung 3D tetap punya satu tempat untuk dibaca.
   */
  publish: (patch: Partial<DiveProgress>) => void,
  /**
   * Umumkan bahwa panggung sudah benar-benar dilewati, atau dimasuki lagi.
   *
   * Dipakai `Dive` untuk MELEPAS kanvas globe — bukan sekadar menghentikannya —
   * sehingga hanya ada satu konteks WebGL hidup ketika section di bawahnya
   * memasang penampil warisannya sendiri. §7 menuntut satu konteks per halaman.
   *
   * `onLeave` dan `onEnterBack` menembak SEKALI per lintasan, bukan tiap frame,
   * jadi larangan `setState` di dalam handler scroll tidak dilanggar.
   */
  onPassed: (passed: boolean) => void,
) {
  useScrollScene(
    ({ compact, still }, node) => {
      const q = <T extends Element>(sel: string) => gsap.utils.toArray<T>(sel, node);


      const hero = node.querySelector<HTMLElement>("[data-dive-hero]");
      const bridge = node.querySelector<HTMLElement>("[data-dive-bridge]");
      const hint = node.querySelector<HTMLElement>("[data-dive-hint]");
      const dust = node.querySelector<HTMLElement>("[data-dive-dust]");
      const layers = q<HTMLElement>("[data-layer]");

      /* Navbar tinggal DI LUAR section ini — ia saudara `Dive` di dalam
         `ConceptFrame`, di pembungkus sticky-nya sendiri. Jadi ia tidak bisa
         diambil lewat selektor ber-scope dan harus dicari dari dokumen.

         Itu satu-satunya hal di berkas ini yang menjangkau ke luar scope, dan
         alasannya konkret: gerak naiknya HARUS seirama dengan keluarnya teks
         hero. Tween-nya tetap dibuat di dalam scope `useGSAP`, jadi ia tetap
         dikembalikan saat teardown. */
      const navShell =
        typeof document === "undefined"
          ? null
          : document.querySelector<HTMLElement>("[data-nav-shell]");

      /* Gerak dikurangi: tidak satu pun ScrollTrigger dipasang — dicabut, bukan
         dipasang lalu dimatikan.

         Progres disetel ke bingkai yang PALING MENJELASKAN: globe sudah utuh di
         kanan pada ukuran bacanya, kelima belas penanda sudah menyala, teks
         hero masih penuh. `intro` langsung 1 supaya tidak ada yang menunggu
         animasi yang memang tidak akan dijalankan. §10. */
      if (still) {
        publish({ value: STILL_PROGRESS, intro: 1 });
        gsap.set(hint, { autoAlpha: 0 });
        gsap.set(dust, { autoAlpha: 0.3 });
        return;
      }

      /* ── Masuk, berbasis WAKTU ──────────────────────────────────────
         Terjadi sebelum ada yang digulir, dan itu seluruh maksudnya: bingkai
         pertama tidak boleh bergantung pada posisi gulir. */
      const intro = { v: 0 };
      gsap.to(intro, {
        v: 1,
        duration: 1.5,
        ease: EASE.enter,
        onUpdate: () => publish({ intro: intro.v }),
      });

      const welcome = gsap
        .timeline({ defaults: { ease: EASE.enter } })
        .from("[data-reveal-line] > *", { yPercent: 108, duration: 1.1, stagger: 0.08 })
        .from("[data-dive-lead]", { autoAlpha: 0, y: 16, duration: 0.8 }, "-=0.8")
        .addLabel("angka", "-=0.55")
        .from("[data-dive-chip]", { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.07 }, "angka")
        .from("[data-dive-action]", { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.08 }, "-=0.45")
        .from(hint, { autoAlpha: 0, duration: 0.6 }, "-=0.3");

      /* Angka mengendap bersama barisnya.

         Mekanismenya sudah ditulis di project ini untuk hero konsep B; yang
         diambil polanya, bukan hooknya — hook itu terikat pada peta beat milik
         hero yang lain. Bedanya di sini ia digantung pada timeline BERBASIS
         WAKTU, bukan yang ter-scrub: mencacah adalah bagian dari sambutan, dan
         sambutan terjadi justru ketika belum ada yang digulir.

         Nilai benarnya dibaca dari `data-count`, TIDAK PERNAH dari
         `textContent` — `textContent` adalah yang ditimpa tiap frame, jadi
         membacanya dari sana berarti mencacah menuju angka yang sedang berubah.

         `fromTo`, bukan `to`: ia merender keadaan awalnya seketika saat
         timeline dirakit, jadi nolnya sudah terpasang sebelum satu bingkai pun
         terlihat. Dengan `to` saja, angka benar hasil render server akan
         terlihat sekejap lalu melompat ke nol. */
      for (const el of q<HTMLElement>("[data-count]")) {
        const target = Number(el.dataset.count);
        if (!Number.isFinite(target)) continue;

        const tally = { n: 0 };
        welcome.fromTo(
          tally,
          { n: 0 },
          {
            n: target,
            duration: 1.1,
            ease: EASE.enter,
            snap: { n: 1 },
            onUpdate: () => {
              el.textContent = String(Math.round(tally.n));
            },
          },
          "angka",
        );
      }

      /* Keadaan awal dipasang GSAP, tidak pernah CSS. Tanpa JavaScript blok
         teksnya tetap terbaca alih-alih hilang sama sekali. */
      gsap.set(bridge, { autoAlpha: 0 });
      gsap.set(dust, { autoAlpha: 0 });

      const film = gsap.timeline({
        defaults: { ease: EASE.scrub },
        scrollTrigger: {
          trigger: node,
          start: "top top",
          /* `bottom top`, BUKAN `bottom bottom` — dan ini perbaikan struktural,
             bukan penyetelan.

             Dengan `bottom bottom`, progres 1 jatuh saat panggung lengket MULAI
             meluncur keluar, menyisakan tepat satu tinggi layar yang tidak
             dianimasikan apa pun. Diukur pada viewport 730px: 949 piksel — hampir
             1,3 layar — antara globe mulai pergi dan judul section berikutnya
             berdiri. Itulah "gulir cukup panjang" yang dilaporkan.

             Dengan `bottom top`, progres 1 jatuh saat section benar-benar habis.
             Layar terakhir itu berhenti jadi sisa dan jadi rentang animasi
             terakhir: penembusan bumi terjadi PERSIS selagi panggungnya
             meluncur. */
          end: "bottom top",
          scrub: SCRUB,
          invalidateOnRefresh: true,
          onLeave: () => onPassed(true),
          onEnterBack: () => onPassed(false),
          onToggle: (self) => {
            gsap.set([...layers, hero].filter(Boolean), {
              willChange: self.isActive ? "transform" : "auto",
            });
          },
        },
      });

      /* Satu-satunya jembatan ke kanvas: sebuah angka. */
      const proxy = { t: 0 };
      film.to(
        proxy,
        {
          t: 1,
          duration: 1,
          onUpdate: () => {
            publish({ value: proxy.t });
          },
        },
        0,
      );

      /* Lapisan gambar hanyut sepanjang film. Kecepatannya dari `data-depth`,
         jadi rasa kedalaman diatur di data, bukan di sini. */
      const travel = compact ? 16 : 40;
      for (const layer of layers) {
        const depth = Number(layer.dataset.depth ?? 0);
        film.to(layer, { yPercent: depth * travel, duration: 1 }, 0);
      }

      const span = (name: keyof typeof STATE) => STATE[name].to - STATE[name].from;

      film
        /* Debu masuk bersama globe, lalu tinggal. Ia satu-satunya lapisan gambar
           di panggung ini, dan tugasnya memberi udara kepada bola yang kalau
           tidak akan berdiri di atas kertas kosong. */
        .fromTo(dust, { autoAlpha: 0 }, { autoAlpha: 0.42, duration: span("arrive") }, 0)

        /* Sambutan dilepas. Teks mundur ke atas lebih cepat daripada apa pun di
           belakangnya — ia lewat di DEPAN adegan, bukan bagian darinya. */
        .to(hero, { autoAlpha: 0, yPercent: -18, duration: span("turn") * 0.75 }, STATE.turn.from)
        .to(hint, { autoAlpha: 0, duration: 0.05 }, STATE.turn.from)

        /* Navbar terangkat seirama, lalu turun lagi di ujung sekuens supaya
           section-section setelah ini tetap punya navigasi. */
        .to(navShell, { yPercent: -160, autoAlpha: 0, duration: span("turn") * 0.5 }, STATE.turn.from)
        .to(navShell, { yPercent: 0, autoAlpha: 1, duration: span("enter") * 0.5 }, STATE.enter.from)

        /* Kalimat jembatan masuk saat globe mulai mendekat, DITAHAN diam selama
           `close`, lalu pergi saat globe mulai naik. Teks yang masih bergerak
           saat ia harus dibaca adalah teks yang tidak dibaca siapa pun. */
        .to(bridge, { autoAlpha: 1, duration: 0.04 }, STATE.close.from)
        .to(bridge, { autoAlpha: 0, duration: 0.04 }, STATE.close.to - 0.05);
    },
    scope,
    [],
  );
}
