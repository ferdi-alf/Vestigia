"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LocalizedText } from "@/data/types";
import { useI18n } from "@/lib/i18n/client";

/** Tahun di baris hak cipta.

    Ditulis sebagai konstanta, bukan `new Date().getFullYear()`. Komponen ini
    dirender di server DAN di klien; sebuah nilai yang bisa berbeda di antara
    keduanya adalah ketidakcocokan hidrasi yang menunggu pergantian tahun, dan
    `react-hooks/purity` menolak pembacaan jam di dalam render dengan benar. */
const YEAR = 2026;

/** Nama merek, dipecah per huruf untuk lockup raksasa di kaki footer. */
const WORDMARK = ["V", "E", "S", "T", "I", "G", "I", "A"];

export interface FooterSite {
  slug: string;
  name: LocalizedText;
}

/**
 * Kaki halaman.
 *
 * Susunannya tiga lapis, dan tiap lapis mengerjakan satu hal:
 *
 *     atas     merek dan tiga kolom tautan, tiap kolom dibuka garis rambut
 *     tengah   lockup VESTIGIA raksasa, berongga, terpotong garis di bawahnya
 *     bawah    satu baris hak cipta
 *
 * **Tidak ada ikon media sosial**, dan itu keputusan pemilik project. Akun yang
 * ditautkan harus benar-benar ada; ikon yang menuju `#` adalah klaim palsu
 * tentang project ini, dan aturan yang sama yang melarang AI-nya mengarang juga
 * berlaku untuk tautan.
 *
 * ---
 *
 * **Lockup raksasa itu motif `carved-edge`, bukan hiasan.**
 *
 * Isinya dikosongkan dan hanya tepinya yang digambar — huruf yang dipahat ke
 * permukaan, bukan huruf yang dicetak di atasnya. Ia dipotong garis pemisah di
 * bawahnya persis seperti prasasti yang tenggelam ke dalam tanah, dan itu
 * gambar harfiah dari premis situs ini: yang tersisa dari sebuah nama adalah
 * bekasnya.
 *
 * Hurufnya dipecah satu-satu dan dibagi dengan `justify-between`, bukan
 * dilebarkan dengan `letter-spacing`. Bedanya menentukan: `letter-spacing`
 * menambah jarak yang SAMA di tiap sela, jadi lebar totalnya bergantung pada
 * metrik font dan tidak pernah persis selebar wadahnya. `justify-between`
 * membagi sisa ruang, jadi huruf pertama dan terakhir selalu duduk tepat di
 * kedua tepi berapa pun lebar layarnya.
 *
 * `aria-hidden` karena ia pengulangan: nama yang sama sudah dibaca di blok
 * merek di atasnya, dan delapan huruf terpisah adalah delapan hal yang harus
 * dieja pembaca layar tanpa satu pun informasi tambahan.
 *
 * ---
 *
 * **Kolom koleksi datang dari server**, sebagai daftar kecil berisi slug dan
 * nama saja. Berkas ini client component — ia butuh `usePathname` dan pemilih
 * bahasa — dan mengimpor registry dari sini berarti seluruh metadata dwibahasa
 * lima belas situs ikut masuk ke bundle peramban untuk empat tautan.
 *
 * Dengan nol GLB daftarnya kosong dan kolomnya tidak dirender sama sekali. §2:
 * aplikasi harus jalan dengan nol asset, dan kolom kosong berjudul "Koleksi"
 * adalah janji yang tidak ditepati.
 */
