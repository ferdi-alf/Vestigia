import { CanvasTexture, type Texture } from "three";
import { WORLD_LAND_PATH } from "@/data/world-outline";

/**
 * Globe v2 — bola RELIEF, bukan peta berwarna.
 *
 * Saudara `globe-texture.ts`, bukan penggantinya. Keduanya menjawab pertanyaan
 * yang berbeda dan keduanya tetap dipakai: pembuka halaman memakai globe
 * bertekstur peta karena di sana yang harus terbaca adalah LETAK lima belas
 * penanda; section Dunia memakai yang ini karena di sana yang harus terbaca
 * adalah PERMUKAAN tempat lima belas object berdiri.
 *
 * ---
 *
 * **NOL PETA WARNA, dan itu keputusan pemilik project.**
 *
 * Yang dihasilkan di sini bukan gambar melainkan DATA KETINGGIAN. Warnanya
 * datang dari satu material batu di komponennya, diambil dari token — jadi bola
 * ini ikut berganti kalau paletnya bergeser, dan ia tidak pernah membawa warna
 * yang bukan milik situs ini. Batu kering, bukan kaca atau neon — §5.
 *
 * **`displacementMap`, bukan cuma `bumpMap`.** `bumpMap` memalsukan cahaya pada
 * permukaan yang tetap bulat sempurna; ia tidak menggeser satu verteks pun.
 * Pada bola yang dilihat dari jauh itu cukup di tengah bingkai, tetapi TEPI
 * bolanya tetap lingkaran halus — dan tepi itulah yang membuat sebuah globe
 * terbaca sebagai terukir. Displacement menggeser geometrinya sungguhan,
 * sehingga garis pantai ikut menonjol pada siluet.
 *
 * Harganya verteks: bola pemakainya butuh segmen yang rapat, kalau tidak
 * daratannya terpotong jadi segi banyak. Itu pertukaran yang disengaja dan
 * dicatat di komponennya.
 *
 * Keduanya dipakai bersama: displacement membawa BENTUK benua, bump membawa
 * BUTIRAN batunya. Sendiri-sendiri, yang pertama terbaca seperti plastik cetak
 * dan yang kedua seperti bola licin bermotif.
 */

export interface ReliefMaps {
  /**
   * SATU peta, dipakai dua slot sekaligus — `displacementMap` DAN `bumpMap`.
   *
   * Ini bukan penghematan melainkan syarat, dan ia jenis jebakan yang hanya
   * ketahuan dengan melihat layar: **three.js tidak menghitung ulang normal
   * setelah `displacementMap` menggeser verteks.** Bola yang geometrinya sudah
   * berbenjol-benjol tetap dinaungi seolah masih bulat sempurna, jadi siluetnya
   * berubah sementara permukaannya tetap rata — hasilnya telur bergelombang,
   * bukan dunia.
   *
   * `bumpMap` yang membawa peta ketinggian yang SAMA memperbaikinya: ia
   * memutar normal per piksel mengikuti kemiringan yang sama, sehingga cahaya
   * akhirnya melihat bentuk yang benar-benar ada di sana.
   */
  height: Texture;
}

/**
 * 2:1, dan setengah resolusi globe pembuka.
 *
 * Tekstur ini tidak pernah dilihat sebagai gambar — ia dibaca sebagai angka
 * ketinggian oleh bola bersegmen 256x128. Resolusi di atas kerapatan verteksnya
 * adalah detail yang tidak punya tempat untuk mendarat.
 */
const WIDTH = 1024;
const HEIGHT = 512;

/**
 * Berapa banyak butir batu ditaburkan ke peta ketinggian.
 *
 * Diturunkan tajam dari 26.000. Sejak peta ini juga jadi `bumpMap`, tiap butir
 * ikut memutar normal — dan pada kerapatan lama butirannya MENELAN benua:
 * bolanya terbaca berpasir merata dan garis pantainya hilang di dalam derau.
 * Butiran harus terdengar seperti bisikan di bawah bentuk, bukan menggantikannya.
 */
const GRAIN = 7000;

