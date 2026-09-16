"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Label kecil: koordinat, periode, peradaban, jumlah.
 *
 * Ia ada karena kepadatan visual di konsep A harus datang dari SESUATU YANG
 * MENYEBUTKAN sesuatu, bukan dari bentuk yang mengisi ruang. Tiap chip membawa
 * satu fakta yang dibaca langsung dari data warisan, jadi menambahkannya
 * menambah informasi — bukan hanya menambah benda di layar.
 *
 * ---
 *
 * **DIROMBAK, karena versi sebelumnya memang polos.** Yang dikeluhkan pemilik
 * project tepat: "hanya rounded lalu kasih warna atau line warna lalu text".
 * Label dan nilainya berukuran nyaris sama, dibungkus border penuh, dan tidak
 * ada satu pun yang membedakan angka dari keterangannya.
 *
 * Tiga hal diubah, dan ketiganya pola yang diambil dari katalog 21st.dev —
 * *Label Badges* dan *Badge* (micka_design): label kecil, nilai menonjol,
 * penanda warna di kiri. **Polanya, bukan kodenya**: `installCommand` di sana
 * menuntut `$API_KEY_21ST` yang tidak ada, dan semuanya lewat `npx shadcn add`
 * yang menarik Radix — dependency yang `CLAUDE.md §3` larang. Yang diambil
 * susunannya, warnanya tetap token kita.
 *
 * 1. **Nilainya jadi subjek.** Naik ke ukuran display dengan `tabular-nums`;
 *    labelnya turun jadi huruf kapital renggang di atasnya. Sekarang "15"
 *    terbaca sebagai angka, bukan sebagai baris kedua sebuah kalimat.
 * 2. **Tepi terpahat, bukan border penuh.** Satu garis emas tipis di tepi
 *    atas — motif `carved-edge` yang sudah dipakai di seluruh situs. Border
 *    yang mengelilingi membuat setiap chip terbaca sebagai tombol.
 * 3. **`.raking-card` diaktifkan.** Sapuan cahaya dari KIRI menyala saat chip
 *    disentuh pointer — arah yang sama dengan matahari di seluruh situs ini.
 *    Kelasnya sudah ada di `globals.css` sejak lama tetapi tidak pernah dipakai
 *    konsep A; mengaktifkannya sekaligus menutup pelanggaran §4 soal kode yatim.
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
   * Ukuran nilai `mark`. Bawaannya `md`, jadi nol pemanggil lama berubah.
   *
   * `sm` ada untuk satu kasus yang konkret: kartu sempit. Koordinat penuh
   * — `7.61°S  110.20°E` — pada `text-2xl` membungkus jadi dua baris di kartu
   * selebar 140px, dan kartunya tumbuh jadi 101px sementara dua tetangganya
   * 76px. Satu kartu yang lebih tinggi daripada barisannya membaca sebagai
   * kesalahan tata letak, bukan sebagai penekanan.
   */
  size?: "md" | "sm";
  /** hue benua, kalau chip ini menandai satu wilayah */
  hue?: number;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">) {
  const node = useRef<HTMLDivElement>(null);

  /* Sorotnya menyala dan padam, TIDAK mengikuti posisi pointer — dan itu
     keputusan yang sudah diambil sebelumnya, bukan penyederhanaan. Sumber
     cahaya di situs ini dikunci dari KIRI; sorot yang mengejar pointer berarti
     matahari yang berpindah tiap kali tangan bergerak, dan itu mematahkan satu
     hal yang paling menyatukan halaman ini.

     Ditulis lewat ref, bukan `setState`: satu boolean yang berubah dua kali per
     hover tidak layak merender ulang pohon komponen. */
  const lit = (on: boolean) => () => {
    node.current?.style.setProperty("--lit", on ? "1" : "0");
  };

  return (
    <div
      ref={node}
      {...rest}
      onPointerEnter={lit(true)}
      onPointerLeave={lit(false)}
      className={cn(
        "raking-card group relative isolate overflow-hidden rounded-xl px-3.5 pt-3 pb-2.5",
        /* Permukaan yang dipahat MASUK, bukan kartu yang melayang: nol bayangan
           jatuh, pemisahnya selisih nada plus satu garis di bawah. */
        "bg-surface/80 shadow-[inset_0_-1px_0_var(--color-line)]",
        tone === "mark" && "bg-gold/8",
        className,
      )}
    >
      {/* Tepi terpahat. Satu garis tempat cahaya menyentuh batu — motif yang
          sama dengan garis emas di kartu warisan dan di bawah judul. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-px",
          tone === "mark" ? "bg-gold/70" : "bg-line-strong/30",
        )}
      />

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
    </div>
  );
}
