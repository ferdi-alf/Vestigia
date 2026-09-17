"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import SpotlightCard from "@/components/SpotlightCard";
import { BeamField, type BeamLink } from "@/concepts/shell/beam";
import { useI18n } from "@/lib/i18n/client";
import { useMotionTier } from "@/lib/motion/use-motion-tier";
import { EASE, gsap, useScrollScene } from "@/lib/motion/use-scroll-scene";
import { A_COPY } from "./copy";

/**
 * Pratinjau halaman warisan — satu tangkapan layar, empat garis yang menunjuk.
 *
 * ---
 *
 * **INI TANGKAPAN LAYAR, BUKAN TIRUAN.** `public/images/preview/heritage.jpg`
 * adalah potret halaman `/heritage/borobudur` yang sebenarnya, diambil pada
 * 1499x711. Membuat ulang tampilannya dengan div dan teks palsu akan jauh lebih
 * mudah dikendalikan — dan akan jadi klaim tentang produk yang tidak dijamin
 * oleh produknya. Aturan project ini menolak mengarang, dan itu berlaku untuk
 * gambar sama seperti untuk kalimat: kalau halamannya berubah, gambar ini
 * ketahuan basi, dan itu memang yang seharusnya terjadi.
 *
 * Bingkai peramban di sekelilingnya menampilkan PATH-nya saja, tanpa nama
 * domain. Domain yang diketik tangan adalah alamat yang belum tentu ada.
 *
 * ---
 *
 * **KENAPA PENANDANYA TERLIHAT, dan bukan span kosong di koordinat persen.**
 *
 * Catatan project ini sudah mencatat percobaan yang gagal: ujung beam berupa
 * `<span>` kosong yang dipatok pada koordinat persen menghasilkan "garis lurus
 * tanpa makna". Sebabnya bukan tekniknya melainkan maknanya — garis yang
 * berakhir di titik yang tidak menandai apa pun memang tidak menandai apa pun.
 *
 * Di sini titik-titik itu menandai wilayah yang SUNGGUHAN ada di gambar:
 * pemilih benua, daftar koleksi, tombol pemandu, tombol kuis. Jadi penandanya
 * dibuat terlihat — lingkaran bernomor yang sama dengan penanda hotspot di
 * penampil 3D — dan garisnya berangkat dari sesuatu yang bisa dilihat menuju
 * sesuatu yang bisa dibaca. Nomornya diulang di labelnya, sehingga hubungan
 * keduanya tetap terbaca bahkan kalau garisnya tidak pernah digambar.
 */

/**
 * Empat wilayah yang ditunjuk, dalam persen terhadap gambar.
 *
 * Angkanya dibaca dari tangkapan layarnya sendiri pada 1499x711 — pemilih benua
 * di kiri atas, daftar koleksi tepat di bawahnya, dan kedua tombol panel di
 * kanan bawah. Kalau gambarnya diganti, keempat angka ini ikut disetel; itu
 * konsekuensi wajar dari memakai potret sungguhan alih-alih tiruan.
 */
const MARKS = [
  { id: "benua", at: { left: "9.5%", top: "14%" }, side: "left" as const },
  { id: "koleksi", at: { left: "9.5%", top: "44%" }, side: "left" as const },
  { id: "pemandu", at: { left: "81%", top: "70%" }, side: "right" as const },
  { id: "kuis", at: { left: "92%", top: "70%" }, side: "right" as const },
];

