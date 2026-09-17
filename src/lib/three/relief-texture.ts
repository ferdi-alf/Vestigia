import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { WORLD_LAND_PATH } from "@/data/world-outline";

/**
 * Globe v2 — bola relief, dan sejak sekarang bola BERWARNA.
 *
 * Saudara `globe-texture.ts`, bukan penggantinya. Keduanya menjawab pertanyaan
 * yang berbeda dan keduanya tetap dipakai: pembuka halaman memakai globe
 * bertekstur peta karena di sana yang harus terbaca adalah LETAK lima belas
 * penanda; section Dunia memakai yang ini karena di sana yang harus terbaca
 * adalah PERMUKAAN tempat lima belas object berdiri.
 *
 * ---
 *
 * **Dulu di sini tertulis "NOL PETA WARNA, dan itu keputusan pemilik project".
 * Pemilik project membalik keputusannya, dan catatan ini ikut dibalik.**
 *
 * Alasan lamanya: bola diwarnai satu material batu dari token, jadi ia ikut
 * bergeser kalau palet bergeser dan tidak pernah membawa warna yang bukan milik
 * situs ini. Hasilnya bola putih keabuan — dan itulah yang dikoreksi.
 *
 * Sekarang ada DUA kanvas, dan keduanya dilukis dari MEDAN YANG SAMA. Peta
 * warna tidak pernah bisa melenceng dari reliefnya karena tidak ada sumber
 * kedua: satu `Path2D` daratan, satu sistem koordinat, dua tafsiran.
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
 */

/**
 * Enam warna bumi, seluruhnya dari token `--color-globe-*`.
 *
 * Diterima sebagai argumen dan tidak pernah dibaca sendiri dari `:root`:
 * komponennya yang tahu elemen mana yang sedang membungkusnya, dan karena itu
 * tema gelap ikut terbawa tanpa satu cabang pun di berkas ini.
 */
export interface ReliefColors {
  abyss: string;
  sea: string;
  shelf: string;
  land: string;
  arid: string;
  ice: string;
}

export interface ReliefMaps {
  /**
   * SATU peta ketinggian, dipakai dua slot sekaligus — `displacementMap` DAN
   * `bumpMap`.
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
  /** Peta warna untuk slot `map`. Dilukis dari medan yang sama. */
  color: Texture;
}

/**
 * 2:1, dan setengah resolusi globe pembuka.
 *
 * Peta ketinggian tidak pernah dilihat sebagai gambar — ia dibaca sebagai angka
 * oleh bola bersegmen 256x128, dan resolusi di atas kerapatan verteksnya adalah
 * detail yang tidak punya tempat untuk mendarat. Peta warna memakai kanvas
 * seukuran supaya keduanya tetap satu sistem koordinat; ia toh cuma memuat pita
 * lebar dan tepi yang melandai, bukan garis tipis yang menuntut piksel.
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

/**
 * Sistem koordinat kedua kanvas, dan satu-satunya.
 *
 * `WORLD_LAND_PATH` digambar dalam derajat: 360 lebar, 180 tinggi, titik asal di
 * sudut kiri-atas. Jadi bujur `lon` jatuh pada `lon + 180` dan lintang `lat`
 * pada `90 - lat`. Seluruh angka pita di bawah ditulis dalam derajat, bukan
 * piksel, supaya ia tetap benar kalau resolusinya berubah.
 */
const SCALE = WIDTH / 360;
const yOfLat = (lat: number) => 90 - lat;

/** Pita gurun dan stepa. Sahara, Arab, Gobi di utara; Australia, Kalahari, Atacama di selatan. */
const ARID_BANDS: { from: number; to: number }[] = [
  { from: 14, to: 36 },
  { from: -34, to: -13 },
];
/** Lintang tempat tudung es mulai terbentuk. */
const ICE_LAT = 62;

