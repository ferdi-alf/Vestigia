#!/usr/bin/env node
/**
 * make-thumbs — satu gambar kecil per warisan, dirender dari geometrinya sendiri.
 *
 *   npm run make:thumbs
 *
 * Daftar koleksi di halaman warisan menampilkan nama dan negara, dan lima belas
 * baris teks yang seragam membuat mata tidak punya pegangan. Yang dibutuhkan
 * gambar — dan di repo ini tidak ada satu pun foto per situs: `public/images/heritage/`
 * kosong, dan satu-satunya asset per warisan adalah GLB-nya.
 *
 * Jadi gambarnya dibuat DARI GLB itu.
 *
 * ---
 *
 * **KENAPA RENDERER SENDIRI, BUKAN PERAMBAN HEADLESS.**
 *
 * Jalur yang biasa dipakai untuk ini adalah Playwright atau Puppeteer: buka
 * route lokal, potret kanvasnya. Itu menambah satu dependency besar, satu
 * peramban yang harus diunduh, dan satu langkah build yang menuntut server
 * hidup — untuk menghasilkan lima belas gambar seukuran kuku.
 *
 * Yang dibutuhkan gambar sekecil ini cuma siluet bernaung, dan itu bisa
 * dihitung langsung: proyeksi ortografis, z-buffer, satu cahaya Lambert. Tidak
 * ada tekstur yang harus disampel, tidak ada UV yang harus dibaca, tidak ada
 * bayangan yang harus dilempar.
 *
 * **Dan proxy-nya memang sudah berbentuk begitu.** `make-proxies.mjs` membuang
 * seluruh tekstur dan seluruh atribut kecuali POSITION — persis dan hanya yang
 * dibutuhkan rasterizer ini. Kedua script memakai jalan yang sama karena
 * keduanya menjawab pertanyaan yang sama: apa yang tersisa dari sebuah candi
 * ketika ia cuma sebesar kuku.
 *
 * PNG ditulis dengan `zlib` bawaan Node. IDAT sebuah PNG memang aliran deflate
 * ber-wrapper zlib — persis yang dihasilkan `deflateSync` — jadi tidak ada
 * encoder yang perlu dipasang.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = path.join(ROOT, "public", "models");
const OUT_DIR = path.join(ROOT, "public", "images", "thumbs");
const MANIFEST = path.join(ROOT, "src", "data", "generated", "thumb-manifest.ts");

/**
 * Sisi gambar akhir, piksel.
 *
 * 256, bukan 128, dan angkanya datang dari tempat gambarnya dipakai. Rail
 * koleksi merendernya 44 px, tetapi varian `strip` merendernya **120 px** — dan
 * pada layar ber-DPR 2 itu menuntut 240 piksel sumber. Pada 128 ia diperbesar
 * hampir dua kali dan tepinya pecah; itu keluhan yang bisa diukur, bukan selera.
 *
 * Ongkosnya kecil: gambarnya siluet datar berlatar polos, jadi PNG-nya tetap
 * puluhan kilobyte meski pikselnya empat kali lipat.
 */
const SIZE = 256;

/**
 * Pengali supersampling.
 *
 * Dirender 2x lalu dirata-ratakan turun. Tanpa ini tepi siluetnya bergerigi
 * keras — dan pada gambar seukuran ini, gerigi adalah satu-satunya hal yang
 * benar-benar terlihat. Empat sampel per piksel sudah cukup; 3x menaikkan waktu
 * render lebih dari dua kali untuk beda yang tidak terbaca.
 */
const SS = 2;

/**
 * Dua ambang pembingkaian, dan kenapa satu saja tidak cukup.
 *
 * Versi pertama memakai satu angka: sisi terpanjang object dipaskan ke 86%
 * bingkai. Terdengar seragam, ternyata tidak — karena yang dilihat mata bukan
 * sisi terpanjang melainkan **luas**.
 *
 * Terukur pada koleksi ini: object bujur sangkar yang sisi panjangnya 86%
 * bingkai terbaca sebesar 86%; object pipih berbanding 3:1 dengan sisi panjang
 * yang sama hanya mengisi 29% tingginya, dan terbaca `sqrt(0,86 x 0,29) = 50%`.
 * Selisihnya 73% — itu sebabnya Borobudur dan Angkor Wat yang melebar terlihat
 * kerdil di sebelah Tentara Terakota yang menjulang, walau keduanya "dipaskan".
 *
 * Jadi skalanya sekarang dihitung dari rata-rata geometrik sisi-sisinya —
 * ukuran yang sebanding dengan akar luas — lalu DIBATASI supaya tidak ada yang
 * keluar bingkai:
 *
 *   FIT_AREA  target ukuran terbaca, dipakai kalau muat
 *   FIT_MAX   batas keras sisi terpanjang; ia yang menang pada bentuk ekstrem
 *
 * Konsekuensinya object bujur sangkar jadi sedikit lebih kecil daripada
 * sebelumnya, dan itu memang harganya: yang dikejar keseragaman antar baris,
 * bukan bingkai yang penuh satu per satu. Selisih terbacanya turun dari 73%
 * ke sekitar 19%.
 */
