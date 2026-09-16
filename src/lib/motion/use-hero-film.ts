"use client";

import type { RefObject } from "react";
import { BEAT, BEAT_MOBILE, SCRUB } from "@/data/hero-beats";
import type { HeroProgress } from "@/components/three/hero-stage";
import { EASE, gsap, useScrollScene } from "./use-scroll-scene";

/**
 * Film hero.
 *
 * Satu timeline ter-scrub, beat bernama, dan pembagian kepemilikan yang tegas:
 * hook ini memegang seluruh elemen DOM, panggung 3D memegang kamera. Keduanya
 * bertemu hanya lewat satu angka — `progress.value` — dan tidak pernah menulis
 * properti yang sama.
 *
 * Pembagian itu bukan kerapian belaka. Kamera diperbarui tiap frame di dalam
 * loop render, sedangkan elemen DOM diperbarui oleh GSAP; kalau keduanya sempat
 * menyentuh benda yang sama, salah satunya akan menang secara acak tergantung
 * urutan frame, dan bug seperti itu tidak bisa direproduksi.
 */
export function useHeroFilm(
  scope: RefObject<HTMLElement | null>,
  progress: RefObject<HeroProgress>,
) {
  useScrollScene(
    ({ full, compact, still }, node) => {
      const q = <T extends Element>(sel: string) => gsap.utils.toArray<T>(sel, node);

      const copy = node.querySelector<HTMLElement>("[data-hero-copy]");
      const hold = node.querySelector<HTMLElement>("[data-hero-hold]");
      const hint = node.querySelector<HTMLElement>("[data-hero-hint]");
      const canvas = node.querySelector<HTMLElement>("[data-hero-canvas]");
      const layers = q<HTMLElement>("[data-layer]");

      /* Gerak dikurangi: tidak satu pun ScrollTrigger dipasang, dan progres
         dibiarkan nol supaya kamera berhenti pada pose diam yang sudah dipilih
         sebagai bingkai paling menjelaskan. Semua teks sudah terbaca tanpa
         disentuh. */
      if (still) {
        /* Progres tidak perlu disentuh: ia lahir nol dan tidak ada yang
           menulisinya di cabang ini. Panggung membaca pose diamnya sendiri. */
        gsap.set(hint, { autoAlpha: 0 });
        return;
      }

      const beat = compact ? BEAT_MOBILE : BEAT;

      /* Masuk, berbasis waktu — ini terjadi sebelum ada yang digulir. */
      gsap
        .timeline({ defaults: { ease: EASE.enter } })
        .from("[data-reveal-line] > *", { yPercent: 108, duration: 1.1, stagger: 0.08 })
        /* Satu pita emas menyapu judul, sekali, tepat setelah huruf mendarat —
           motif `carved-edge` yang bergerak: cahaya menemukan tepi pahatan.
           Mekanismenya dari reactbits `ShinyText`, tetapi digerakkan GSAP alih-alih
           menarik `motion@^12` yang tidak menambah apa pun di sini.

           Berbasis waktu, jadi ia boleh punya easing. Ia juga tidak pernah
           berulang: kilau yang berdenyut selamanya adalah animasi dekoratif yang
           tidak menceritakan apa pun. */
        .fromTo(
          "[data-sweep]",
          { backgroundPosition: "150% center" },
          { backgroundPosition: "-60% center", duration: 1.5, ease: EASE.enter },
          "-=0.75",
        )
        .from("[data-hero-lead]", { autoAlpha: 0, y: 16, duration: 0.8 }, "-=1.2")
        .from("[data-hero-action]", { autoAlpha: 0, y: 12, duration: 0.6, stagger: 0.08 }, "-=0.45")
        .from(hint, { autoAlpha: 0, duration: 0.6 }, "-=0.3");

      /* Bingkai tahan belum punya isi saat pembuka berjalan. Disembunyikan di
         sini, bukan di CSS, supaya tanpa JavaScript ia tetap terbaca alih-alih
         hilang sama sekali. */
      gsap.set(hold, { autoAlpha: 0, y: 14 });

      const film = gsap.timeline({
        defaults: { ease: EASE.scrub },
        scrollTrigger: {
          trigger: node,
          start: "top top",
          /* Di-pin hanya di layar lebar. Di ponsel menahan scroll berarti
             menahan satu-satunya cara pengguna bergerak di halaman, dan biaya
             respons sentuhannya tidak sepadan dengan efeknya. */
          ...(full
            ? { end: "+=140%", pin: true, anticipatePin: 1 }
            : { end: "+=90%" }),
          scrub: SCRUB,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            gsap.set([...layers, copy].filter(Boolean), {
              willChange: self.isActive ? "transform" : "auto",
            });
          },
        },
      });

      /* Satu-satunya jembatan ke kanvas: sebuah angka yang ditulis tiap
         pembaruan. Kamera membacanya di dalam loop render-nya sendiri. */
      const proxy = { t: 0 };
      film.to(
        proxy,
        {
          t: 1,
          duration: 1,
          onUpdate: () => {
            if (progress.current) progress.current.value = proxy.t;
          },
        },
        0,
      );

      /* Lapisan gambar bergerak sepanjang film, bukan pada beat tertentu.
         Kecepatannya diturunkan dari `data-depth`, jadi rasa kedalaman diatur
         di src/data/landing-media.ts. */
      const travel = full ? 42 : 18;
      for (const layer of layers) {
        const depth = Number(layer.dataset.depth ?? 0);
        film.to(layer, { yPercent: depth * travel, duration: 1 }, 0);
      }

      /* Teks mundur lebih cepat daripada lanskapnya, sehingga ia terbaca
         sebagai sesuatu yang lewat di depan adegan. */
      film
        .to(copy, { yPercent: -18, autoAlpha: 0, duration: beat.recede.dur }, beat.recede.at)
        .to(hint, { autoAlpha: 0, duration: 0.1 }, 0)
        .to(hold, { autoAlpha: 1, y: 0, duration: 0.14 }, beat.enter.at)
        .to(hold, { autoAlpha: 0, duration: 0.12 }, beat.land.at + 0.06);

      /* Angka mengendap saat bingkai tahan muncul.
         Mekanisme pencacah dari reactbits `CountUp`, tetapi dijalankan dari
         dalam film alih-alih sebagai komponen tersendiri — film sudah pemilik
         tunggal seluruh DOM hero, dan menambahkan pemilik kedua untuk elemen
         yang sama persis adalah cara membuat bug yang tidak bisa direproduksi.

         Karena ia ter-scrub, mencacahnya dapat dibalik: menggulir ke atas
         menghitung mundur dan bingkainya menelusuri ulang persis. `fromTo`
         merender keadaan awalnya seketika, jadi nolnya sudah terpasang jauh
         sebelum bingkai tahan terlihat — tidak pernah ada lompatan dari angka
         benar ke nol di depan mata.

         Nilai benarnya dibaca dari `data-count`, bukan dari `textContent`, sebab
         `textContent` adalah yang ditimpa tiap frame. */
      for (const el of q<HTMLElement>("[data-count]")) {
        const target = Number(el.dataset.count);
        if (!Number.isFinite(target)) continue;

        const tally = { n: 0 };
        film.fromTo(
          tally,
          { n: 0 },
          {
            n: target,
            duration: 0.16,
            snap: { n: 1 },
            onUpdate: () => {
              el.textContent = String(Math.round(tally.n));
            },
          },
          beat.enter.at,
        );
      }

      /* Object larut, bukan terpotong. Yang dipudarkan adalah kanvasnya, bukan
         material di dalamnya — menyentuh material berarti menulis ke setiap
         mesh tiap frame, dan pada model berjuta segitiga itu terasa. */
      if (canvas) {
        film.to(canvas, { autoAlpha: 0, duration: beat.dissolve.dur }, beat.dissolve.at);
      }
    },
    scope,
    [],
  );
}
