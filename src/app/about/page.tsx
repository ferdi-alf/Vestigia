import type { Metadata } from "next";
import Link from "next/link";
import { ACTIVE_CONTINENTS, HERITAGE, featuredHeritage } from "@/data/registry";
import { getI18n } from "@/lib/i18n/server";
import { ConceptFrame } from "@/concepts/shell/concept-frame";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClass } from "@/components/ui/button";
import { AtlasDoors } from "@/concepts/about/atlas-doors";
import { ABOUT_COPY } from "@/concepts/about/copy";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return {
    title: ABOUT_COPY.title[locale],
    description: ABOUT_COPY.lead[locale],
  };
}

/**
 * Tentang — apa aplikasi ini, dan atas aturan apa ia berdiri.
 *
 * Halaman tersendiri, bukan section di landing, dan itu keputusan pemilik
 * project. Ia juga rumah yang benar untuk peta benua: landing menjawab "apa
 * yang hilang", halaman ini menjawab "apa yang ada" — dan peta yang
 * menggambarkan bentuk koleksi adalah jawaban atas pertanyaan kedua.
 *
 * **Setiap angka di halaman ini dibaca dari registry saat render.** Sebuah
 * halaman "tentang" yang mengetikkan jumlah koleksi ke dalam kalimatnya adalah
 * halaman yang berbohong pada hari seseorang menambahkan warisan keenam belas.
 *
 * Chrome-nya datang dari `ConceptFrame` — navbar dan palet konsep A, sama
 * dengan landing, supaya keduanya terbaca sebagai satu situs. Footer sudah
 * dipasang `layout.tsx` untuk seluruh route di luar `/concepts`.
 */
export default async function AboutPage() {
  const { locale } = await getI18n();
  const heritage = featuredHeritage();

  /* Proyeksi sempit yang sama dengan landing: peta hanya butuh nama dan
     koordinat, bukan lima belas record lengkap dengan lini masa dan hotspot. */
  const points = HERITAGE.map((h) => ({
    slug: h.slug,
    name: h.name,
    country: h.country,
    continent: h.continent,
    lat: h.coordinates[0],
    lon: h.coordinates[1],
  }));

  const stats = [
    { value: String(HERITAGE.length), label: ABOUT_COPY.statSites[locale] },
    { value: String(ACTIVE_CONTINENTS.length), label: ABOUT_COPY.statContinents[locale] },
  ];

  return (
    <ConceptFrame concept="a" ctaHref={heritage ? `/heritage/${heritage.slug}` : "/#dunia"}>
      <div className="shell pt-28 pb-10 sm:pt-32">
        <PageHeader
          kicker={ABOUT_COPY.kicker[locale]}
          title={ABOUT_COPY.title[locale]}
          lead={ABOUT_COPY.lead[locale]}
        >
          <div className="flex gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-4xl leading-none text-ink tabular-nums sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2.5 text-[0.58rem] leading-none tracking-[0.18em] text-ink-dim uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </PageHeader>

        {/* ══ Cara kerjanya ═══════════════════════════════════════════ */}
        <section aria-labelledby="about-craft-title" className="mt-20 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span aria-hidden="true" className="carved-edge" />
            <p className="kicker mt-4">{ABOUT_COPY.craftKicker[locale]}</p>
            <h2
              id="about-craft-title"
              className="mt-4 font-display text-3xl leading-[1.06] text-ink sm:text-4xl"
            >
              {ABOUT_COPY.craftTitle[locale]}
            </h2>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <p className="text-base leading-[1.8] text-ink-muted">
              {ABOUT_COPY.craftBody[locale]}
            </p>

            <p className="mt-8 flex flex-wrap items-center gap-4">
              {heritage ? (
                <Link href={`/heritage/${heritage.slug}`} className={buttonClass({ size: "md" })}>
                  {heritage.name[locale]}
                </Link>
              ) : null}
              <Link
                href="/#dunia"
                className="text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {ABOUT_COPY.mapTitle[locale]}
              </Link>
            </p>
          </div>
        </section>
      </div>

      {/* ══ Peta, kartu, dan garis di antaranya ══════════════════════ */}
      <div className="shell">
        <AtlasDoors points={points} />
      </div>
    </ConceptFrame>
  );
}