/**
 * Siku 90 derajat, bukan busur — dan cahayanya menyapu sekali.
 *
 * `variant="beam"` membawa cahaya yang bergerak di sepanjang garis; `"leader"`
 * yang dipakai section "Yang Hilang" tidak. Bedanya disengaja: di sana garisnya
 * survei yang kering, di sini ia menunjuk ke dalam sebuah gambar dan butuh
 * sesuatu yang menarik mata menyusurinya.
 *
 * Menyapu SEKALI, bukan berulang. Cahaya yang berdenyut selamanya adalah gerak
 * yang berjalan sendiri tanpa pemicu — dilarang §4 — dan pada empat garis
 * sekaligus ia berhenti jadi penunjuk dan mulai jadi hiasan.
 *
 * `delay` menaikkannya beruntun supaya keempatnya terbaca sebagai satu benda
 * yang sedang dirakit, bukan empat garis yang kebetulan muncul bersamaan.
 *
 * **`vertical-first`, dan labelnya sengaja DIGESER dari penandanya.** Sebuah
 * siku hanya terlihat bersiku kalau kedua ujungnya berbeda tinggi: percobaan
 * pertama menaruh label sejajar penandanya dan hasilnya terukur — dua dari
 * empat garis berbeda tinggi hanya 8 dan 5 piksel, jadi kakinya yang kedua
 * praktis nol dan yang tergambar garis lurus biasa. Tiap label kini ditempatkan
 * pada ketinggian yang jelas berbeda dari penandanya, dan kaki tegaknya
 * berangkat di kolom label — di LUAR gambar, bukan melintasinya. */
const LINKS: BeamLink[] = MARKS.map((mark, index) => ({
  from: `pv-label-${mark.id}`,
  to: `pv-mark-${mark.id}`,
  shape: "elbow",
  elbow: "vertical-first",
  delay: index * 0.22,
}));

function Label({
  id,
  index,
  title,
  body,
  className,
}: {
  id: string;
  index: number;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    /* `data-beam` dan penempatannya mendarat di pembungkus luar, bukan di dalam
       `SpotlightCard` — kotak yang diukur beam dan kotak yang ditempatkan harus
       satu dan sama. Pola yang sama dengan `MetadataChip`. */
    <div data-beam={`pv-label-${id}`} data-pv-label className={className}>
      <SpotlightCard className="rounded-xl px-4 py-3.5">
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-gold bg-gold text-[0.6rem] font-medium text-on-gold"
          >
            {index + 1}
          </span>
          <span className="font-display text-base leading-tight text-ink">{title}</span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">{body}</p>
      </SpotlightCard>
    </div>
  );
}

