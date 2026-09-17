/**
 * Baca warna dari token yang sedang berlaku pada sebuah elemen.
 *
 * Kanvas — 2D maupun WebGL — tidak mengerti `var(--color-land)`, jadi nilainya
 * harus diselesaikan lebih dulu. Dibaca dari ELEMEN, bukan dari `:root`, supaya
 * ia mengambil palet yang membungkusnya: sebuah section yang membalik temanya
 * ikut membalik warna kanvas di dalamnya tanpa satu baris kode tambahan.
 *
 * ---
 *
 * **Kenapa berkas sendiri, bukan tinggal di `lib/three/globe-texture.ts`.**
 *
 * Di sanalah ia lahir, dan di sana ia terikat pada modul yang mengimpor
 * `three` dan seluruh garis pantai dunia. Fungsinya sendiri tidak menyentuh
 * keduanya — ia cuma `getComputedStyle`. Latar hero adalah kanvas 2D murni;
 * mengimpornya dari alamat lama berarti menyeret three.js dan `WORLD_LAND_PATH`
 * ke dalam potongan yang harus mendarat lebih dulu daripada apa pun di halaman.
 */
export function readTokens<K extends string>(
  element: Element,
  names: Record<K, string>,
): Record<K, string> {
  const style = getComputedStyle(element);
  const out = {} as Record<K, string>;
  for (const key of Object.keys(names) as K[]) {
    out[key] = style.getPropertyValue(names[key]).trim();
  }
  return out;
}
