"use client";

import type { RefObject } from "react";
import { EASE, gsap, useScrollScene } from "./use-scroll-scene";

/**
 * Perlakuan masuk bersama untuk section non-hero.
 *
 * Satu perlakuan, dipakai berulang, adalah keputusan yang disengaja: ia
 * membentuk identitas. Efek yang berbeda-beda di tiap section terbaca sebagai
 * kumpulan eksperimen, bukan sebagai satu situs.
 *
 * Elemen ditandai `data-reveal` di markup. Tanpa JavaScript mereka tampil apa
 * adanya — keadaan tersembunyi hanya dipasang GSAP saat runtime, tidak pernah
 * oleh CSS, supaya kegagalan skrip tidak pernah berarti kehilangan isi.
 */
export function useSectionReveal(
  scope: RefObject<HTMLElement | null>,
  dependencies: unknown[] = [],
) {
  useScrollScene(
    ({ still }, node) => {
      if (still) return;

      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", node);
      if (items.length === 0) return;

      gsap.from(items, {
        autoAlpha: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.09,
        ease: EASE.enter,
        scrollTrigger: { trigger: node, start: "top 78%", once: true },
      });
    },
    scope,
    dependencies,
  );
}
