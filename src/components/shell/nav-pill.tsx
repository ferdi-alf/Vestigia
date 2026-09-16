"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/cn";

/**
 * Tautan navigasi dengan isian yang naik dari bawah.
 *
 * Mekanismenya dari reactbits `PillNav`, dan yang diambil adalah bagian
 * cerdasnya: isiannya bukan balok yang naik lurus, melainkan **lingkaran besar**
 * yang busurnya kebetulan melewati kedua sudut bawah pil. Radiusnya
 *
 *     R = (w²/4 + h²) / 2h
 *
 * adalah radius lingkaran yang melalui ketiga titik itu. Hasilnya tepi isian
 * melengkung lembut saat naik alih-alih mendatar — perbedaan yang kecil di
 * layar dan besar di rasa.
 *
 * Tiga hal diubah dari aslinya:
 *
 * 1. **`react-router-dom` dibuang.** Aslinya mengimpornya sebagai dependency;
 *    di sini `Link` milik Next yang dipakai, supaya prefetch dan navigasi
 *    kliennya tetap jalan.
 * 2. **Animasi muat-awal dibuang.** Aslinya menganimasikan `width` dari 0 ke
 *    auto, dan aturan anti design slop melarang menganimasikan properti layout.
 *    Lagi pula navigasi yang memuai saat halaman dibuka menunda tautan yang
 *    pengguna mungkin sudah hendak klik.
 * 3. **Warnanya token kita.** Isiannya `ink-soft` — cokelat batu gelap, bukan
 *    emas. Emas adalah satu-satunya aksen di halaman ini dan ia disimpan untuk
 *    menandai halaman yang sedang dibuka; memakainya juga untuk hover berarti
 *    tidak ada lagi yang membedakan "di sini" dari "bisa diklik".
 */
export function NavPill({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLAnchorElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const pill = root.current;
      if (!pill) return;

      const dome = pill.querySelector<HTMLElement>("[data-dome]");
      const base = pill.querySelector<HTMLElement>("[data-label]");
      const over = pill.querySelector<HTMLElement>("[data-label-over]");
      if (!dome || !base || !over) return;

      /* Gerak dikurangi: tidak ada timeline sama sekali, dan kubahnya
         disembunyikan permanen. Transisi warna di CSS sudah dipangkas jadi
         seketika oleh blok prefers-reduced-motion di globals.css, jadi yang
         tersisa adalah tautan biasa yang berubah warna — tetap terbaca, tetap
         bisa ditempuh papan ketik. */
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const measure = () => {
          const { width: w, height: h } = pill.getBoundingClientRect();
          if (w === 0 || h === 0) return;

          const r = (w * w) / 4 / (2 * h) + h / 2;
          const d = Math.ceil(2 * r) + 2;
          const delta = Math.ceil(r - Math.sqrt(Math.max(0, r * r - (w * w) / 4))) + 1;

          gsap.set(dome, {
            width: d,
            height: d,
            bottom: -delta,
            xPercent: -50,
            scale: 0,
            transformOrigin: `50% ${d - delta}px`,
          });
          gsap.set(base, { yPercent: 0 });
          gsap.set(over, { yPercent: 120, autoAlpha: 0 });

          timeline.current?.kill();
          const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out", duration: 0.42 } });
          tl.to(dome, { scale: 1.2 }, 0)
            .to(base, { yPercent: -125, autoAlpha: 0 }, 0)
            .to(over, { yPercent: 0, autoAlpha: 1 }, 0);
          timeline.current = tl;
        };

        measure();

        /* Lebar pil diturunkan dari metrik huruf, jadi ia bergeser saat font
           kustom akhirnya tiba — dan radius yang dihitung sebelum itu akan
           meleset. Diukur ulang sekali saat font siap, dan saat lebar jendela
           berubah. */
        const onResize = () => measure();
        window.addEventListener("resize", onResize);
        document.fonts?.ready.then(measure).catch(() => {});

        return () => {
          window.removeEventListener("resize", onResize);
          timeline.current?.kill();
          timeline.current = null;
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const play = () => timeline.current?.play();
  const rewind = () => timeline.current?.reverse();

  return (
    <Link
      ref={root}
      href={href}
      onClick={onClick}
      onMouseEnter={play}
      onMouseLeave={rewind}
      onFocus={play}
      onBlur={rewind}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative isolate inline-flex items-center overflow-hidden rounded-full px-4 py-2 text-sm transition-colors",
        active ? "text-gold" : "text-ink-muted",
      )}
    >
      {/* Kubah yang naik. `-z-10` menaruhnya di belakang kedua label tanpa
          menambah stacking context baru di pil sebelahnya. */}
      <span
        aria-hidden="true"
        data-dome
        className="pointer-events-none absolute left-1/2 -z-10 rounded-full bg-ink-soft"
      />

      {/* Dua salinan label: satu keluar ke atas, satu masuk dari bawah.
          Hanya yang pertama yang terbaca pembaca layar dan Ctrl+F — yang kedua
          `aria-hidden`, karena satu tautan tidak boleh menyebut namanya dua
          kali. */}
      <span data-label className="block">
        {children}
      </span>
      <span
        aria-hidden="true"
        data-label-over
        className="absolute inset-0 flex items-center justify-center text-paper"
      >
        {children}
      </span>
    </Link>
  );
}
