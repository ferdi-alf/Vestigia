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
  /** ketinggian sungguhan — menggeser verteks, mengubah siluet */
  displacementMap: Texture;
  /** butiran batu — cahaya saja, tidak menggeser apa pun */
  bumpMap: Texture;
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

/** Berapa banyak butir batu ditaburkan ke peta bump. */
const GRAIN = 26000;

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

function paint(): { height: HTMLCanvasElement; grain: HTMLCanvasElement } | null {
  const height = surface();
  const grain = surface();
  if (!height || !grain) return null;

  const scale = WIDTH / 360;
  const land = new Path2D(WORLD_LAND_PATH);

  /* ── Peta ketinggian ───────────────────────────────────────────────
     Laut hitam, daratan putih, dan DI ANTARANYA yang penting. */
  const h = height.ctx;
  h.fillStyle = "#000000";
  h.fillRect(0, 0, WIDTH, HEIGHT);

  h.save();
  h.scale(scale, scale);

  /* Tiga lapisan dengan blur menurun, bukan satu isian tajam.

     Satu isian putih bertepi keras menghasilkan dinding tegak lurus di garis
     pantai — daratan terbaca seperti kue yang dicetak, bukan seperti benua.
     Berlapis begini, tepinya melandai keluar seperti landas kontinen dan
     pedalamannya berdiri paling tinggi. `evenodd` wajib: tanpanya laut
     pedalaman seperti Kaspia ikut terisi. */
  const shelves: { blur: number; alpha: number }[] = [
    { blur: 5, alpha: 0.42 },
    { blur: 2.2, alpha: 0.34 },
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

  /* ── Peta butiran ──────────────────────────────────────────────────
     Kelabu tengah supaya cahaya punya titik netral untuk menyimpang ke dua
     arah, lalu ditaburi butir terang dan gelap. Tanpa ini bolanya licin, dan
     batu yang licin berhenti terbaca sebagai batu. */
  const g = grain.ctx;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < GRAIN; i += 1) {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    const light = Math.random() > 0.5;
    g.fillStyle = light ? "#ffffff" : "#000000";
    g.globalAlpha = 0.05 + Math.random() * 0.12;
    g.fillRect(x, y, 1 + Math.random() * 1.6, 1 + Math.random() * 1.6);
  }
  g.globalAlpha = 1;

  /* Garis pantai ditekankan pada peta butiran, bukan pada peta ketinggian.
     Di sana ia akan menaikkan tepinya jadi tanggul; di sini ia cuma membuat
     cahaya berbelok, dan itulah yang membuat pantai terbaca sebagai tepi
     terpahat — motif `carved-edge`. */
  g.save();
  g.scale(scale, scale);
  g.strokeStyle = "#ffffff";
  g.globalAlpha = 0.5;
  g.lineWidth = 0.7;
  g.stroke(land);
  g.restore();
  g.globalAlpha = 1;

  return { height: height.canvas, grain: grain.canvas };
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
let painted: { height: HTMLCanvasElement; grain: HTMLCanvasElement } | null = null;

export function createReliefMaps(): ReliefMaps | null {
  if (!painted) painted = paint();
  if (!painted) return null;
  return {
    displacementMap: finish(painted.height),
    bumpMap: finish(painted.grain),
  };
}
