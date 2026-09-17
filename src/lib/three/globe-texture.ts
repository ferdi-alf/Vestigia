import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { WORLD_LAND_PATH } from "@/data/world-outline";

/**
 * Tekstur globe, dilukis peramban dari garis daratan yang sudah ada.
 *
 * Tidak ada berkas yang diunduh. `WORLD_LAND_PATH` sudah equirectangular
 * (`viewBox 0 0 360 180`), dan proyeksi itu memetakan 1:1 ke UV bola — jadi
 * menggambarnya ke kanvas berbanding 2:1 lalu memasangnya sebagai `map` sudah
 * menghasilkan bumi yang benar tanpa satu pun langkah proyeksi ulang.
 *
 * Dua akibat yang membuat ini lebih baik daripada berkas gambar. Pertama,
 * globe dan peta datar membaca sumber yang sama persis, jadi keduanya tidak
 * bisa berbeda pendapat tentang bentuk benua. Kedua, warnanya diteruskan
 * sebagai argumen — bukan dipanggang ke dalam berkas — sehingga tekstur ini
 * ikut berganti ketika paletnya berganti.
 *
 * ---
 *
 * **DUA PETA, BUKAN SATU — dan yang kedua yang membuat benua menonjol.**
 *
 * Versi sebelumnya hanya melukis albedo: daratan satu warna datar di atas laut
 * satu warna datar. Bola yang begitu terbaca sebagai stiker peta yang
 * dilengkungkan, bukan sebagai dunia — karena cahaya menyapunya tanpa
 * menemukan apa pun untuk disapu.
 *
 * Sekarang ada `bumpMap`: peta ketinggian kelabu tempat daratan putih dan laut
 * hitam, dengan tepi yang dilembutkan. Di bawah `directionalLight` dari kiri,
 * setiap garis pantai jadi punya sisi yang tersinari dan sisi yang membayang —
 * benua benar-benar TIMBUL, bukan cuma berbeda warna. Ongkosnya satu kanvas
 * tambahan yang dilukis sekali, nol berkas, nol permintaan jaringan.
 */
export interface GlobeTextureColors {
  /** laut / dasar bola */
  sea: string;
  /** massa daratan */
  land: string;
  /** tepi daratan — garis pantai */
  coast: string;
  /** garis lintang-bujur, motif `coordinate-mark` */
  graticule: string;
}

export interface GlobeMaps {
  /** warna permukaan */
  map: Texture;
  /** ketinggian — daratan timbul, laut rata */
  bumpMap: Texture;
}

/** 2:1, kelipatan dua. Lebih dari ini tidak menambah apa pun pada bola sekecil ini. */
const WIDTH = 2048;
const HEIGHT = 1024;