const FIT_AREA = 0.66;
const FIT_MAX = 0.92;

/**
 * Perbesaran per situs, dan kenapa ini DATA alih-alih heuristik.
 *
 * Dua dari lima belas model adalah pemindaian yang membawa hamparan tanah jauh
 * lebih luas daripada monumennya. Terukur: pelat Stonehenge 171 satuan lebar
 * sementara seluruh rentang tingginya cuma 7,5 — lingkaran batunya kurang dari
 * seperlima lebar bingkai, dan yang tersisa lapangan kosong. Colosseum sama,
 * dengan perbandingan yang lebih ringan.
 *
 * Tiga heuristik dicoba lebih dulu dan ketiganya gagal, masing-masing dengan
 * alasannya sendiri. Menjepit rasio kotak tidak menolong karena pelatnya bujur
 * sangkar. Membingkai hanya bagian yang menjulang di atas ambang tinggi juga
 * tidak: tanahnya hasil pemindaian lapangan sungguhan, jadi ia bergelombang
 * melewati ambang mana pun yang masih aman bagi Moai. Dan membingkai dari
 * persentil teratas memangkas Moai jadi sebatas kepala.
 *
 * Yang membedakan kasus ini dari yang lain bukan sesuatu yang bisa disimpulkan
 * dari geometrinya — ia pengetahuan tentang situsnya. Project ini sudah punya
 * tempat yang benar untuk pengetahuan semacam itu: preset `camera` per warisan
 * di `src/data/heritage/`. Ini saudaranya yang lebih kecil, dan ia sengaja
 * eksplisit: dua baris yang bisa dibaca dan dibantah, bukan rumus yang
 * kebetulan cocok pada hari ini.
 *
 * Slug yang tidak terdaftar memakai 1 — memuat seluruh kotak batasnya.
 *
 * **Sesudah pembingkaian berbasis luas, daftar ini menyusut jadi dua — dan dua
 * itu tidak bisa ikut diselesaikan aturan mana pun.** Tiga belas model lainnya
 * kini mendarat di 62–66% ukuran terbaca tanpa satu pun angka yang ditulis
 * tangan. Yang tersisa adalah dua pemindaian yang kotak batasnya BUKAN
 * monumennya melainkan tanahnya: dipaskan apa adanya, lingkaran batu Stonehenge
 * tinggal setitik di tengah pelat kosong. Untuk keduanya bingkainya sengaja
 * memangkas tanah hasil pindaian, dan itu memang yang harus dipangkas.
 */
const ZOOM = {
  stonehenge: 4.2,
  colosseum: 2.0,
};

/**
 * Sudut pandang, derajat. Sama dengan `DEFAULT_CAMERA` di `heritage-stage.tsx`
 * supaya gambar di daftar memperlihatkan sisi yang sama dengan yang muncul saat
 * situsnya benar-benar dibuka.
 */
const AZIMUTH = -35;
const ELEVATION = 30;

/**
 * Batu, dua ujung.
 *
 * Keduanya JAUH lebih gelap daripada tebakan pertama, dan itu diputuskan
 * setelah melihat hasilnya. Percobaan pertama memakai `#e8dfcb` sebagai ujung
 * terang — warna tepi `.stage-backdrop` — dan gambarnya memang benar, tetapi
 * latar tempatnya berdiri adalah `--color-surface` (#f1ebdf). Batu terang di
 * atas kertas terang berarti siluetnya nyaris hilang persis di tempat ia harus
 * bekerja. Rentangnya diturunkan sampai object terbaca sebagai benda gelap yang
 * disinari, bukan sebagai noda pucat.
 *
 * Nilai mentah di sini bukan pelanggaran aturan "warna hanya dari token":
 * berkas ini bukan komponen, ia perkakas build yang menghasilkan asset. Ia
 * berjalan di Node, jauh dari CSS mana pun, dan tidak punya cara membaca token.
 * Kalau palet bergeser, dua baris ini yang disetel lalu `npm run make:thumbs`.
 */
const LIT = [186, 170, 142];
const SHADOW = [62, 54, 44];