export function SiteFooter({ sites = [] }: { sites?: FooterSite[] }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();

  /* Sama alasannya dengan SiteHeader: tiap konsep menutup halamannya dengan
     caranya sendiri, dan footer situs utama yang menempel di bawah ketiganya
     akan menyamarkan justru bagian yang paling harus dibandingkan. */
  if (pathname.startsWith("/concepts")) return null;

  return (
    <footer className="border-t border-line/70 bg-void">
      <div className="shell pt-14 pb-0 sm:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <p className="font-display text-2xl leading-none text-ink">{dict.brand}</p>
            <p className="mt-3 max-w-[24rem] text-sm leading-[1.7] text-ink-muted">
              {dict.tagline}
            </p>
          </div>

          <Column
            heading={dict.nav.explore}
            className="lg:col-span-3 lg:col-start-6"
            links={[
              { href: "/#yang-hilang", label: dict.nav.lost },
              { href: "/#dunia", label: dict.nav.explore },
              { href: "/#pratinjau", label: dict.footer.preview },
            ]}
          />

          {sites.length > 0 ? (
            <Column
              heading={dict.footer.collection}
              className="lg:col-span-2"
              links={sites.map((site) => ({
                href: `/heritage/${site.slug}`,
                label: site.name[locale],
              }))}
            />
          ) : null}

          <Column
            heading={dict.footer.project}
            className="lg:col-span-2"
            links={[{ href: "/about", label: dict.nav.about }]}
          />
        </div>

        {/* Lockup raksasa. `overflow-hidden` DAN margin bawah negatif: yang
            memotong huruf adalah tepi wadah ini, dan margin negatiflah yang
            menaikkan garis pemisah di bawahnya sampai ke dalam badan huruf.
            Tanpa keduanya bersamaan, huruf berdiri utuh di atas garis dan
            kesannya teks besar biasa, bukan sesuatu yang tenggelam.

            Potongannya 0,17em — sekitar seperempat tinggi huruf. Pada 0,09em
            garisnya cuma menyerempet alas huruf, dan yang terbaca teks besar
            yang kebetulan berhimpit dengan pemisah, bukan nama yang tenggelam
            ke dalamnya. */}
        <div aria-hidden="true" className="mt-14 overflow-hidden sm:mt-16">
          <p
            /* Isinya kosong, tepinya digambar. `-webkit-text-fill-color`, bukan
               `color: transparent` — dengan begitu `color` tetap membawa warna
               token dan `currentColor` bisa dipakai untuk goresannya, sehingga
               satu deklarasi warna melayani keduanya.

               Kalau peramban tidak mengenal keduanya, hurufnya jatuh ke teks
               pekat dalam warna yang sama: masih terbaca sebagai lockup, cuma
               tidak berongga. Tidak ada yang hilang selain efeknya.

               Goresannya 1,75px pada 70% `--color-line-strong`. Pada 1px dan
               40% ia praktis hilang di layar terang — huruf setinggi dua ratus
               piksel yang digariskan setipis itu terbaca sebagai bayangan,
               bukan sebagai pahatan. */
            className="-mb-[0.17em] flex justify-between font-display leading-[0.76] text-line-strong/70 [-webkit-text-fill-color:transparent] [-webkit-text-stroke:1.75px_currentColor] text-[clamp(2.75rem,13.6vw,12.5rem)]"
          >
            {WORDMARK.map((letter, index) => (
              <span key={index}>{letter}</span>
            ))}
          </p>
        </div>
      </div>

      <div className="border-t border-line-strong/25">
        <div className="shell py-5">
          <p className="text-xs leading-relaxed text-ink-dim">
            &copy; {YEAR} {dict.brand} &mdash; {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Satu kolom tautan, dibuka garis rambut.
 *
 * Garisnya di ATAS judul, bukan di bawahnya: ia membuka kolom alih-alih
 * memisahkan judul dari isinya, dan tiga garis sejajar di ketinggian yang sama
 * adalah yang mengikat ketiga kolom jadi satu baris. Motif `strata`.
 */
function Column({
  heading,
  links,
  className,
}: {
  heading: string;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <nav aria-label={heading} className={className}>
      <span aria-hidden="true" className="block h-px w-full bg-line-strong/30" />
      <p className="mt-4 font-display text-lg leading-none text-ink">{heading}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
