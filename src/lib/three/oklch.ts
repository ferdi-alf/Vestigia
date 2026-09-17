/**
 * OKLCH → sRGB, karena `THREE.Color` tidak mengerti `oklch()`.
 *
 * ---
 *
 * **BUG YANG DITUTUP BERKAS INI, dan ia jauh lebih lama dari yang terlihat.**
 *
 * `globe-stage.tsx` memberi warna penanda dengan
 * `new THREE.Color("oklch(0.72 0.13 35)")`. Parser warna three.js hanya
 * mengenal hex, `rgb()`, `hsl()`, dan nama CSS — ia menolak `oklch()`, mencatat
 * `Unknown color model` ke konsol, lalu **membiarkan warnanya pada nilai
 * bawaan: putih.**
 *
 * Jadi kelima belas penanda globe tidak pernah sekali pun berwarna benua. Di
 * atas langit gelap, lima belas titik PUTIH terbaca sebagai pilihan desain dan
 * tidak ada yang curiga. Begitu latarnya jadi kapur terang mereka lenyap — dan
 * barulah bug berumur panjang itu terlihat.
 *
 * ---
 *
 * **Kenapa dihitung, bukan dibaca dari token.**
 *
 * Warna benua hidup sebagai token CSS (`--color-asia` dan seterusnya), dan
 * idealnya 3D membacanya dari sana seperti `readTokens` membaca warna globe.
 * Itu tidak bisa dilakukan di sini: `getComputedStyle().getPropertyValue()`
 * pada custom property mengembalikan string yang DITULIS, bukan yang
 * di-resolve — jadi yang didapat tetap `"oklch(…)"`, persis yang tidak bisa
 * dipakai. Canvas 2D menerima `oklch()` apa adanya; itu sebabnya tekstur globe
 * tidak pernah kena masalah ini, sementara WebGL menuntut angka.
 *
 * Yang menjaga keduanya tidak berpisah adalah `hue`: token CSS maupun pemanggil
 * di sini sama-sama membacanya dari `CONTINENT_INFO`. Lightness dan chroma-nya
 * memang tertulis dua kali — sekali di `globals.css`, sekali di `ACCENT` di
 * bawah — dan itu tidak terhindarkan karena CSS tidak bisa membaca TypeScript.
 * Keduanya diberi komentar yang saling menunjuk.
 *
 * Rumusnya dari spesifikasi Oklab Björn Ottosson, apa adanya.
 */

/**
 * Lightness dan chroma aksen benua.
 *
 * WAJIB sama dengan `--color-asia` dkk di `globals.css`. Nilainya turun dari
 * 0,72 ke 0,48 saat konsep A berpindah ke kapur terang: di atas latar terang
 * penanda terbaca karena lebih GELAP daripada latarnya, bukan lebih terang.
 */
export const ACCENT = { lightness: 0.48, chroma: 0.13 } as const;

/**
 * Pasangan yang sama untuk object yang berdiri DI ATAS globe, dan angkanya
 * sengaja berlawanan arah.
 *
 * `ACCENT` gelap karena latarnya kertas terang. Di atas bola bumi latarnya
 * terbalik — laut biru tua dan daratan hijau tua — jadi object yang memakai
 * `ACCENT` mendarat lebih gelap daripada tanah yang dipijaknya dan hilang di
 * dalamnya. Lightness dinaikkan supaya ia menyembul, chroma diturunkan supaya
 * ia tetap terbaca sebagai batu yang disinari dan bukan sebagai penanda plastik.
 *
 * Hue-nya tetap hue benua yang sama, jadi bola dan daftar di sebelahnya masih
 * satu sistem wayfinding.
 */
export const RELIC_ACCENT = { lightness: 0.72, chroma: 0.075 } as const;

const cube = (n: number) => n * n * n;

/** Linear-light → sRGB terkode gamma. */
function encode(channel: number): number {
  const c = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
  /* Dijepit, bukan dibiarkan meluap. Warna di luar gamut sRGB menghasilkan
     kanal negatif, dan `THREE.Color` menerimanya diam-diam lalu merender
     sesuatu yang tidak pernah dimaksudkan. */
  return Math.min(1, Math.max(0, c));
}

/**
 * Ubah OKLCH jadi tiga kanal sRGB 0..1 — bentuk yang diterima
 * `THREE.Color.setRGB()`.
 *
 * @param lightness 0..1
 * @param chroma    0..~0.4
 * @param hue       derajat
 */
export function oklchToRgb(
  lightness: number,
  chroma: number,
  hue: number,
): [r: number, g: number, b: number] {
  const rad = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(rad);
  const b = chroma * Math.sin(rad);

  /* OKLab → LMS non-linear, lalu dipangkatkan tiga jadi LMS linear. */
  const l = cube(lightness + 0.3963377774 * a + 0.2158037573 * b);
  const m = cube(lightness - 0.1055613458 * a - 0.0638541728 * b);
  const s = cube(lightness - 0.0894841775 * a - 1.291485548 * b);

  return [
    encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
