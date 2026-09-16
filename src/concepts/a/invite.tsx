"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Heritage } from "@/data/types";
import { CONCEPT_MEDIA } from "@/data/landing-media";
import { MediaLayer } from "@/components/landing/media-layer";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { useSectionReveal } from "@/lib/motion/use-section-reveal";
import { A_COPY } from "./copy";

const DUSK = CONCEPT_MEDIA.find((s) => s.id === "a-dusk");

/**
 * Undangan — satu kartu lebar, satu ajakan, lalu halaman selesai.
 *
 * Menggantikan section Penutup yang dulu berisi teks polos dan sebuah cakram
 * SVG di kanan. Cakram itu adalah "circle placeholder" yang dikeluhkan pemilik
 * project, dan ia berdiri tepat setelah bola 3D sungguhan — dua lingkaran
 * berurutan, yang kedua jelas kalah.
 *
 * Latarnya memakai slot `a-dusk` (`closing-scene.webp`, 19 KB). Slot itu sudah
 * terdaftar di `landing-media.ts` sejak lama dan **belum pernah dipakai section
 * mana pun** — jadi kartu ini tidak menuntut satu asset baru pun.
 *
 * Halaman tetap utuh dengan nol gambar: kalau berkasnya tidak ada, `MediaLayer`
 * jatuh ke komposisi CSS dan yang tersisa kartu berlatar kertas dengan teks dan
 * tombol yang sama. Aturan §1 — nol asumsi asset.
 */
export function Invite({ heritage }: { heritage: Heritage }) {
  const { locale } = useI18n();
  const root = useRef<HTMLElement>(null);

  useSectionReveal(root);

  return (
    <section ref={root} aria-labelledby="a-invite-title" className="relative pb-28 sm:pb-36">
      <div className="shell">
        <div
          data-reveal
          className="relative isolate overflow-hidden rounded-3xl border border-line px-8 py-16 sm:px-14 sm:py-20"
        >
          {/* Latar, di bawah segalanya dan tanpa pointer. Diredam supaya teks
              di atasnya tidak pernah bergantung pada seberapa terang gambarnya
              di satu titik. */}
          {DUSK ? (
            <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-40">
              <MediaLayer slot={DUSK} sizes="(min-width: 1024px) 60rem, 100vw" />
            </div>
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,var(--color-paper)_0%,color-mix(in_oklab,var(--color-paper)_78%,transparent)_52%,color-mix(in_oklab,var(--color-paper)_38%,transparent)_100%)]"
          />

          <div className="max-w-xl">
            <span data-reveal aria-hidden="true" className="carved-edge" />
            <h2
              data-reveal
              id="a-invite-title"
              className="mt-5 font-display text-4xl leading-[1.05] text-ink sm:text-5xl"
            >
              {A_COPY.inviteTitle[locale]}
            </h2>
            <p data-reveal className="mt-5 text-sm leading-[1.75] text-ink-muted sm:text-base">
              {A_COPY.inviteLead[locale]}
            </p>
            <div data-reveal className="mt-9">
              <Link href={`/heritage/${heritage.slug}`} className={buttonClass({ size: "lg" })}>
                {A_COPY.inviteCta[locale]}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
