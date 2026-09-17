import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HERITAGE, allSlugs, getHeritage } from "@/data/registry";
import { THUMB_MANIFEST } from "@/data/generated/thumb-manifest";
import { getI18n, getLocale } from "@/lib/i18n/server";
import { HeritageViewer } from "@/components/three/heritage-viewer";
import { CollectionRail } from "@/components/workspace/collection-rail";
import { DetailPanel } from "@/components/workspace/detail-panel";
import { RelatedStrip } from "@/components/workspace/related-strip";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Hanya slug yang benar-benar punya asset 3D dan metadata yang dirender. */
export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const heritage = getHeritage(slug);
  if (!heritage) return {};
  const locale = await getLocale();
  return {
    title: heritage.name[locale],
    description: heritage.description[locale],
  };
}

/**
 * Workspace 3D — rail koleksi, penampil, panel, dan gambar pendamping.
 *
 * ```
 * ┌──────────┬────────────────────────────┬───────────┐
 * │ benua    │                            │ ringkasan │
 * │ ──────── │      object 3D             │ koordinat │
 * │ Borobudur│      (satu-satunya         │ fitur     │
 * │ Angkor   │       kanvas WebGL)        │ sumber    │
 * │ …15 nama │                            │ ───────── │
 * │          │                            │ 3 tombol  │
 * ├──────────┴────────────────────────────┴───────────┤
 * │  01   02   03   04   05   gambar pendamping       │
 * └───────────────────────────────────────────────────┘
 * ```
 *
 * **Tiga kolom tidak pernah ikut bergulir bersama halaman.** Masing-masing
 * punya guliran sendiri di dalam tinggi viewport, dan itu yang membedakan
 * workspace dari halaman dokumen: object 3D tidak boleh hilang dari layar
 * hanya karena seseorang membaca daftar sumber sampai bawah.
 *
 * **`data-concept="a"` dipasang di sini**, dan itu bukan sisa dari perkakas
 * perbandingan. Halaman ini hidup di luar `ConceptFrame`, jadi tanpa atribut
 * itu ia akan memakai palet situs utama sementara landing memakai krem Claude
 * — dua nada yang nyaris sama tetapi tidak sama, dan mata menangkap selisih
 * semacam itu justru karena ia kecil.
 *
 * `FloatingNav` sengaja TIDAK dipasang: tautannya anchor dalam halaman
 * (`#peta`, `#tentang`) yang tidak ada di sini, dan navbar yang menunjuk
 * ketiadaan lebih buruk daripada tidak ada navbar. Tautan kembali di kiri atas
 * yang mengerjakan tugasnya.
 *
 * **Satu konteks WebGL, seperti di mana pun di situs ini.** `HeritageViewer`
 * adalah satu-satunya kanvas; rail dan panel murni DOM.
 */
