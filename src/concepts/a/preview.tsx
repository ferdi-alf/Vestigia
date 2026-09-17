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
 * **GARIS BERHENTI DI TEPI BINGKAI, dan tidak pernah masuk ke gambar.**
 *
 * Versi pertama menaruh empat penanda bernomor DI DALAM tangkapan layar — di
 * atas pemilih benua, daftar koleksi, dan kedua tombol panel — lalu menarik
 * garis dari label ke masing-masing penanda. Nomornya diulang di label supaya
 * pasangannya tetap terbaca.
 *
 * Pemilik project memotongnya, dan alasannya berdiri sendiri begitu dilihat:
 * gambar itu tangkapan layar sebuah ANTARMUKA. Menumpuk lingkaran emas
 * bernomor di atasnya menambahkan chrome yang bukan bagian dari produk, tepat
 * di tempat yang seluruh maksudnya memperlihatkan produk apa adanya — dan
 * garis yang menembus masuk memperlakukan tangkapan layar itu sebagai kanvas
 * gambar alih-alih sebagai jendela.
 *
 * Sekarang keempat garis berakhir pada TEPI bingkai peramban, di sisi yang
 * menghadap labelnya, masing-masing pada ketinggian yang berbeda. Titik
 * pendaratannya disetel lewat `toEdgeAt` supaya keempatnya tidak menumpuk jadi
 * satu garis bercabang — mekanisme yang sama yang sudah dipakai tiga keterangan
 * di section "Yang Hilang". Yang dikatakan garisnya berubah dari "lihat piksel
 * ini" jadi "yang ini ada di dalam sana", dan kalimat kedua itu memang yang
 * dibawa teks labelnya.
 */

/**
 * Empat siku, semuanya berakhir di tepi bingkai.
 *
 * `toEdgeAt` adalah di mana tiap garis mendarat pada sisi bingkai, 0 di
 * puncaknya dan 1 di kakinya. Keempatnya dipisahkan supaya ruas mendatarnya
 * tidak saling menimpa — dua di satu sisi yang mendarat di titik yang sama
 * terbaca sebagai satu garis bercabang, bukan sebagai dua hubungan.
 *
 * **Angkanya sengaja MELESET dari ketinggian labelnya, dan itu syarat bentuk.**
 * Percobaan pertama menyelaraskannya, dan hasilnya terukur: dua dari empat
 * garis punya kaki tegak hanya 5,8 dan 5,4 piksel — di layar keduanya garis
 * lurus biasa. Setelah digeser, keempat kakinya 53, 55, 60, dan 56 piksel, dan
 * sikunya baru benar-benar terbaca sebagai siku.
 *
 * Sisi keberangkatan dan kedatangan tidak perlu disetel: `BeamField`
 * menurunkannya dari posisi relatif kedua kotak, jadi label kiri mendarat di
 * tepi kiri dan label kanan di tepi kanan tanpa satu pun cabang khusus.
 *
 * `variant="beam"` membawa cahaya yang bergerak di sepanjang garis; `"leader"`
 * yang dipakai section "Yang Hilang" tidak. Bedanya disengaja: di sana garisnya
 * survei yang kering, di sini ia menunjuk ke sebuah jendela dan butuh sesuatu
 * yang menarik mata menyusurinya.
 *
 * Menyapu SEKALI, bukan berulang. Cahaya yang berdenyut selamanya adalah gerak
 * yang berjalan sendiri tanpa pemicu — dilarang §4 — dan pada empat garis
 * sekaligus ia berhenti jadi penunjuk dan mulai jadi hiasan.
 *
 * `delay` menaikkannya beruntun supaya keempatnya terbaca sebagai satu benda
 * yang sedang dirakit, bukan empat garis yang kebetulan muncul bersamaan.
 *
 * **Labelnya sengaja DIGESER tinggi-rendah.** Sebuah siku hanya terlihat
 * bersiku kalau kedua ujungnya berbeda tinggi: percobaan pertama menaruh label
 * sejajar tujuannya dan hasilnya terukur — dua dari empat garis berbeda tinggi
 * hanya 8 dan 5 piksel, jadi kakinya yang kedua praktis nol dan yang tergambar
 * garis lurus biasa.
 */
const LINKS: BeamLink[] = [
  { from: "pv-label-benua", toEdgeAt: 0.2 },
  { from: "pv-label-koleksi", toEdgeAt: 0.44 },
  { from: "pv-label-pemandu", toEdgeAt: 0.42 },
  { from: "pv-label-kuis", toEdgeAt: 0.64 },
].map((link, index) => ({
  ...link,
  to: "pv-frame",
  shape: "elbow" as const,
  elbow: "vertical-first" as const,
  delay: index * 0.22,
}));

function Label({
  id,
  title,
  body,
  className,
}: {
  id: string;
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
        <p className="font-display text-base leading-tight text-ink">{title}</p>
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
              title={A_COPY.previewBenuaLabel[locale]}
              body={A_COPY.previewBenuaBody[locale]}
              className="lg:absolute lg:top-[2%] lg:left-0 lg:w-[21%]"
            />
            <Label
              id="koleksi"
              title={A_COPY.previewKoleksiLabel[locale]}
              body={A_COPY.previewKoleksiBody[locale]}
              className="lg:absolute lg:top-[58%] lg:left-0 lg:w-[21%]"
            />
            <Label
              id="pemandu"
              title={A_COPY.previewPemanduLabel[locale]}
              body={A_COPY.previewPemanduBody[locale]}
              className="lg:absolute lg:top-[10%] lg:right-0 lg:w-[21%]"
            />
            <Label
              id="kuis"
              title={A_COPY.previewKuisLabel[locale]}
              body={A_COPY.previewKuisBody[locale]}
              className="lg:absolute lg:top-[70%] lg:right-0 lg:w-[21%]"
            />
          </div>

          {/* ══ Bingkai peramban ═════════════════════════════════════ */}
          <div
            data-pv-frame
            data-beam="pv-frame"
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
                ruang kerjanya, bukan slot yang belum terisi.

                Tidak ada satu pun lapisan di atas gambar ini. Empat penanda
                bernomor yang dulu duduk di sini sudah dilepas bersama nomornya
                di label — lihat catatan di kepala berkas. */}
            <div className="relative aspect-[1499/586]">
              <Image
                src="/images/preview/heritage.jpg"
                alt={A_COPY.previewShot[locale]}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-top"
              />
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