function surface(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

const finish = (canvas: HTMLCanvasElement, srgb: boolean): Texture => {
  const texture = new CanvasTexture(canvas);
  /* Hanya peta WARNA yang sRGB. `bumpMap` adalah DATA — angka ketinggian,
     bukan warna — dan menandainya sRGB akan membuat three.js meng-decode
     gamma-nya, sehingga reliefnya melenceng dari yang dilukis. */
  if (srgb) texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

function paint(
  colors: GlobeTextureColors,
): { albedo: HTMLCanvasElement; relief: HTMLCanvasElement } | null {
  const albedo = surface();
  const relief = surface();
  if (!albedo || !relief) return null;

  const scale = WIDTH / 360;
  const land = new Path2D(WORLD_LAND_PATH);

  /* ── Peta warna ───────────────────────────────────────────────────── */
  const { ctx } = albedo;

  /* Laut tidak rata. Gradien tegak membuat kutub sedikit lebih gelap
     daripada khatulistiwa — bukan karena airnya berbeda, melainkan karena
     itulah yang dilihat mata pada bola yang disinari dari satu sisi, dan
     tanpanya bolanya terbaca sebagai piringan. */
  const deep = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  deep.addColorStop(0, colors.graticule);
  deep.addColorStop(0.28, colors.sea);
  deep.addColorStop(0.72, colors.sea);
  deep.addColorStop(1, colors.graticule);
  ctx.fillStyle = deep;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  /* Kisi survei digambar DI BAWAH daratan, bukan di atasnya. Garis ukur yang
     menyeberangi benua terbaca sebagai lapisan UI yang menempel di kaca;
     yang berhenti di garis pantai terbaca sebagai peta. */
  ctx.strokeStyle = colors.graticule;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let lon = -165; lon <= 165; lon += 15) {
    const x = (lon + 180) * scale;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * HEIGHT;
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
  }
  ctx.stroke();

  /* Khatulistiwa dan kedua tropis lebih tegas daripada kisi lainnya. Peta
     survei sungguhan menandainya, dan satu garis yang lebih berat memberi
     bola sumbu yang terbaca saat ia berputar. */
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const lat of [-23.44, 0, 23.44]) {
    const y = ((90 - lat) / 180) * HEIGHT;
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
  }
  ctx.stroke();

  ctx.save();
  ctx.scale(scale, scale);

  /* Bayang jatuh tipis di bawah daratan, digeser ke KANAN-BAWAH karena
     mataharinya di kiri — arah yang sama dengan seluruh situs ini. Ini yang
     memisahkan benua dari laut sebelum relief ikut bekerja. */
  ctx.shadowColor = colors.coast;
  ctx.shadowBlur = 2.4;
  ctx.shadowOffsetX = 0.9;
  ctx.shadowOffsetY = 0.9;
  ctx.fillStyle = colors.land;
  /* `evenodd` wajib, sama seperti di peta datar: danau dan laut pedalaman
     ditulis sebagai cincin di dalam cincin. Dengan `nonzero` keduanya ikut
     terisi dan Kaspia hilang. */
  ctx.fill(land, "evenodd");

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = colors.coast;
  ctx.lineWidth = 0.4;
  ctx.stroke(land);
  ctx.restore();

  /* ── Peta ketinggian ──────────────────────────────────────────────── */
  const rel = relief.ctx;
  rel.fillStyle = "#000000";
  rel.fillRect(0, 0, WIDTH, HEIGHT);
  rel.save();
  rel.scale(scale, scale);

  /* Tepi dilembutkan supaya garis pantai jadi lereng, bukan tebing. Tebing
     setinggi satu piksel menghasilkan kilau keras yang terbaca sebagai
     artefak. `filter` tidak didukung Safari lama; di sana reliefnya bertepi
     keras — lebih kasar, tetapi tetap benar. */
  rel.filter = "blur(3px)";
  rel.fillStyle = "#ffffff";
  rel.fill(land, "evenodd");
  rel.filter = "none";

  /* Lapisan kedua tanpa blur di bagian dalam: pedalaman benua jadi lebih
     tinggi daripada pesisirnya, sehingga massanya terbaca punya punggung. */
  rel.globalAlpha = 0.5;
  rel.fillStyle = "#ffffff";
  rel.fill(land, "evenodd");
  rel.restore();

  return { albedo: albedo.canvas, relief: relief.canvas };
}

/**
 * Kanvas yang sudah dilukis, disimpan per kombinasi warna.
 *
 * Melukisnya berarti menggambar dua permukaan 2048x1024 lengkap dengan
 * gradien, kisi survei, garis pantai berlapis, dan dua lapisan relief
 * ber-blur. Itu puluhan milidetik di thread utama — tidak terasa sekali, tetapi
 * sangat terasa kalau terjadi setiap kali globe dipasang ulang.
 *
 * Dan sejak panggung penyelaman MELEPAS kanvasnya begitu section-nya benar-benar
 * lewat — supaya hanya ada satu konteks WebGL hidup pada satu waktu, §7 — itu
 * persis yang akan terjadi tiap kali pengunjung menggulir balik ke atas.
 */
const PAINTED = new Map<string, { albedo: HTMLCanvasElement; relief: HTMLCanvasElement }>();

/**
 * Dua peta untuk globe.
 *
 * Yang di-cache KANVASNYA, bukan `Texture`-nya, dan pemisahan itu yang penting:
 * `Texture` dimiliki satu pemasangan dan wajib di-`dispose()` saat pemasangan
 * itu berakhir — aturan §7 tidak ditawar. Kanvas di belakangnya tidak memegang
 * sumber daya GPU apa pun, jadi ia boleh hidup lebih lama dan dipakai lagi.
 *
 * Hasilnya: tiap pemasangan tetap membuat dan membuang teksturnya sendiri, tapi
 * derau proseduralnya tidak pernah dihitung dua kali.
 */
export function createGlobeMaps(colors: GlobeTextureColors): GlobeMaps | null {
  const key = `${colors.sea}|${colors.land}|${colors.coast}|${colors.graticule}`;

  let canvases = PAINTED.get(key);
  if (!canvases) {
    const fresh = paint(colors);
    if (!fresh) return null;
    canvases = fresh;
    PAINTED.set(key, fresh);
  }

  return { map: finish(canvases.albedo, true), bumpMap: finish(canvases.relief, false) };
}