function surface(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

/**
 * `colorSpace` sengaja DIBIARKAN linear pada keduanya.
 *
 * Keduanya data, bukan warna. Menandainya sRGB membuat three.js meng-decode
 * gamma-nya, dan ketinggian yang sudah di-decode gamma bukan lagi ketinggian
 * yang dilukis — reliefnya melenceng tanpa satu pun pesan kesalahan.
 */
function finish(canvas: HTMLCanvasElement): Texture {
  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function paint(): HTMLCanvasElement | null {
  const height = surface();
  if (!height) return null;

  const scale = WIDTH / 360;
  const land = new Path2D(WORLD_LAND_PATH);
  const h = height.ctx;

  /* Laut hitam, daratan putih, dan DI ANTARANYA yang penting. */
  h.fillStyle = "#000000";
  h.fillRect(0, 0, WIDTH, HEIGHT);

  h.save();
  h.scale(scale, scale);

  /* Tiga lapisan dengan blur menurun, bukan satu isian tajam.

     Satu isian putih bertepi keras menghasilkan dinding tegak lurus di garis
     pantai — daratan terbaca seperti kue yang dicetak, bukan seperti benua.
     Berlapis begini, tepinya melandai keluar seperti landas kontinen dan
     pedalamannya berdiri paling tinggi. `evenodd` wajib: tanpanya laut
     pedalaman seperti Kaspia ikut terisi.

     Blur-nya dalam ruang yang SUDAH diskalakan 2,84x, jadi angka di sini
     bukan piksel kanvas melainkan derajat — `blur: 2.6` berarti sekitar tujuh
     piksel. Nilai yang lebih besar melembutkan pantai sampai benua kehilangan
     bentuknya. */
  const shelves: { blur: number; alpha: number }[] = [
    { blur: 1.6, alpha: 0.42 },
    { blur: 0.6, alpha: 0.34 },
    { blur: 0, alpha: 0.24 },
  ];

  h.fillStyle = "#ffffff";
  for (const shelf of shelves) {
    h.filter = shelf.blur > 0 ? `blur(${shelf.blur}px)` : "none";
    h.globalAlpha = shelf.alpha;
    h.fill(land, "evenodd");
  }

  h.filter = "none";
  h.globalAlpha = 1;
  h.restore();

  /* Butiran batu dikomposit KE DALAM peta yang sama, beramplitudo kecil.

     Kanvas kedua tidak dipakai lagi: karena `bumpMap` dan `displacementMap`
     kini berbagi satu peta, butiran yang tinggal di peta terpisah tidak punya
     tempat untuk mendarat. Amplitudonya sengaja jauh di bawah tinggi benua —
     ia harus terbaca sebagai permukaan batu, bukan sebagai pegunungan. */
  for (let i = 0; i < GRAIN; i += 1) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    h.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
    h.globalAlpha = 0.012 + Math.random() * 0.022;
    h.fillRect(x, y, 1 + Math.random() * 1.6, 1 + Math.random() * 1.6);
  }
  h.globalAlpha = 1;

  return height.canvas;
}

/**
 * Kanvas yang sudah dilukis, disimpan sekali untuk seumur halaman.
 *
 * Tidak di-key apa pun karena tidak ada yang bisa mengubahnya: peta ini murni
 * geometri dunia, tanpa satu pun warna yang diteruskan dari luar. Itu justru
 * yang membuatnya lebih murah daripada globe pembuka — ia tidak perlu dilukis
 * ulang ketika palet bergeser.
 *
 * Yang di-cache KANVASNYA, bukan `Texture`-nya. `Texture` memegang sumber daya
 * GPU dan wajib di-`dispose()` oleh pemasangan yang membuatnya — §7 tidak
 * ditawar. Kanvas di belakangnya tidak memegang apa pun, jadi ia boleh hidup
 * lebih lama dan dipakai lagi saat section dipasang ulang.
 */
let painted: HTMLCanvasElement | null = null;

export function createReliefMaps(): ReliefMaps | null {
  if (!painted) painted = paint();
  if (!painted) return null;
  return { height: finish(painted) };
}
