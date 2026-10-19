import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";
import { SiteFooter } from "@/components/shell/site-footer";
import { HERITAGE } from "@/data/registry";
import "./globals.css";
import { cn } from "@/lib/utils";

/* Serif display untuk judul, sans untuk UI. Dimuat lewat next/font supaya
   file font ikut di-host sendiri — tidak ada request ke domain pihak ketiga
   dan tidak ada pergeseran layout saat font tiba. */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Alamat kanonik situs.
 *
 * Dipakai Next untuk mengubah path gambar yang relatif jadi URL mutlak — dan
 * pratinjau sosial *wajib* mutlak, karena yang mengambilnya adalah server
 * WhatsApp atau X, bukan peramban yang sedang membuka halaman. Nilai bawaannya
 * localhost supaya pengembangan tetap jalan; setel NEXT_PUBLIC_SITE_URL saat
 * deploy.
 *
 * `||`, bukan `??`, dan bedanya bukan gaya penulisan: `.env.example` memuat
 * `NEXT_PUBLIC_SITE_URL=` tanpa nilai, jadi siapa pun yang menyalinnya —
 * persis seperti yang disuruh bab "Cara menjalankan" — mendapat string
 * KOSONG, bukan `undefined`. `??` meneruskan string kosong itu apa adanya,
 * dan `new URL("")` melempar `ERR_INVALID_URL` di setiap permintaan.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const META = {
  id: {
    title: "Vestigia — Jejak peradaban, dalam tiga dimensi",
    description:
      "Jelajahi warisan budaya dunia sebagai object 3D interaktif, dipandu AI yang menjawab berdasarkan data situsnya sendiri.",
    imageAlt: "Tepi batu terpahat tersinari matahari rendah",
  },
  en: {
    title: "Vestigia — Traces of civilisation, in three dimensions",
    description:
      "Explore the world's cultural heritage as interactive 3D objects, guided by an AI that answers from each site's own data.",
    imageAlt: "A carved stone edge lit by a low sun",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const meta = META[locale];

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: meta.title,
      template: "%s — Vestigia",
    },
    description: meta.description,
    applicationName: "Vestigia",
    keywords: [
      "warisan budaya",
      "world heritage",
      "3D",
      "cultural heritage",
      "situs bersejarah",
      "museum digital",
    ],
    openGraph: {
      type: "website",
      siteName: "Vestigia",
      locale: locale === "id" ? "id_ID" : "en_US",
      title: meta.title,
      description: meta.description,
      url: "/",
      /* JPEG, bukan WebP. Gambar aslinya WebP dan jauh lebih kecil, tetapi
         dukungan WebP pada pengambil pratinjau masih timpang — LinkedIn
         khususnya. Empat puluh lima kilobyte adalah harga yang pantas untuk
         tautan yang tampil benar di mana pun ia dibagikan. */
      images: [
        {
          url: "/images/og-cover.jpg",
          width: 1200,
          height: 630,
          alt: meta.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/images/og-cover.jpg"],
    },
  };
}

/* Warna bilah peramban dan skema kontrol natif. Keduanya nyata dan hidup —
   tidak ada yang membacanya dari token, jadi keduanya harus diperbarui tangan
   setiap kali dasar halaman bergeser. Nilainya menyalin `--color-paper`. */
export const viewport: Viewport = {
  themeColor: "#faf7f0",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, dict } = await getI18n();

  return (
    <html lang={locale} className={cn(display.variable, sans.variable, "font-sans")}>
      <body className="min-h-dvh bg-paper text-ink">
        <I18nProvider locale={locale}>
          <a
            href="#main"
            className="sr-only rounded-md bg-gold px-4 py-2 font-medium text-on-gold focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
          >
            {dict.nav.skipToContent}
          </a>
          {/* `SiteHeader` dihapus dari sini.

              Ia dipasang DI LUAR `[data-concept]`, jadi ia mewarisi tema akar
              (kapur situs utama) sementara halaman di bawahnya memakai palet
              konsep. Dua tema bertumpuk di satu layar, dan itulah pita putih
              yang terlihat nyasar di paling atas. Navbar konsep
              (`FloatingNav`) sudah melakukan pekerjaan yang sama di dalam
              palet yang benar.

              Toggle bahasanya IKUT PINDAH ke `FloatingNav` — ia satu-satunya
              kontrol dwibahasa ID/EN di seluruh situs, dan membuangnya
              bersama header berarti membuang fiturnya. */}
          <div className="flex min-h-dvh flex-col">
            <main id="main" className="flex-1">
              {children}
            </main>
            {/* Koleksi dibaca DI SINI, di server, lalu diteruskan sebagai
                daftar kecil berisi slug dan nama saja. `SiteFooter` adalah
                client component; mengimpor registry dari dalamnya berarti
                seluruh metadata dwibahasa lima belas situs ikut masuk ke bundle
                peramban demi empat tautan.

                Empat pertama menurut urutan manifest — bukan pilihan, melainkan
                potongan yang deterministik. Dengan nol GLB daftarnya kosong dan
                kolomnya tidak dirender sama sekali. */}
            <SiteFooter
              sites={HERITAGE.slice(0, 4).map((h) => ({ slug: h.slug, name: h.name }))}
            />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