/**
 * Arah cahaya, dalam RUANG KAMERA — bukan ruang dunia.
 *
 * Artinya ia selalu datang dari kiri-atas GAMBAR, berapa pun azimut yang
 * dipakai. Itu bacaan yang benar atas motif `raking-light`: aturannya tentang
 * bagaimana gambarnya terbaca, bukan tentang di mana matahari berdiri. Alasan
 * yang sama dipakai saat cahaya kunci globe ditambatkan ke kamera.
 */
const LIGHT = normalize([-0.52, 0.6, 0.61]);

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/**
 * `--full` merender dari model PENUH, bukan dari proxy.
 *
 * Proxy sudah cukup untuk sebagian besar situs dan jauh lebih cepat dibaca,
 * tetapi beberapa di antaranya lahir dari `simplifySloppy` yang membuang
 * topologi — dan apa yang hilang di sana kadang justru bentuk yang membuat
 * sebuah situs dikenali. Karena gambar ini asset build, ukuran sumbernya tidak
 * berbiaya apa pun saat halaman dibuka.
 */
const FULL = process.argv.includes("--full");

/** Saringan slug opsional: `npm run make:thumbs -- colosseum`. */
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("--"));

function normalize(v) {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

/* ── Geometri ─────────────────────────────────────────────────────────── */

/**
 * Kumpulkan seluruh segitiga dunia dari sebuah dokumen.
 *
 * Matriks dunia tiap node WAJIB diterapkan. Sebuah GLB boleh menaruh meshnya di
 * bawah node yang diskalakan atau diputar, dan membaca POSITION mentah dari
 * primitif berarti merender bentuk yang tidak pernah dilihat siapa pun.
 */
function collectTriangles(document) {
  const tris = [];

  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;

    const m = node.getWorldMatrix();

    for (const prim of mesh.listPrimitives()) {
      const position = prim.getAttribute("POSITION");
      if (!position) continue;

      const raw = position.getArray();
      const count = position.getCount();
      const points = new Float32Array(count * 3);

      /* glTF menyimpan matriks kolom-mayor. */
      for (let i = 0; i < count; i += 1) {
        const x = raw[i * 3];
        const y = raw[i * 3 + 1];
        const z = raw[i * 3 + 2];
        points[i * 3] = m[0] * x + m[4] * y + m[8] * z + m[12];
        points[i * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
        points[i * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
      }

      const indices = prim.getIndices();
      if (indices) {
        const ix = indices.getArray();
        for (let i = 0; i + 2 < ix.length; i += 3) tris.push([ix[i], ix[i + 1], ix[i + 2], points]);
      } else {
        for (let i = 0; i + 2 < count; i += 3) tris.push([i, i + 1, i + 2, points]);
      }
    }
  }

  return tris;
}

/* ── Rasterizer ───────────────────────────────────────────────────────── */

/**
 * Proyeksi ortografis dengan z-buffer, satu warna per segitiga.
 *
 * Datar per-segitiga, bukan Gouraud: proxy sudah kehilangan normal aslinya dan
 * normal yang dihitung ulang dari bentuk yang disederhanakan tidak lebih jujur
 * daripada normal muka. Pada ukuran ini bedanya juga tidak terbaca — yang
 * terbaca cuma bagaimana bidang-bidang besarnya menangkap cahaya.
 */
function render(tris, zoom) {
  const dim = SIZE * SS;

  /* Basis kamera. `dir` menunjuk DARI object KE kamera, jadi z yang lebih besar
     berarti lebih dekat ke mata. */
  const az = (AZIMUTH * Math.PI) / 180;
  const el = (ELEVATION * Math.PI) / 180;
  const dir = normalize([Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)]);
  const right = normalize([Math.cos(az), 0, -Math.sin(az)]);
  const up = normalize([
    dir[1] * right[2] - dir[2] * right[1],
    dir[2] * right[0] - dir[0] * right[2],
    dir[0] * right[1] - dir[1] * right[0],
  ]);

  /* Proyeksikan seluruh verteks lebih dulu, lalu pas-kan ke bingkai dari kotak
     batas HASIL PROYEKSI — bukan dari kotak batas 3D-nya. Kotak 3D melebih-lebihkan
     lebar object yang pipih dan miring, dan objectnya jadi mengambang kecil di
     tengah udara. */
  const flat = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [ia, ib, ic, pts] of tris) {
    const tri = [];
    for (const index of [ia, ib, ic]) {
      const x = pts[index * 3];
      const y = pts[index * 3 + 1];
      const z = pts[index * 3 + 2];
      const px = x * right[0] + y * right[1] + z * right[2];
      const py = x * up[0] + y * up[1] + z * up[2];
      const pz = x * dir[0] + y * dir[1] + z * dir[2];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      tri.push(px, py, pz);
    }
    flat.push(tri);
  }

  const w = maxX - minX;
  const h = maxY - minY;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;

  /* Ukuran yang dikejar diambil dari rata-rata geometrik — sebanding dengan akar
     luas, jadi itu yang terbaca mata sebagai "sebesar apa". Batas sisi terpanjang
     menahannya supaya bentuk yang sangat pipih atau sangat menjulang tidak
     tumpah keluar bingkai; pada bentuk seperti itu batas inilah yang menang. */
  const byArea = (dim * FIT_AREA) / Math.sqrt(w * h);
  const byLongest = (dim * FIT_MAX) / Math.max(w, h);
  const scale = Math.min(byArea, byLongest) * zoom;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const depth = new Float32Array(dim * dim).fill(-Infinity);
  const pixels = new Uint8ClampedArray(dim * dim * 4);

  for (const t of flat) {
    const x0 = (t[0] - cx) * scale + dim / 2;
    const y0 = dim / 2 - (t[1] - cy) * scale;
    const x1 = (t[3] - cx) * scale + dim / 2;
    const y1 = dim / 2 - (t[4] - cy) * scale;
    const x2 = (t[6] - cx) * scale + dim / 2;
    const y2 = dim / 2 - (t[7] - cy) * scale;

    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (area === 0) continue;

    /* Normal muka dalam ruang kamera, dihitung dari koordinat yang SUDAH
       diproyeksikan. `area` yang bertanda sudah memberi arah hadapnya, jadi
       tidak perlu menghitung silang di ruang dunia lagi. */
    const ax = t[3] - t[0];
    const ay = t[4] - t[1];
    const azd = t[5] - t[2];
    const bx = t[6] - t[0];
    const by = t[7] - t[1];
    const bz = t[8] - t[2];
    let nx = ay * bz - azd * by;
    let ny = azd * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    /* Selalu hadapkan ke kamera. Proxy hasil `simplifySloppy` tidak menjamin
       arah muka yang konsisten — separuh segitiganya bisa terbalik, dan tanpa
       ini permukaannya jadi belang gelap-terang acak. */
    if (nz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }

    const lambert = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    /* Sedikit terangkat dari nol: bidang yang membelakangi cahaya tetap harus
       terbaca sebagai batu di dalam bayang, bukan sebagai lubang. */
    const shade = 0.22 + 0.78 * lambert;
    const r = SHADOW[0] + (LIT[0] - SHADOW[0]) * shade;
    const g = SHADOW[1] + (LIT[1] - SHADOW[1]) * shade;
    const b = SHADOW[2] + (LIT[2] - SHADOW[2]) * shade;

    const left = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const rightPx = Math.min(dim - 1, Math.ceil(Math.max(x0, x1, x2)));
    const top = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const bottom = Math.min(dim - 1, Math.ceil(Math.max(y0, y1, y2)));

    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= rightPx; x += 1) {
        const px = x + 0.5;
        const py = y + 0.5;
        const w0 = ((x1 - x0) * (py - y0) - (px - x0) * (y1 - y0)) / area;
        const w1 = ((px - x0) * (y2 - y0) - (x2 - x0) * (py - y0)) / area;
        if (w0 < 0 || w1 < 0 || w0 + w1 > 1) continue;

        const z = t[2] + (t[5] - t[2]) * w1 + (t[8] - t[2]) * w0;
        const at = y * dim + x;
        if (z <= depth[at]) continue;

        depth[at] = z;
        pixels[at * 4] = r;
        pixels[at * 4 + 1] = g;
        pixels[at * 4 + 2] = b;
        pixels[at * 4 + 3] = 255;
      }
    }
  }

  return downsample(pixels, dim);
}

