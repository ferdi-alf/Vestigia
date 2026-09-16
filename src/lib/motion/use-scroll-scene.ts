"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Tiga keadaan gerak, dideklarasikan sekali.
 *
 * Dipisah lewat gsap.matchMedia() dan bukan lewat pengecekan `if` biasa karena
 * alasan yang menentukan: matchMedia mengembalikan (revert) seluruh animasi
 * yang dibuat di dalam cabangnya ketika kondisinya berhenti berlaku. Jadi
 * ketika pengguna menyalakan "kurangi gerak" saat halaman sedang terbuka,
 * ScrollTrigger-nya benar-benar dicabut, bukan sekadar berhenti bergerak —
 * dan halaman kembali ke bingkai diam tanpa perlu dimuat ulang.
 *
 * Blok `prefers-reduced-motion` di globals.css tidak bisa melakukan ini:
 * GSAP menulis gaya inline, dan media query tidak bisa menghentikannya.
 */
export const MOTION_QUERIES = {
  full: "(prefers-reduced-motion: no-preference) and (min-width: 768px)",
  compact: "(prefers-reduced-motion: no-preference) and (max-width: 767px)",
  still: "(prefers-reduced-motion: reduce)",
} as const;

export interface SceneConditions {
  /** layar lebar, gerak penuh */
  full: boolean;
  /** layar sempit — perjalanan lebih pendek, lapisan lebih sedikit, tanpa pin */
  compact: boolean;
  /** pengguna meminta gerak dikurangi — tidak boleh ada ScrollTrigger sama sekali */
  still: boolean;
}

type SceneBuilder = (conditions: SceneConditions, root: HTMLElement) => void;

/**
 * Membangun adegan scroll dalam lingkup satu komponen.
 *
 * Pembersihan ditangani useGSAP: saat komponen dilepas, seluruh tween,
 * ScrollTrigger, dan gaya inline yang dibuat di dalamnya dikembalikan. Selektor
 * string di dalam `build` terbatas pada `scope`, jadi `.layer` di satu section
 * tidak pernah tanpa sengaja menyentuh `.layer` di section lain.
 */
export function useScrollScene(
  build: SceneBuilder,
  scope: RefObject<HTMLElement | null>,
  dependencies: unknown[] = [],
) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES, (context) => {
        const { full, compact, still } = context.conditions as Record<string, boolean>;
        build({ full: Boolean(full), compact: Boolean(compact), still: Boolean(still) }, root);
      });
    },
    { scope, dependencies },
  );
}

/**
 * Kurva gerak. Scrub langsung selalu linear — memberi easing pada sesuatu yang
 * sudah digerakkan jari pengguna membuat halaman terasa tertinggal di belakang
 * gerakannya sendiri.
 */
export const EASE = {
  /** masuk: deselerasi dramatis */
  enter: "power3.out",
  /** keluar: akselerasi bersih */
  exit: "power2.in",
  /** terikat langsung ke scroll */
  scrub: "none",
} as const;

export { gsap, ScrollTrigger };
