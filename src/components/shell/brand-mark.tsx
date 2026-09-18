import { cn } from "@/lib/cn";

/**
 * Lambang Vestigia — tanda survei.
 *
 * Satu lingkaran dengan empat tanda bidik di keempat arah mata angin: bentuk
 * yang sama dengan penanda koordinat di peta dunia dan dengan motif
 * `coordinate-mark` yang diminta setiap section membawanya. Ia menyebut "ini
 * catatan survei atas sesuatu yang benar-benar ada di suatu tempat" — tesis
 * situs ini, bukan lencana yang kebetulan bagus.
 *
 * ---
 *
 * **Bentuk ini SUDAH ada di repo, dan itu sebabnya berkas ini lahir.**
 * `floating-nav.tsx` menggambarnya inline untuk konsep C. Menyalinnya sekali
 * lagi untuk favicon dan sekali lagi untuk navbar konsep A berarti tiga gambar
 * yang harus diubah bersamaan dan pasti tidak akan. Yang dipakai bersama
 * komponen ini; `src/app/icon.svg` tetap berkas tersendiri karena favicon tidak
 * pernah melewati React, dan bentuknya dijaga sama di sana secara sadar.
 *
 * Warnanya `currentColor`, jadi satu lambang melayani ketiga palet konsep tanpa
 * tahu apa-apa tentang ketiganya — aturan yang sama yang berlaku untuk beam.
 *
 * **`transform-box: view-box` bukan detail yang bisa dihilangkan.** Tanpa itu
 * `transform-origin: center` pada elemen SVG diukur terhadap kotak pembatas
 * path-nya sendiri, bukan terhadap viewBox, dan keempat tanda bidik akan
 * memuai dari titik yang berbeda-beda alih-alih dari pusat lingkaran.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      className={cn("h-4 w-4 shrink-0", className)}
    >
      <circle cx="8" cy="8" r="3.4" strokeWidth="1.2" />
      <path
        d="M8 0v3M8 13v3M0 8h3M13 8h3"
        strokeWidth="1.2"
        strokeLinecap="round"
        /* Tanda bidiknya memuai keluar saat merek disentuh — gerak yang sama
           yang dulu dibawa batang tegak di konsep A, dipindahkan ke bentuk yang
           menggantikannya. */
        className="origin-center transition-transform duration-500 group-hover:scale-125 [transform-box:view-box]"
      />
    </svg>
  );
}