/** Rata-rata SSxSS piksel jadi satu, alfa ikut dirata-ratakan supaya tepinya melandai. */
function downsample(src, dim) {
  const out = new Uint8ClampedArray(SIZE * SIZE * 4);
  const samples = SS * SS;

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const at = ((y * SS + sy) * dim + (x * SS + sx)) * 4;
          /* Warna ditimbang alfa: piksel kosong tidak boleh menarik tepi ke
             arah hitam, karena kanal warnanya memang nol dan bukan gelap. */
          const alpha = src[at + 3] / 255;
          r += src[at] * alpha;
          g += src[at + 1] * alpha;
          b += src[at + 2] * alpha;
          a += alpha;
        }
      }
      const to = (y * SIZE + x) * 4;
      if (a > 0) {
        out[to] = r / a;
        out[to + 1] = g / a;
        out[to + 2] = b / a;
      }
      out[to + 3] = (a / samples) * 255;
    }
  }

  return out;
}

/* ── PNG ──────────────────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let k = 0; k < 8; k += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/**
 * PNG RGBA 8-bit, tanpa encoder pihak ketiga.
 *
 * Tiap baris diawali satu byte FILTER. Nol berarti "tanpa filter" — filter
 * yang lebih pintar (Sub, Up, Paeth) memang memampatkan lebih rapat, tetapi
 * pada gambar sekecil ini selisihnya ratusan byte dan biayanya satu kelas bug
 * yang tidak sepadan.
 */
