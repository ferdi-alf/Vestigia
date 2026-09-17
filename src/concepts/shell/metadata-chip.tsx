"use client";

import SpotlightCard from "@/components/SpotlightCard";
import { cn } from "@/lib/cn";

/**
 * Satu keping metadata — label kecil di atas, nilainya di bawah.
 *
 * Dipakai untuk koordinat, periode, dan peradaban di sekitar object 3D, dan
 * untuk kepadatan koleksi di tempat lain.
 *
 * ---
 *
 * **GARIS WARNA DI TEPI ATAS SUDAH DIBUANG.**
 *
 * Versi sebelumnya membawa `carved-edge`: satu garis setinggi satu piksel di
 * tepi atas, emas untuk `mark` dan abu untuk sisanya. Ia motif yang sah di
 * situs ini — tempat cahaya menyentuh tepi batu — tetapi pada keping sekecil
 * ini ia berhenti terbaca sebagai cahaya dan mulai terbaca sebagai garis
 * aksen yang ditempel. Pemilik project memintanya diganti, dan memintanya
 * diganti dengan komponen yang SUDAH ADA alih-alih dibuat sendiri lagi.
 *
 * Yang dipakai `SpotlightCard` dari registry React Bits. Ia membawa
 * mekanismenya sendiri — satu radial-gradient yang mengikuti pointer — jadi
 * pemisah antara keping dan latarnya tidak lagi butuh garis sama sekali.
 * Paletnya diganti token kita di `SpotlightCard.css`, sesuai §3.
 *
 * Yang ikut pergi bersamanya: properti kustom `--lit` dan kedua handler
 * pointer yang menulisnya. Sorot kini milik komponen registry, dan dua sistem
 * yang sama-sama menyalakan sorot pada elemen yang sama adalah persis jenis
 * kepemilikan ganda yang dilarang §6.
 */
export function MetadataChip({
  label,
  value,
  tone = "quiet",
  size = "md",
  hue,
  className,
  ...rest
}: {
  label: string;
  value: string;
  /** `quiet` untuk metadata biasa · `mark` untuk koordinat dan angka */
  tone?: "quiet" | "mark";
  /**
   * Hanya memengaruhi ukuran nilai bertipe `mark`.
   */
  size?: "md" | "sm";
  /** hue benua, kalau chip ini menandai satu wilayah */
  hue?: number;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">) {
  return (
    /* Pembungkus luar memegang `...rest`, dan itu bukan lapisan yang bisa
       dihapus: di `relic.tsx` keping ini adalah UJUNG BEAM, dan `data-beam`
       harus mendarat pada elemen yang benar-benar diukur `BeamField`.
       `SpotlightCard` hanya menerima `className` dan `children`, jadi atribut
       apa pun yang diteruskan pemanggil tidak punya jalan melewatinya.

       `className` pemanggil juga mendarat di SINI dan bukan di dalam: di
       `relic.tsx` ia memuat `lg:absolute lg:top-0 lg:right-0` — penempatan
       kartu terhadap wadah object. Kotak yang diukur beam dan kotak yang
       ditempatkan harus satu dan sama, kalau tidak garisnya menunjuk ke kotak
       yang bukan tempat kartunya berdiri.

       BUKAN `display: contents`: elemen tanpa kotak mengembalikan rect nol dari
       `getBoundingClientRect`, dan seluruh beam akan runtuh ke satu titik. */
    <div {...rest} className={className}>
      <SpotlightCard
        className={cn(
          "group rounded-xl px-3.5 pt-3 pb-2.5",
          /* Permukaan yang dipahat MASUK, bukan kartu yang melayang: nol
             bayangan jatuh, pemisahnya selisih nada. */
          "shadow-[inset_0_-1px_0_var(--color-line)]",
          tone === "mark" && "bg-gold/8",
        )}
      >
        <span className="flex items-center gap-1.5">
          {hue !== undefined ? (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: `oklch(0.48 0.13 ${hue})` }}
            />
          ) : null}
          <span className="text-[0.58rem] leading-none tracking-[0.18em] text-ink-dim uppercase">
            {label}
          </span>
        </span>

        <span
          className={cn(
            "mt-1.5 block leading-none text-ink",
            /* Angka dan koordinat memakai lebar digit tetap: tanpa itu, nilai
               yang berubah saat penanda berpindah akan menggeser lebar chip dan
               seluruh barisnya ikut bergoyang. */
            tone === "mark"
              ? ["font-display tabular-nums", size === "sm" ? "text-base" : "text-2xl"]
              : "text-sm leading-snug text-ink-soft",
          )}
        >
          {value}
        </span>
      </SpotlightCard>
    </div>
  );
}
