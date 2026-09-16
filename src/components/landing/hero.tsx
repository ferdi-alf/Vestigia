"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { HERO_LAYERS } from "@/data/landing-media";
import type { Heritage } from "@/data/types";
import type { HeroProgress } from "@/components/three/hero-stage";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { useInView } from "@/lib/motion/use-in-view";
import { useStillPreference } from "@/lib/motion/use-still-preference";
import { useHeroFilm } from "@/lib/motion/use-hero-film";
import { MediaLayer, IllustrationNote, anyMedia } from "./media-layer";

/* WebGL tidak ada di server, dan menariknya ke bundle server hanya memperlambat
   render pertama tanpa menghasilkan satu piksel pun. */
const HeroStage = dynamic(() => import("@/components/three/hero-stage").then((m) => m.HeroStage), {
  ssr: false,
});

/**
 * Kapan kanvas 3D boleh dipasang.
 *
 * Dua syarat, digabung di satu tempat karena keduanya menjawab pertanyaan yang
 * sama dan memisahkannya hanya melahirkan dua state yang harus disepakati.
 *
 * Pertama, mode hemat data: kalau pengguna memintanya, GLB tidak pernah diunduh
 * sama sekali — komposisi gambar sudah utuh tanpanya.
 *
 * Kedua, tunggu peramban senggang. Object hero adalah GLB, dan mengunduh serta
 * menguraikannya di jalur yang sama dengan cat pertama berarti judul — LCP
 * halaman ini — ikut mengantre di belakangnya. Satu putaran idle memindahkan
 * seluruh biaya itu ke belakang teks yang sudah terlihat.
 */
function useStageGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(() => setReady(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return ready;
}

/**
 * Hero — momen tanda tangan situs ini.
 *
 * Subjeknya object warisan yang sungguhan, bukan gambarnya. Menggulir
 * menerbangkan kamera: membuka lebar, mendorong masuk, menahan sebentar di
 * dekat permukaan batu, lalu terangkat melewati puncak sampai object turun
 * keluar bingkai dan menyerahkan halaman ke section berikutnya.
 *
 * Lapisan gambar tetap ada, tetapi perannya berubah — sekarang ia latar dan
 * cakrawala tempat object itu berdiri, bukan pertunjukannya sendiri.
 *
 * Tiga hal yang menjaga agar pilihan "object 3D di hero" tidak merugikan:
 * kanvas baru dipasang setelah peramban senggang, komposisi gambar sudah utuh
 * sejak frame pertama sehingga tidak pernah ada kotak kosong menunggu, dan
 * render berhenti total begitu hero keluar layar.
 */
export function Hero({
  heritage,
  sites,
  continents,
}: {
  heritage: Heritage | undefined;
  sites: number;
  continents: number;
}) {
  const { dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const progress = useRef<HeroProgress>({ value: 0 });
  const [stageRef, { active }] = useInView<HTMLDivElement>({ rootMargin: "200px" });

  const stageReady = useStageGate();
  const still = useStillPreference();
  const withMedia = anyMedia(HERO_LAYERS);

  useHeroFilm(root, progress);

  const showStage = Boolean(heritage) && stageReady;

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="relative motion-safe:h-[240svh] md:motion-safe:h-[300svh]"
    >
      <div className="stage-backdrop isolate sticky top-0 flex h-svh items-center overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:min-h-svh">
        {/* Debu diangkat ke z-[2] supaya ia benar-benar berada DI DEPAN object.
            Tanpa itu ia mengikuti urutan DOM dan jatuh di belakang panggung yang
            ber-z-[1] — yang persis kebalikan dari yang dijanjikan komentar di
            bawah dan dari yang diminta arah seni. Debu di belakang subjek bukan
            debu; ia cuma tekstur langit. */}
        {HERO_LAYERS.map((slot) => (
          <MediaLayer
            key={slot.id}
            slot={slot}
            className={slot.id === "hero-dust" ? "z-[2] scale-110" : undefined}
          />
        ))}

        {/* Panggung duduk di antara cakrawala dan debu, bukan di paling depan:
            object berdiri DI DALAM lanskap, tidak melayang di atasnya. */}
        <div ref={stageRef} className="absolute inset-0 z-[1]">
          {showStage && heritage ? (
            <HeroStage
              heritage={heritage}
              progress={progress}
              active={active}
              spin={!still}
              loadingLabel={dict.viewer.loading}
            />
          ) : null}
        </div>

        {/* Peredam. Tanpa ini judul harus bersaing dengan bagian paling gelap
            dari lanskap, dan salah satunya pasti kalah.

            Arahnya berbalik sejak halaman jadi terang: dulu ia menggelapkan
            latar supaya teks pucat terbaca, sekarang ia menerangkan latar supaya
            tinta gelap terbaca. Definisinya ada di `globals.css` dan disusun dari
            token, jadi ia ikut bergeser sendiri kalau temanya bergeser lagi. */}
        <div aria-hidden="true" className="scrim-hero pointer-events-none absolute inset-0 z-[3]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div data-hero-copy>
            <p className="kicker">{dict.landing.kicker}</p>

            <h1
              id="hero-title"
              className="mt-6 max-w-4xl font-display text-[2.75rem] leading-[1.04] text-ink sm:text-7xl lg:text-8xl"
            >
              {/* Jendela ber-overflow-hidden yang bergerak, bukan huruf per
                  huruf. Teksnya tetap satu blok utuh bagi pembaca layar dan
                  bagi Ctrl+F. */}
              <span data-reveal-line className="block overflow-hidden pb-[0.08em]">
                {/* `gold-sweep` duduk di span dalam, bukan di h1, dan itu
                    disengaja: span inilah yang digeser saat pembuka berjalan,
                    jadi pitanya ikut bergerak bersama huruf alih-alih tertinggal
                    di kotak induk yang diam. */}
                <span data-sweep className="gold-sweep block">
                  {dict.landing.heroTitle}
                </span>
              </span>
            </h1>

            <p
              data-hero-lead
              className="mt-8 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
            >
              {dict.landing.heroLead}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link data-hero-action href="#peta" className={buttonClass({ size: "lg" })}>
                {dict.landing.heroPrimary}
              </Link>
              <Link
                data-hero-action
                href="#tentang"
                className={buttonClass({ variant: "secondary", size: "lg" })}
              >
                {dict.landing.heroSecondary}
              </Link>
            </div>
          </div>

          {/* Bingkai tahan. Muncul saat kamera paling dekat dengan batu, lalu
              ikut pergi — supaya pertengahan perjalanan scroll tetap berupa
              komposisi yang disengaja, bukan setengah transisi. */}
          <div
            data-hero-hold
            className="mt-12 motion-safe:absolute motion-safe:inset-x-4 motion-safe:bottom-0 sm:motion-safe:inset-x-6"
          >
            <span aria-hidden="true" className="carved-edge" />
            {/* Angkanya dirender sebagai teks sungguhan dan `data-count` memegang
                nilai benarnya. Film-lah yang mencacahnya naik, karena film sudah
                memegang seluruh DOM hero — dua sistem yang menulis ke elemen yang
                sama adalah sumber bug yang mustahil ditelusuri.

                Tanpa JavaScript, atau dengan gerak dikurangi, angka ini tetap
                menyebut jumlah yang benar sejak frame pertama. */}
            <p className="mt-4 font-display text-2xl text-ink-soft sm:text-3xl">
              <span data-count={sites}>{sites}</span> {dict.landing.heroStatSites} ·{" "}
              <span data-count={continents}>{continents}</span>{" "}
              {dict.landing.heroStatContinents} · {dict.landing.heroStatTail}
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2">
          <IllustrationNote show={withMedia} label={dict.landing.illustration} />
          <p data-hero-hint className="text-[0.65rem] tracking-[0.2em] text-ink-dim uppercase">
            {dict.landing.scrollHint}
          </p>
        </div>
      </div>
    </section>
  );
}
