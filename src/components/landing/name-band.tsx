"use client";

import { useRef } from "react";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";

/**
 * Pita nama koleksi.
 *
 * Mekanismenya dari reactbits `ScrollVelocity` — satu baris yang melingkar
 * mulus dengan menggandakan isinya lalu menggeser tepat setengah lebarnya.
 * Setelah −50%, salinan kedua berada persis di tempat salinan pertama tadi,
 * jadi tidak pernah ada sambungan yang terlihat.
 *
 * Dua hal diubah, dan keduanya wajib:
 *
 * **Dependency.** Aslinya menarik `motion@^12` untuk `useVelocity` dan
 * `useSpring`. GSAP sudah terpasang dan ScrollTrigger sudah melakukan persis
 * hal yang dibutuhkan di sini.
 *
 * **Gerak dasarnya dibuang.** Aslinya punya `baseVelocity`: pita tetap berjalan
 * meskipun halaman diam, dan kecepatan scroll hanya menambah atau mengurangi.
 * Aturan anti design slop project ini melarang gerak yang berjalan sendiri tanpa
 * pemicu pengguna. Di sini pitanya **hanya** bergerak karena digulir — berhenti
 * saat jari berhenti, dan menggulir ke atas menjalankannya mundur persis.
 *
 * Isinya nama lima belas warisan yang benar-benar ada di koleksi, bukan kata
 * hias. Ia menyebutkan sesuatu, jadi ia bukan dekorasi — tetapi karena kartu di
 * bawahnya menyebut nama yang sama, seluruh pita disembunyikan dari pembaca
 * layar. Tiga puluh nama berturut-turut bukan informasi, itu kebisingan.
 */
export function NameBand({ names }: { names: string[] }) {
  const root = useRef<HTMLDivElement>(null);

  useScrollScene(
    ({ still }, node) => {
      if (still) return;

      const row = node.querySelector<HTMLElement>("[data-row]");
      if (!row) return;

      gsap.to(row, {
        xPercent: -50,
        ease: EASE.scrub,
        scrollTrigger: {
          trigger: node,
          /* Rentangnya sengaja jauh lebih panjang daripada pitanya sendiri:
             dimulai saat ia masuk dari bawah layar dan berakhir saat ia keluar
             dari atas, sehingga perjalanannya terasa sebagai arus yang tenang
             alih-alih sentakan yang selesai dalam beberapa piksel. */
          start: "top bottom",
          end: "bottom top",
          scrub: 0.4,
        },
      });
    },
    root,
    [names.length],
  );

  if (names.length === 0) return null;

  /* Digandakan, bukan diulang tiga kali: setengah lebar adalah jarak putaran,
     dan itu satu-satunya angka yang membuat `xPercent: -50` melingkar mulus. */
  const marquee = [...names, ...names];

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="relative overflow-hidden py-6 select-none"
    >
      {/* Tepinya dilarutkan, bukan dipotong. Pita yang berakhir mendadak di tepi
          layar terbaca sebagai elemen yang terpotong; yang memudar terbaca
          sebagai sesuatu yang memang lebih panjang daripada layar. */}
      <div
        className="flex w-max gap-8 whitespace-nowrap"
        data-row
        style={{
          maskImage:
            "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
        }}
      >
        {marquee.map((name, index) => (
          <span
            key={`${name}-${index}`}
            className="flex items-center gap-8 font-display text-3xl leading-none font-light text-ink-dim sm:text-4xl"
          >
            {name}
            {/* Pemisah `coordinate-mark`, sekaligus yang memberi pita iramanya. */}
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gold/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