function surface(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

/**
 * **`colorSpace` kedua peta BERBEDA, dan menyamakannya merusak diam-diam.**
 *
 * Peta ketinggian dibiarkan linear karena ia DATA, bukan warna: menandainya
 * sRGB membuat three.js meng-decode gamma-nya, dan ketinggian yang sudah
 * di-decode gamma bukan lagi ketinggian yang dilukis — reliefnya melenceng
 * tanpa satu pun pesan kesalahan.
 *
 * Peta warna kebalikannya. Ia memang warna, dilukis dalam sRGB oleh kanvas,
 * dan tanpa penandaan itu three.js memperlakukan nilainya sebagai linear —
 * lautnya keluar jauh lebih terang dan lebih pucat daripada yang dilukis.
 */
function finish(canvas: HTMLCanvasElement, srgb: boolean): Texture {
  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 4;
  if (srgb) texture.colorSpace = SRGBColorSpace;
  return texture;
}

/* Tiga lapisan dengan blur menurun, bukan satu isian tajam.

   Satu isian putih bertepi keras menghasilkan dinding tegak lurus di garis
   pantai — daratan terbaca seperti kue yang dicetak, bukan seperti benua.
   Berlapis begini, tepinya melandai keluar seperti landas kontinen dan
   pedalamannya berdiri paling tinggi. `evenodd` wajib: tanpanya laut pedalaman
   seperti Kaspia ikut terisi.

   Blur-nya dalam ruang yang SUDAH diskalakan 2,84x, jadi angka di sini bukan
   piksel kanvas melainkan derajat. */
const SHELVES: { blur: number; alpha: number }[] = [
  { blur: 1.6, alpha: 0.42 },
  { blur: 0.6, alpha: 0.34 },
  { blur: 0, alpha: 0.24 },
];

/**
 * Seberapa putih pedalaman benua benar-benar jadi, 0..1.
 *
 * **Bukan 1, dan selisihnya menentukan di mana sebuah candi berdiri.**
 * Ketiga lapisan di atas dikomposit dengan alfa, bukan ditumpuk sampai penuh,
 * jadi nilai tertinggi peta ini adalah `1 - (1-0,42)(1-0,34)(1-0,24)` — sekitar
 * 0,71, bukan putih penuh. `displacementScale` mengalikan NILAI PETA, sehingga
 * daratan naik setinggi `RELIEF x 0,71` dan bukan setinggi `RELIEF`.
 *
 * Angkanya diekspor, bukan disalin ke komponen, supaya ia ikut berubah sendiri
 * kalau `SHELVES` disetel lagi. Object yang ditempatkan pada `RELIEF` penuh akan
 * melayang di atas tanah dengan celah yang terlihat.
 */
export const LAND_COVERAGE = 1 - SHELVES.reduce((rest, shelf) => rest * (1 - shelf.alpha), 1);

/** Peta ketinggian: laut hitam, daratan putih, dan DI ANTARANYA yang penting. */
function paintHeight(land: Path2D): HTMLCanvasElement | null {
  const height = surface();
  if (!height) return null;
  const h = height.ctx;

  h.fillStyle = "#000000";
  h.fillRect(0, 0, WIDTH, HEIGHT);

  h.save();
  h.scale(SCALE, SCALE);

  h.fillStyle = "#ffffff";
  for (const shelf of SHELVES) {
    h.filter = shelf.blur > 0 ? `blur(${shelf.blur}px)` : "none";
    h.globalAlpha = shelf.alpha;
    h.fill(land, "evenodd");
  }

  h.filter = "none";
  h.globalAlpha = 1;
  h.restore();

  /* Butiran batu dikomposit KE DALAM peta yang sama, beramplitudo kecil.
     Karena `bumpMap` dan `displacementMap` berbagi satu peta, butiran yang
     tinggal di peta terpisah tidak punya tempat untuk mendarat. Amplitudonya
     sengaja jauh di bawah tinggi benua — ia harus terbaca sebagai permukaan
     batu, bukan sebagai pegunungan. */
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
 * Daratan di kanvasnya SENDIRI, supaya gurun bisa disapukan tanpa mengotori laut.
 *
 * `source-atop` hanya menggambar di atas piksel yang sudah ada isinya. Di kanvas
 * terpisah ini yang berisi hanya daratan, jadi pita gurun boleh dilukis sebagai
 * pita lurus melintasi seluruh bujur dan tetap berhenti persis di garis pantai —
 * tanpa satu pun `clip()` bertepi keras. Di kanvas utama trik yang sama mustahil:
 * lautnya juga berisi, jadi gurunnya akan ikut tumpah ke laut.
 */
function paintLand(land: Path2D, colors: ReliefColors): HTMLCanvasElement | null {
  const layer = surface();
  if (!layer) return null;
  const c = layer.ctx;

  c.save();
  c.scale(SCALE, SCALE);

  c.fillStyle = colors.land;
  c.fill(land, "evenodd");

  /* Gurun disapukan hanya di atas daratan yang sudah berdiri. Blur-nya membuat
     tepi pita melandai; tanpa itu Sahara berhenti pada garis lurus sempurna,
     yang membaca sebagai kesalahan render, bukan sebagai iklim. */
  c.globalCompositeOperation = "source-atop";
  c.filter = "blur(4px)";
  c.fillStyle = colors.arid;
  c.globalAlpha = 0.9;
  for (const band of ARID_BANDS) {
    const top = yOfLat(band.to);
    c.fillRect(0, top, 360, yOfLat(band.from) - top);
  }

  c.filter = "none";
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  c.restore();

  return layer.canvas;
}

function paintColor(land: Path2D, colors: ReliefColors): HTMLCanvasElement | null {
  const surfaceCanvas = surface();
  const landLayer = paintLand(land, colors);
  if (!surfaceCanvas || !landLayer) return null;
  const c = surfaceCanvas.ctx;

  /* Samudra dalam sebagai dasar, lalu laut makin dangkal makin dekat daratan.
     Kedalamannya dibuat oleh BLUR: bentuk daratan yang sama digambar makin
     tajam dan makin terang, sehingga tiap lapisan menyembul sedikit lebih
     sempit daripada yang di bawahnya. Itu memberi paparan benua tanpa satu pun
     data batimetri — dan bentuknya dijamin mengikuti garis pantai yang sama
     dengan peta ketinggian, karena `Path2D`-nya memang satu. */
  c.fillStyle = colors.abyss;
  c.fillRect(0, 0, WIDTH, HEIGHT);

  c.save();
  c.scale(SCALE, SCALE);

  const waters: { blur: number; color: string }[] = [
    { blur: 6, color: colors.sea },
    { blur: 2.2, color: colors.shelf },
  ];
  for (const water of waters) {
    c.filter = `blur(${water.blur}px)`;
    c.fillStyle = water.color;
    c.fill(land, "evenodd");
  }
  c.filter = "none";
  c.restore();

  c.drawImage(landLayer, 0, 0);

  /* Tudung es menutup laut DAN daratan, jadi ia dilukis terakhir di kanvas utama
     dan bukan di lapisan daratan.

     **Di-blur, BUKAN digradasikan ke `"transparent"`** — dan perbedaannya
     terlihat langsung di layar. `"transparent"` adalah `rgba(0,0,0,0)`, jadi
     gradien dari es ke sana melewati HITAM yang makin pekat sebelum akhirnya
     hilang. Hasilnya bukan tudung es yang memudar melainkan cincin gelap
     melingkari kutub, persis kebalikan dari yang dimaksud. Kanvas menginterpolasi
     di ruang RGBA lurus; warna dari token adalah hex tanpa alfa, jadi tidak ada
     cara menulis "es dengan alfa nol" tanpa mengurai hex-nya sendiri.

     Rect yang di-blur menghindari seluruh persoalan itu: tidak ada warna kedua
     untuk diinterpolasi. Rect-nya sengaja melewati tepi kanvas supaya kutubnya
     tetap pekat dan hanya sisi yang menghadap khatulistiwa yang melandai. */
  const OVERSHOOT = 24;
  const caps: { top: number; bottom: number }[] = [
    { top: -OVERSHOOT, bottom: yOfLat(ICE_LAT) * SCALE },
    { top: yOfLat(-ICE_LAT) * SCALE, bottom: HEIGHT + OVERSHOOT },
  ];
  c.filter = "blur(14px)";
  c.fillStyle = colors.ice;
  c.globalAlpha = 0.92;
  for (const cap of caps) c.fillRect(0, cap.top, WIDTH, cap.bottom - cap.top);
  c.filter = "none";
  c.globalAlpha = 1;

  return surfaceCanvas.canvas;
}

/**
 * Kanvas yang sudah dilukis, disimpan untuk seumur halaman dan di-key warna.
 *
 * Dulu tidak di-key apa pun, dan itu benar selama peta ini murni geometri dunia.
 * Sejak ada peta warna, ia tidak lagi: mengganti tema harus menghasilkan bola
 * yang berbeda. Key-nya keenam token, persis pola `globe-texture.ts`.
 *
 * Yang di-cache KANVASNYA, bukan `Texture`-nya. `Texture` memegang sumber daya
 * GPU dan wajib di-`dispose()` oleh pemasangan yang membuatnya — §7 tidak
 * ditawar. Kanvas di belakangnya tidak memegang apa pun, jadi ia boleh hidup
 * lebih lama dan dipakai lagi saat section dipasang ulang.
 */
const PAINTED = new Map<string, { height: HTMLCanvasElement; color: HTMLCanvasElement }>();

export function createReliefMaps(colors: ReliefColors): ReliefMaps | null {
  const key = [colors.abyss, colors.sea, colors.shelf, colors.land, colors.arid, colors.ice].join(
    "|",
  );

  let canvases = PAINTED.get(key);
  if (!canvases) {
    const land = new Path2D(WORLD_LAND_PATH);
    const height = paintHeight(land);
    const color = paintColor(land, colors);
    if (!height || !color) return null;
    canvases = { height, color };
    PAINTED.set(key, canvases);
  }

  return { height: finish(canvases.height, false), color: finish(canvases.color, true) };
}