function encodePng(pixels) {
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y += 1) {
    const at = y * (SIZE * 4 + 1);
    raw[at] = 0;
    for (let x = 0; x < SIZE * 4; x += 1) raw[at + 1 + x] = pixels[y * SIZE * 4 + x];
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // kedalaman bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // kompresi deflate
  ihdr[11] = 0; // metode filter bawaan
  ihdr[12] = 0; // tanpa interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ── Jalannya ─────────────────────────────────────────────────────────── */

async function main() {
  if (!fs.existsSync(MODELS_DIR)) {
    console.log(c.yellow(`Tidak ada ${MODELS_DIR} — jalankan \`npm run sync:heritage\` dulu.`));
    return;
  }

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });

  const jobs = [];
  for (const continent of fs.readdirSync(MODELS_DIR)) {
    const dir = path.join(MODELS_DIR, continent);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".glb")) continue;
      const isProxy = file.endsWith("-proxy.glb");
      if (FULL === isProxy) continue;
      const slug = file.replace(/(-proxy)?\.glb$/, "");
      if (ONLY.length > 0 && !ONLY.some((needle) => slug.includes(needle))) continue;
      jobs.push({ slug, source: path.join(dir, file) });
    }
  }
  jobs.sort((a, b) => a.slug.localeCompare(b.slug));

  console.log(c.bold(`\n  make-thumbs — ${jobs.length} model, ${SIZE}x${SIZE}\n`));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const made = [];
  let total = 0;

  for (const job of jobs) {
    try {
      const document = await io.read(job.source);
      const tris = collectTriangles(document);
      const pixels = tris.length > 0 ? render(tris, ZOOM[job.slug] ?? 1) : null;

      if (!pixels) {
        console.log(`  ${job.slug.padEnd(24)} ${c.red("gagal")} ${c.dim("geometri kosong")}`);
        continue;
      }

      const png = encodePng(pixels);
      const dest = path.join(OUT_DIR, `${job.slug}.png`);
      fs.writeFileSync(dest, png);

      total += png.length;
      made.push(job.slug);
      console.log(
        `  ${job.slug.padEnd(24)} ${c.green(kb(png.length).padStart(9))}   ${c.dim(`${tris.length.toLocaleString()} segitiga`)}`,
      );
    } catch (error) {
      console.log(
        `  ${job.slug.padEnd(24)} ${c.red("gagal")} ${c.dim(String(error.message).slice(-90))}`,
      );
    }
  }

  const lines = made.map((slug) => `  "${slug}": "/images/thumbs/${slug}.png",`).join("\n");
  const body = `// DIGENERATE OTOMATIS oleh scripts/make-thumbs.mjs — jangan diedit tangan.
// Gambar dirender dari geometri proxy tiap warisan.
// Jalankan \`npm run make:thumbs\` setelah menambah atau mengganti model.

/**
 * Satu gambar per warisan, dipakai daftar koleksi di halaman warisan.
 *
 * Slug yang tidak ada di sini BUKAN kesalahan: pemanggilnya jatuh ke baris tanpa
 * gambar, dan koleksinya tetap utuh. Nol asumsi asset.
 */
export const THUMB_MANIFEST: Readonly<Record<string, string>> = {
${lines}
};
`;

  /* Manifest hanya ditulis saat SELURUH koleksi dirender. Menulisnya setelah
     menjalankan satu slug akan menghapus keempat belas lainnya dari daftar
     sementara berkas gambarnya masih ada di disk. */
  if (ONLY.length === 0) {
    const previous = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, "utf8") : "";
    if (previous !== body) fs.writeFileSync(MANIFEST, body);
  }

  console.log(
    `\n  ${made.length} gambar  ·  total ${kb(total)}  ·  rata-rata ${kb(total / Math.max(1, made.length))}\n`,
  );
}

main();
