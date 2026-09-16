/**
 * Jalur `@/lib/utils` — konvensi yang dipakai shadcn dan komponen reactbits.
 *
 * Ia sengaja hanya meneruskan ke implementasi kita sendiri di `./cn`, bukan ke
 * paket `cn` dari npm. Dua implementasi `cn` yang berbeda di satu project berarti
 * dua aturan penggabungan class yang berbeda, dan bentroknya akan muncul sebagai
 * gaya yang kadang menang kadang kalah tanpa pola yang jelas.
 *
 * Milik kita memakai tailwind-merge, jadi `cn("px-4", "px-7")` menghasilkan
 * `px-7` — perilaku yang diandalkan seluruh komponen di sini, termasuk primitif
 * tombol yang menerima `className` untuk menimpa ukurannya.
 */
export { cn } from "./cn";