export default async function HeritagePage({ params }: Props) {
  const { slug } = await params;
  const heritage = getHeritage(slug);

  /* Slug tanpa asset 3D bukan halaman setengah jadi — ia memang tidak ada. */
  if (!heritage) notFound();

  const { locale, dict } = await getI18n();

  const entries = HERITAGE.map((h) => ({
    slug: h.slug,
    continent: h.continent,
    name: h.name,
    country: h.country,
    period: h.period,
    /* `undefined` kalau `make:thumbs` belum pernah dijalankan untuk situs ini,
       dan barisnya kembali ke bentuk tanpa gambar. Nol asumsi asset. */
    thumb: THUMB_MANIFEST[h.slug],
  }));

  /* Proyeksi sempit untuk Bandingkan: peramban tidak pernah menerima lima
     belas record lengkap hanya supaya sebuah pemilih punya daftar nama. */
  const all = HERITAGE.map((h) => ({ slug: h.slug, name: h.name, country: h.country }));

  return (
    <div data-concept="a" className="concept-ground">
      <div className="mx-auto w-full max-w-[112rem] px-3 pt-5 pb-10 sm:px-4">
        {/* Dibungkus jadi TOMBOL, bukan teks bertanda panah.

            Halaman ini tidak memasang navbar — object 3D yang menuntut seluruh
            lebar adalah alasannya — sehingga tautan ini satu-satunya jalan
            kembali. Sebagai teks polos di pojok kiri atas ia terbaca sebagai
            keterangan, bukan sebagai kontrol, dan pengguna tidak punya alasan
            mencobanya. Bingkai, permukaan, dan bidang sentuh yang jelas
            membuatnya mengumumkan dirinya sendiri. */}
        <Link
          href="/#dunia"
          className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 py-2 pr-4 pl-2.5 text-sm text-ink-muted transition-colors hover:border-line-strong hover:bg-raised hover:text-ink"
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-raised text-ink-soft transition-transform group-hover:-translate-x-0.5"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 8H3M7 4L3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {dict.nav.explore}
        </Link>

        {/* Pemilih object di PUNCAK pada layar sempit, mendatar.

            Sebelumnya ia daftar tegak setinggi 60svh di paling bawah halaman —
            harus ditemukan dengan menggulir melewati seluruh panel keterangan,
            dan begitu ditemukan ia memakan hampir seluruh layar untuk sesuatu
            yang tugasnya cuma memilih. Di puncak dan mendatar, kelima belas
            pilihan terbaca sebagai deretan gambar dan tidak merebut satu piksel
            pun dari object yang jadi subjek halaman ini. */}
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface xl:hidden">
          <CollectionRail
            entries={entries}
            activeSlug={heritage.slug}
            activeContinent={heritage.continent}
            layout="strip"
          />
        </div>

        <div className="mt-3 flex gap-3 xl:mt-2">
          {/* ── Rail koleksi. 268px — cukup untuk nama warisan terpanjang
              tanpa terpotong, dan tidak lebih. ──────────────────────── */}
          <aside className="hidden h-[72svh] w-[268px] flex-none overflow-hidden rounded-2xl border border-line bg-surface xl:block">
            <CollectionRail
              entries={entries}
              activeSlug={heritage.slug}
              activeContinent={heritage.continent}
            />
          </aside>

          {/* ── Penampil ────────────────────────────────────────────── */}
          <main className="min-w-0 flex-1">
            <div className="h-[72svh] overflow-hidden rounded-2xl border border-line">
              {/* `fill` supaya tinggi wadah ini benar-benar sampai ke kanvas.
                  Tanpanya tingginya datang dari aspect-ratio di dalam penampil,
                  dan latar panggung berhenti sebelum tepi bingkai ini.

                  `initialAutoRotate` karena di halaman ini object sedang
                  DIPERKENALKAN, bukan sedang diperiksa baris per baris — dan
                  putarannya tetap berhenti begitu pengguna menyentuhnya. */}
              <HeritageViewer
                heritage={heritage}
                fill
                initialAutoRotate
                idleLabel={dict.landing.stageIdle}
              />
            </div>
          </main>

          {/* ── Panel. 330px. ───────────────────────────────────────── */}
          <aside className="hidden h-[72svh] w-[330px] flex-none overflow-hidden rounded-2xl border border-line bg-surface xl:block">
            <DetailPanel heritage={heritage} all={all} />
          </aside>
        </div>

        {/* Di bawah 1280px ketiga kolom berhenti muat berdampingan, dan
            memampatkannya berarti ketiganya sama-sama tidak terbaca. Yang
            dipakai di sana: penampil tetap di atas, panel menyusul sebagai
            halaman penuh, rail jadi daftar di paling bawah. Ponsel adalah
            komposisi yang utuh, bukan desktop yang dipangkas — §9. */}
        <div className="mt-3 xl:hidden">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <DetailPanel heritage={heritage} all={all} />
          </div>
          <div className="mt-3 hidden h-[60svh] overflow-hidden rounded-2xl border border-line bg-surface">
            <CollectionRail
              entries={entries}
              activeSlug={heritage.slug}
              activeContinent={heritage.continent}
            />
          </div>
        </div>

        <RelatedStrip slug={heritage.slug} name={heritage.name[locale]} locale={locale} />
      </div>
    </div>
  );
}
