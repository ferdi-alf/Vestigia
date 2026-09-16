import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Satu bentuk tombol untuk seluruh aplikasi.
 *
 * Sebelum berkas ini ada, setiap tombol ditulis inline di tempatnya masing-masing,
 * dan hasilnya empat ukuran berbeda untuk peran yang sama persis: `px-7 py-3`,
 * `px-8 py-3.5`, `px-5 py-2`, dan `px-4 py-1.5`. Yang terakhir itu tingginya
 * sekitar 28 px — di bawah target sentuh yang layak.
 *
 * Dipisah jadi `buttonClass` dan `Button` dengan sengaja, bukan lewat `asChild`
 * ala Radix. Alasannya satu: `Link` milik Next perlu tetap jadi `Link` supaya
 * prefetch dan navigasi kliennya jalan. Membungkusnya dalam komponen tombol
 * berarti mengkloning elemen dan menebak propnya; memberinya `className` tidak.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden " +
  "whitespace-nowrap rounded-full font-medium " +
  "transition-[background-color,border-color,color,transform] duration-200 " +
  "active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-45";

const VARIANT: Record<ButtonVariant, string> = {
  /* Satu-satunya isian pekat di halaman. Dipakai sekali per layar, tidak lebih —
     dua aksi emas yang berdampingan berarti tidak ada yang utama.

     Di atas kertas, hover berarti lebih GELAP, bukan lebih terang: `gold-soft`
     dan `gold-dim` keduanya lebih pekat daripada `gold`. Menyalin arah dari tema
     gelap akan membuat tombol memudar justru saat pengguna menyentuhnya. */
  /* `.sheen` menambahkan satu pita cahaya yang melintas SEKALI saat tombol
     disentuh — pola "shiny button" dari katalog 21st.dev, ditulis dengan token
     kita. Tombolnya selama ini cuma isian rata yang berganti warna.

     Bukan `.gold-sweep`: kelas itu menyapu TEKS lewat `background-clip: text`
     dan akan menghapus label tombol berisi. Dua pekerjaan yang terdengar mirip
     dengan mekanisme yang sama sekali berbeda. */
  primary: "sheen bg-gold text-on-gold hover:bg-gold-soft active:bg-gold-dim",
  /* Tepinya memakai `line-strong`, yang mencapai 5,14:1 terhadap kertas dan tidak
     pernah turun di bawah 3,32:1 di permukaan mana pun. */
  /* Tepinya MENGUAT saat disentuh, bukan sekadar berganti warna: `inset` ring
     kedua muncul di dalam border yang sudah ada, sehingga garisnya terbaca
     lebih tebal tanpa menggeser satu piksel pun tata letak. Menebalkan
     `border-width` akan menggesernya. */
  secondary:
    "border border-line-strong text-ink-soft transition-shadow " +
    "hover:border-ink-dim hover:bg-raised/60 hover:text-ink " +
    "hover:shadow-[inset_0_0_0_1px_var(--color-line-strong)]",
  ghost: "text-ink-muted hover:bg-raised/60 hover:text-ink",
};

/**
 * Tinggi dikunci, bukan diturunkan dari padding vertikal.
 *
 * `py-` membuat tinggi bergantung pada ukuran font dan tinggi baris, sehingga
 * tombol yang labelnya lebih panjang atau berbahasa lain bisa diam-diam menyusut
 * di bawah ambang target sentuh. `h-` tidak bisa.
 */
const SIZE: Record<ButtonSize, string> = {
  sm: "h-11 px-5 text-sm",
  md: "h-12 px-7 text-sm",
  lg: "h-14 px-8 text-base",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(BASE, VARIANT[variant], SIZE[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant, size, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...rest} />;
}
