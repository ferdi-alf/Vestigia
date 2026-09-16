"use client";

import Link from "next/link";
import { useRef } from "react";
import { SECTION_MEDIA } from "@/data/landing-media";
import { useI18n } from "@/lib/i18n/client";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { MediaLayer, IllustrationNote, hasMedia } from "./media-layer";
import { buttonClass } from "@/components/ui/button";

const SCENE = SECTION_MEDIA.find((slot) => slot.id === "closing-scene")!;

/**
 * Penutup.
 *
 * Ken Burns lambat di sini terikat pada scroll, bukan pada jam. Gambar yang
 * merayap sendiri selamanya akan tetap merayap ketika pengunjung sudah berhenti
 * membaca dan hanya mencari tombolnya — gerak yang tidak diminta siapa pun dan
 * tidak menjelaskan apa pun.
 */
export function Closing() {
  const { dict } = useI18n();
  const root = useRef<HTMLElement>(null);

  useScrollScene(
    ({ still }, node) => {
      if (still) return;

      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", node);
      gsap.from(items, {
        autoAlpha: 0,
        y: 22,
        duration: 0.7,
        stagger: 0.1,
        ease: EASE.enter,
        scrollTrigger: { trigger: node, start: "top 76%", once: true },
      });

      gsap.fromTo(
        node.querySelector("[data-layer]"),
        { scale: 1 },
        {
          scale: 1.06,
          ease: EASE.scrub,
          scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    },
    root,
    [],
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      <span aria-hidden="true" className="strata-rule absolute inset-x-0 top-0 z-10 block" />
      <MediaLayer slot={SCENE} sizes="100vw" />
      <div
        aria-hidden="true"
        className="scrim-radial pointer-events-none absolute inset-0"
      />

      {/* Paling lega di seluruh halaman. Penutup yang sesak terbaca sebagai
          halaman yang kehabisan tempat, bukan sebagai halaman yang selesai. */}
      <div className="relative mx-auto max-w-7xl px-4 py-36 sm:px-6 sm:py-52">
        <span data-reveal aria-hidden="true" className="carved-edge" />
        <h2
          data-reveal
          className="mt-8 max-w-3xl font-display text-5xl leading-[1.05] text-ink sm:text-6xl lg:text-7xl"
        >
          {dict.landing.closeTitle}
        </h2>
        <p data-reveal className="mt-6 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
          {dict.landing.closeLead}
        </p>
        <div data-reveal className="mt-12">
          <Link href="#peta" className={buttonClass({ size: "lg" })}>
            {dict.landing.closeCta}
          </Link>
        </div>
        <IllustrationNote
          show={hasMedia(SCENE)}
          label={dict.landing.illustration}
          className="mt-16"
        />
      </div>
    </section>
  );
}
