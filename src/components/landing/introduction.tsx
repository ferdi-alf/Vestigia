"use client";

import { useRef } from "react";
import { SECTION_MEDIA } from "@/data/landing-media";
import { useI18n } from "@/lib/i18n/client";
import { useSectionReveal } from "@/lib/motion/use-section-reveal";
import { MediaLayer, IllustrationNote, hasMedia } from "./media-layer";

const TEXTURE = SECTION_MEDIA.find((slot) => slot.id === "intro-texture")!;

/**
 * Yang hilang.
 *
 * Section ini sengaja tidak memuat satu angka pun. Statistik tentang laju
 * kerusakan warisan mudah dikarang dan sulit diperiksa, dan seluruh project ini
 * berdiri di atas janji untuk tidak melakukannya. Yang benar dan bisa
 * dipertanggungjawabkan adalah bentuk kehilangannya — bertahap, tanpa satu hari
 * yang bisa ditunjuk — dan itulah yang ditulis.
 */
export function Introduction() {
  const { dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  useSectionReveal(root);

  return (
    <section ref={root} className="relative overflow-hidden">
      <MediaLayer slot={TEXTURE} sizes="100vw" />
      <div
        aria-hidden="true"
        className="scrim-spread pointer-events-none absolute inset-0"
      />

      {/* Sempit dan sangat lega. Section ini hanya teks, dan teks yang
          direntangkan selebar tujuh ratus piksel berhenti bisa dibaca —
          sekaligus membuatnya terlihat persis seperti section berikutnya. */}
      <div className="relative mx-auto max-w-3xl px-4 py-32 sm:px-6 sm:py-44">
        <div className="grid gap-x-16 gap-y-10">
          <div>
            <p data-reveal className="kicker">
              {dict.landing.lossKicker}
            </p>
            <h2
              data-reveal
              className="mt-6 font-display text-4xl leading-[1.08] text-ink sm:text-5xl"
            >
              {dict.landing.lossTitle}
            </h2>
            <span data-reveal aria-hidden="true" className="strata-rule mt-10 block" />
          </div>

          <div>
            {dict.landing.lossBody.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                data-reveal
                className="mb-6 text-base leading-[1.75] text-ink-muted last:mb-0 sm:text-[1.0625rem]"
              >
                {paragraph}
              </p>
            ))}
            <p
              data-reveal
              className="mt-10 border-l border-gold-dim pl-5 font-display text-2xl leading-snug text-ink-soft sm:text-[1.75rem]"
            >
              {dict.landing.lossClose}
            </p>
            <IllustrationNote
              show={hasMedia(TEXTURE)}
              label={dict.landing.illustration}
              className="mt-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