export function Preview() {
  const { locale } = useI18n();
  const root = useRef<HTMLElement>(null);
  /* Ruang koordinat beam: ia memuat kedua kolom label DAN bingkainya. Keduanya
     wajib berbagi satu container, kalau tidak garisnya mengukur terhadap kotak
     yang berbeda dan menunjuk ke tempat yang salah. */
  const scope = useRef<HTMLDivElement>(null);
  const [built, setBuilt] = useState(false);
  const tier = useMotionTier();

  useScrollScene(
    ({ still }, node) => {
      if (still) {
        setBuilt(true);
        return;
      }

      gsap.set(node.querySelectorAll("[data-pv-label]"), { opacity: 0 });

      gsap
        .timeline({
          defaults: { ease: EASE.enter },
          scrollTrigger: { trigger: node, start: "top 74%", once: true },
        })
        .from("[data-reveal]", { autoAlpha: 0, y: 22, duration: 0.6, stagger: 0.08 }, 0)
        .from("[data-pv-frame]", { autoAlpha: 0, y: 26, scale: 0.97, duration: 0.85 }, 0.15)
        .from("[data-pv-mark]", { autoAlpha: 0, scale: 0.4, duration: 0.4, stagger: 0.1 }, 0.7)
        /* Label hanya `opacity`. Menggesernya dengan `y` berarti garisnya
           menunjuk ke tempat label itu berada sedetik yang lalu — `BeamField`
           mengukur sekali lalu men-cache. */
        .to("[data-pv-label]", { opacity: 1, duration: 0.45, stagger: 0.12 }, 0.95)
        /* Garis baru boleh diukur setelah kedua ujungnya berdiri diam. */
        .add(() => setBuilt(true), 1.5);
    },
    root,
    [],
  );

  return (
    <section
      ref={root}
      id="pratinjau"
      aria-labelledby="a-preview-title"
      className="relative py-24 sm:py-32"
    >
      <div className="shell">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <span data-reveal aria-hidden="true" className="carved-edge" />
            <p data-reveal className="kicker mt-4">
              {A_COPY.previewKicker[locale]}
            </p>
            <h2
              data-reveal
              id="a-preview-title"
              className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-5xl"
            >
              {A_COPY.previewTitle[locale]}
            </h2>
          </div>
          <p
            data-reveal
            className="text-sm leading-[1.75] text-ink-muted lg:col-span-4 lg:col-start-9"
          >
            {A_COPY.previewLead[locale]}
          </p>
        </div>

        {/* Bingkai dipusatkan, label ditempatkan ABSOLUT dari `lg` ke atas.

            Kisi dua kolom tidak bisa memberi jarak tegak yang dibutuhkan siku:
            ia merapikan label sejajar penandanya, dan siku yang kedua ujungnya
            sejajar tidak punya kaki kedua. Di bawah `lg` semuanya kembali ke
            aliran normal dan garisnya memang tidak digambar. */}
        <div
          ref={scope}
          className="relative mt-12 lg:flex lg:min-h-[32rem] lg:items-center lg:justify-center"
        >
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:block">
            <Label
              id="benua"
              index={0}
              title={A_COPY.previewBenuaLabel[locale]}
              body={A_COPY.previewBenuaBody[locale]}
              className="lg:absolute lg:top-[2%] lg:left-0 lg:w-[21%]"
            />
            <Label
              id="koleksi"
              index={1}
              title={A_COPY.previewKoleksiLabel[locale]}
              body={A_COPY.previewKoleksiBody[locale]}
              className="lg:absolute lg:top-[58%] lg:left-0 lg:w-[21%]"
            />
            <Label
              id="pemandu"
              index={2}
              title={A_COPY.previewPemanduLabel[locale]}
              body={A_COPY.previewPemanduBody[locale]}
              className="lg:absolute lg:top-[10%] lg:right-0 lg:w-[21%]"
            />
            <Label
              id="kuis"
              index={3}
              title={A_COPY.previewKuisLabel[locale]}
              body={A_COPY.previewKuisBody[locale]}
              className="lg:absolute lg:top-[70%] lg:right-0 lg:w-[21%]"
            />
          </div>

          {/* ══ Bingkai peramban ═════════════════════════════════════ */}
          <div
            data-pv-frame
            className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_1px_0_var(--color-line)] lg:w-[54%]"
          >
            {/* Bilah judul. Tiga titik dan sebuah path — TANPA nama domain,
                karena domain yang diketik tangan adalah alamat yang belum tentu
                ada. Yang ditampilkan route sungguhan halaman itu. */}
            <div className="flex items-center gap-3 border-b border-line bg-raised/50 px-3.5 py-2.5">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong/35" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong/35" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong/35" />
              </span>
              <span className="min-w-0 flex-1 truncate rounded-md bg-surface px-2.5 py-1 text-center text-[0.65rem] text-ink-dim">
                /heritage/borobudur
              </span>
            </div>

            {/* Rasio dipotong dari 1499x711 supaya deret bingkai gambar kosong
                di kaki halaman tidak ikut terbawa — yang diceritakan section ini
                ruang kerjanya, bukan slot yang belum terisi. */}
            <div className="relative aspect-[1499/586]">
              <Image
                src="/images/preview/heritage.jpg"
                alt={A_COPY.previewShot[locale]}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-top"
              />

              {MARKS.map((mark, index) => (
                <span
                  key={mark.id}
                  data-beam={`pv-mark-${mark.id}`}
                  data-pv-mark
                  aria-hidden="true"
                  style={mark.at}
                  className="absolute z-[2] flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-gold text-[0.65rem] font-medium text-on-gold shadow-sm"
                >
                  {index + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Garis hanya dari `lg` ke atas.

              Di bawah itu label dan bingkainya bertumpuk dalam satu kolom, dan
              siku 90 derajat di antara mereka akan melintasi teks — yang
              dilarang aturan beam project ini. Hubungannya tetap tersampaikan di
              sana lewat nomor yang sama di penanda dan di labelnya. */}
          {built && tier === "full" ? (
            <BeamField container={scope} links={LINKS} className="z-[1] text-gold" />
          ) : null}
        </div>
      </div>
    </section>
  );
}
