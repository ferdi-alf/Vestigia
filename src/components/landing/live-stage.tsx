"use client";

import Link from "next/link";
import { useRef } from "react";
import { HeritageViewer } from "@/components/three/heritage-viewer";
import type { Heritage } from "@/data/types";
import { useI18n } from "@/lib/i18n/client";
import { useSectionReveal } from "@/lib/motion/use-section-reveal";
import { buttonClass } from "@/components/ui/button";

/**
 * Panggung hidup.
 *
 * Bukan tangkapan layar panggung 3D, melainkan panggung itu sendiri — klaim
 * yang dibuat halaman ini dibuktikan di halaman ini juga, bukan ditunda sampai
 * pengunjung mau mengklik ke tempat lain.
 *
 * `defer` yang membuat itu terjangkau: kanvas baru ada ketika section ini
 * mendekati layar. Membuka landing dan berhenti di hero tidak menarik satu byte
 * GLB pun.
 */
export function LiveStage({ heritage }: { heritage: Heritage }) {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  useSectionReveal(root, [heritage.slug]);

  return (
    <section ref={root} className="relative border-t border-line/60 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p data-reveal className="kicker">
              {dict.landing.stageKicker}
            </p>
            <h2
              data-reveal
              className="mt-6 font-display text-4xl leading-[1.08] text-ink sm:text-5xl"
            >
              {dict.landing.stageTitle}
            </h2>
            <p data-reveal className="mt-6 text-base leading-relaxed text-ink-muted">
              {dict.landing.stageLead}
            </p>

            <dl data-reveal className="mt-10 space-y-3 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-dim">{dict.heritage.location}</dt>
                <dd className="text-ink-soft">
                  {heritage.location[locale]}, {heritage.country[locale]}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-dim">{dict.heritage.period}</dt>
                <dd className="text-ink-soft">{heritage.period[locale]}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-ink-dim">{dict.heritage.civilization}</dt>
                <dd className="text-ink-soft">{heritage.civilization[locale]}</dd>
              </div>
            </dl>

            <Link
              data-reveal
              href={`/heritage/${heritage.slug}`}
              className={buttonClass({ variant: "secondary", className: "mt-10" })}
            >
              {dict.landing.stageOpen}
            </Link>
          </div>

          <div data-reveal className="lg:col-span-8">
            <HeritageViewer heritage={heritage} defer idleLabel={dict.landing.stageIdle} />
            <p className="mt-3 text-xs text-ink-dim">{heritage.name[locale]}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
