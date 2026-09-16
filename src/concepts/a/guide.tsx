"use client";

import { useRef } from "react";
import type { Heritage } from "@/data/types";
import type { AiPanelSites } from "@/concepts/shell/ai-panel";
import { AiPanel } from "@/concepts/shell/ai-panel";
import { useI18n } from "@/lib/i18n/client";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { A_COPY } from "./copy";

/**
 * Pemandu Budaya — tempat tesis project ini bisa diuji, bukan cuma dibaca.
 *
 * Section ini menutup dua lubang sekaligus, dan keduanya nyata.
 *
 * **Pertama, sebuah regresi.** Ketika `/compare` dihapus, UI satu-satunya
 * untuk `POST /api/ai/compare` ikut hilang bersamanya — dua dari empat route
 * AI kehilangan pintu masuknya, pada aspek penilaian yang berbobot dua puluh
 * persen. `AiPanel` ditulis untuk menyelamatkannya tetapi tidak pernah
 * dipasang di halaman mana pun. Di sini ia dipasang.
 *
 * **Kedua, sebuah tautan mati.** Navbar menunjuk `#pemandu` sejak lama padahal
 * tidak ada satu pun elemen dengan id itu. Menghapus tautannya adalah satu
 * jalan; membangun section yang memang dijanjikannya adalah jalan yang lebih
 * baik, karena section ini memang harus ada.
 *
 * Tidak ada satu pun model yang dipanggil sampai pengunjung benar-benar
 * menekan sesuatu. Tanpa kunci API, panelnya turun ke jawaban luring yang
 * disusun dari data situs — bukan ke pesan galat, dan bukan ke jawaban yang
 * mengaku dihasilkan padahal tidak.
 */
export function Guide({ heritage, all }: { heritage: Heritage; all: AiPanelSites["all"] }) {
  const { locale } = useI18n();
  const root = useRef<HTMLElement>(null);

  const sites: AiPanelSites = {
    featured: { slug: heritage.slug, keyFeatures: heritage.keyFeatures },
    all,
  };

  useScrollScene(
    ({ still }, node) => {
      if (still) return;

      gsap.from(gsap.utils.toArray<HTMLElement>("[data-reveal]", node), {
        autoAlpha: 0,
        y: 20,
        duration: 0.7,
        stagger: 0.08,
        ease: EASE.enter,
        scrollTrigger: { trigger: node, start: "top 76%", once: true },
      });
    },
    root,
    [heritage.slug],
  );

  return (
    <section ref={root} id="pemandu" aria-labelledby="a-guide-title" className="relative py-24 sm:py-32">
      <span aria-hidden="true" className="strata-rule absolute inset-x-0 top-0 block" />

      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p data-reveal className="kicker">
              {A_COPY.guideKicker[locale]}
            </p>
            <h2
              id="a-guide-title"
              data-reveal
              className="mt-4 font-display text-3xl leading-[1.06] text-ink sm:text-4xl lg:text-5xl"
            >
              {A_COPY.guideTitle[locale]}
            </h2>
          </div>
          <p
            data-reveal
            className="text-sm leading-[1.75] text-ink-muted lg:col-span-4 lg:col-start-9 lg:self-end"
          >
            {A_COPY.guideLead[locale]}
          </p>
        </div>

        <div data-reveal className="mt-10">
          <AiPanel sites={sites} />
        </div>
      </div>
    </section>
  );
}
