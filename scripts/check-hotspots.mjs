#!/usr/bin/env node
/**
 * check-hotspots — ke mana sebenarnya tiap penanda mendarat.
 *
 *   node scripts/check-hotspots.mjs            seluruh koleksi
 *   node scripts/check-hotspots.mjs sydney     satu situs
 *
 * ---
 *
 * **Kenapa alat ini ada.**
 *
 * Hotspot di project ini tidak ditulis sebagai koordinat mati. Tiap hotspot
 * hanya menyebut JENIS permukaan yang ia maksud — `top`, `ground`, atau `face`
 * — dan `snapHotspot` mencari permukaan itu di dalam geometri model, dengan
 * `anchor` cuma memilih BAGIAN MANA dari permukaan tersebut.
 *
 * Konsekuensinya: sebuah anchor bisa salah tanpa satu pun tanda di kode. Ia
 * tetap menghasilkan titik, tetap terpasang, tetap bisa diklik — dan mendarat
 * di tempat yang tidak dimaksud siapa pun. Satu-satunya cara tahu adalah
 * menjalankan pencariannya dan melihat hasilnya.
 *
 * Yang paling berbahaya dari ketiganya `face`. Ia menembakkan sinar dari luar
 * pada ketinggian anchor menuju pusat model; kalau pada ketinggian itu tidak
 * ada apa-apa untuk ditembus — atap yang melengkung menjauh, halaman terbuka,
 * celah antar bangunan — sinarnya lewat begitu saja dan `snapHotspot` jatuh ke
 * cadangannya: koordinat mentah di dalam bounding box. Bounding box adalah
 * kotak; bangunan bukan. Penandanya lalu mengambang di udara, dan di layar itu
 * persis terbaca sebagai "titiknya kurang tepat".
 *
 * ---
 *
 * **Kenapa Node dan bukan peramban.**
 *
 * Penempelan hotspot murni geometri: tidak ada tekstur, tidak ada material,
 * tidak ada satu pun bingkai yang perlu digambar. Membuka lima belas halaman
 * di peramban headless untuk membaca empat angka per halaman berarti membayar
 * satu peramban demi aritmetika yang muat di satu berkas.
 *
 * Jalur bacanya sama persis dengan `make-thumbs.mjs` — `@gltf-transform`
 * dengan dekoder Draco — karena keduanya menanyakan hal yang sama: bentuk apa
 * yang sebenarnya ada di dalam berkas ini.
 *
 * **Yang direplikasi di sini WAJIB sama dengan `src/lib/three/snap-hotspot.ts`.**
 * GRID, urutan cadangan, ambang 0,6 dan 0,25, dorongan keluar dinding — semua
 * disalin dari sana. Alat ukur yang mengukur sesuatu yang lain dari yang
 * dipakai produk lebih buruk daripada tidak ada alat ukur.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = path.join(ROOT, "public", "models");
const DATA_DIR = path.join(ROOT, "src", "data", "heritage");

const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const MAP = process.argv.includes("--map");

/** Resolusi sampling medan ketinggian. Sama dengan `snap-hotspot.ts`. */
const GRID = 20;

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
};

/* ── Geometri ─────────────────────────────────────────────────────────── */

/** Segitiga dunia sebagai array datar [ax,ay,az, bx,by,bz, cx,cy,cz, ...]. */
function collectTriangles(document) {
  const out = [];

  for (const node of document.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;

    const m = node.getWorldMatrix();

    for (const prim of mesh.listPrimitives()) {
      const position = prim.getAttribute("POSITION");
      if (!position) continue;

      const raw = position.getArray();
      const count = position.getCount();
      const pts = new Float32Array(count * 3);

      /* glTF menyimpan matriks kolom-mayor. */
      for (let i = 0; i < count; i += 1) {
        const x = raw[i * 3];
        const y = raw[i * 3 + 1];
        const z = raw[i * 3 + 2];
        pts[i * 3] = m[0] * x + m[4] * y + m[8] * z + m[12];
        pts[i * 3 + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
        pts[i * 3 + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
      }

      const indices = prim.getIndices();
      const ix = indices ? indices.getArray() : null;
      const n = ix ? ix.length : count;

      for (let i = 0; i + 2 < n; i += 3) {
        const a = (ix ? ix[i] : i) * 3;
        const b = (ix ? ix[i + 1] : i + 1) * 3;
        const d = (ix ? ix[i + 2] : i + 2) * 3;
        out.push(
          pts[a], pts[a + 1], pts[a + 2],
          pts[b], pts[b + 1], pts[b + 2],
          pts[d], pts[d + 1], pts[d + 2],
        );
      }
    }
  }

  return new Float64Array(out);
}

function bounds(tris) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < tris.length; i += 3) {
    for (let k = 0; k < 3; k += 1) {
      const v = tris[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] };
}

/**
 * Möller–Trumbore. Mengembalikan jarak sepanjang sinar, atau -1.
 *
 * Dua sisi: geometri warisan di koleksi ini tidak dijamin berorientasi
 * konsisten, dan menolak muka belakang akan membuat sinar menembus dinding
 * yang sebenarnya ada.
 */
function hitTriangle(tris, t, ox, oy, oz, dx, dy, dz) {
  const ax = tris[t], ay = tris[t + 1], az = tris[t + 2];
  const e1x = tris[t + 3] - ax, e1y = tris[t + 4] - ay, e1z = tris[t + 5] - az;
  const e2x = tris[t + 6] - ax, e2y = tris[t + 7] - ay, e2z = tris[t + 8] - az;

  const px = dy * e2z - dz * e2y;
  const py = dz * e2x - dx * e2z;
  const pz = dx * e2y - dy * e2x;
  const det = e1x * px + e1y * py + e1z * pz;
  if (det > -1e-12 && det < 1e-12) return -1;

  const inv = 1 / det;
  const tx = ox - ax, ty = oy - ay, tz = oz - az;
  const u = (tx * px + ty * py + tz * pz) * inv;
  if (u < 0 || u > 1) return -1;

  const qx = ty * e1z - tz * e1y;
  const qy = tz * e1x - tx * e1z;
  const qz = tx * e1y - ty * e1x;
  const v = (dx * qx + dy * qy + dz * qz) * inv;
  if (v < 0 || u + v > 1) return -1;

  const dist = (e2x * qx + e2y * qy + e2z * qz) * inv;
  return dist > 1e-9 ? dist : -1;
}

/**
 * Indeks XZ sederhana, pengganti BVH.
 *
 * Medan ketinggian menembakkan 400 sinar LURUS KE BAWAH, dan sinar lurus ke
 * bawah hanya bisa mengenai segitiga yang bayangannya di bidang XZ menutupi
 * titik itu. Membagi segitiga ke dalam sel XZ mengubah empat ratus pemindaian
 * penuh jadi empat ratus pemindaian atas segelintir segitiga.
 */
function buildIndex(tris, box, cells) {
  const buckets = Array.from({ length: cells * cells }, () => []);
  const [minX, , minZ] = box.min;
  const spanX = box.size[0] || 1;
  const spanZ = box.size[2] || 1;

  for (let t = 0; t < tris.length; t += 9) {
    let lo0 = Infinity, hi0 = -Infinity, lo2 = Infinity, hi2 = -Infinity;
    for (let v = 0; v < 9; v += 3) {
      const x = tris[t + v], z = tris[t + v + 2];
      if (x < lo0) lo0 = x;
      if (x > hi0) hi0 = x;
      if (z < lo2) lo2 = z;
      if (z > hi2) hi2 = z;
    }
    const x0 = Math.max(0, Math.min(cells - 1, Math.floor(((lo0 - minX) / spanX) * cells)));
    const x1 = Math.max(0, Math.min(cells - 1, Math.floor(((hi0 - minX) / spanX) * cells)));
    const z0 = Math.max(0, Math.min(cells - 1, Math.floor(((lo2 - minZ) / spanZ) * cells)));
    const z1 = Math.max(0, Math.min(cells - 1, Math.floor(((hi2 - minZ) / spanZ) * cells)));
    for (let iz = z0; iz <= z1; iz += 1) {
      for (let ix = x0; ix <= x1; ix += 1) buckets[iz * cells + ix].push(t);
    }
  }

  return { buckets, cells, minX, minZ, spanX, spanZ };
}

/** Medan ketinggian, replika `buildHeightField`. */
function heightField(tris, box, index) {
  const heights = new Float64Array(GRID * GRID).fill(NaN);
  const [minX, , minZ] = box.min;
  const [spanX, spanY, spanZ] = box.size;
  const above = box.max[1] + spanY * 0.1;

  for (let iz = 0; iz < GRID; iz += 1) {
    for (let ix = 0; ix < GRID; ix += 1) {
      const ox = minX + ((ix + 0.5) / GRID) * spanX;
      const oz = minZ + ((iz + 0.5) / GRID) * spanZ;

      const cx = Math.max(0, Math.min(index.cells - 1, Math.floor(((ox - index.minX) / index.spanX) * index.cells)));
      const cz = Math.max(0, Math.min(index.cells - 1, Math.floor(((oz - index.minZ) / index.spanZ) * index.cells)));

      let best = Infinity;
      for (const t of index.buckets[cz * index.cells + cx]) {
        const d = hitTriangle(tris, t, ox, above, oz, 0, -1, 0);
        if (d >= 0 && d < best) best = d;
      }
      if (best < Infinity) heights[iz * GRID + ix] = above - best;
    }
  }

  return heights;
}

/** Replika `findCell`. */
function findCell(heights, box, anchor, accept) {
  const [ax, , az] = anchor;
  const [minX, minY, minZ] = box.min;
  const [spanX, spanY, spanZ] = box.size;
  let best = null;

  for (let iz = 0; iz < GRID; iz += 1) {
    for (let ix = 0; ix < GRID; ix += 1) {
      const h = heights[iz * GRID + ix];
      if (Number.isNaN(h)) continue;
      const normalised = spanY > 0 ? (h - minY) / spanY : 0;
      if (!accept(h, normalised)) continue;

      const fx = (ix + 0.5) / GRID;
      const fz = (iz + 0.5) / GRID;
      const score = Math.hypot(fx - ax, fz - az);
      if (!best || score < best.score) {
        best = { x: minX + fx * spanX, y: h, z: minZ + fz * spanZ, score, normalised };
      }
    }
  }

  return best;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Replika `snapHotspot`, dengan catatan tentang jalur mana yang dipakai. */
function snap(hotspot, tris, box, heights) {
  const { anchor, surface } = hotspot;
  const [minX, minY, minZ] = box.min;
  const [spanX, spanY, spanZ] = box.size;

  if (surface === "top") {
    const tiers = [
      ["utama", (_, n) => n > 0.6],
      ["cadangan", (_, n) => n > 0.35],
      ["apa saja", () => true],
    ];
    for (const [tier, accept] of tiers) {
      const hit = findCell(heights, box, anchor, accept);
      if (hit) return { ...hit, y: hit.y + spanY * 0.015, jalur: `top/${tier}` };
    }
  }

  if (surface === "ground") {
    const tiers = [
      ["utama", (_, n) => n < 0.25],
      ["cadangan", (_, n) => n < 0.5],
      ["apa saja", () => true],
    ];
    for (const [tier, accept] of tiers) {
      const hit = findCell(heights, box, anchor, accept);
      if (hit) return { ...hit, y: hit.y + spanY * 0.04, jalur: `ground/${tier}` };
    }
  }

  if (surface === "face") {
    const target = [
      minX + clamp01(anchor[0]) * spanX,
      minY + clamp01(anchor[1]) * spanY,
      minZ + clamp01(anchor[2]) * spanZ,
    ];
    const centre = [(minX + box.max[0]) / 2, target[1], (minZ + box.max[2]) / 2];
    let dx = centre[0] - target[0];
    let dz = centre[2] - target[2];
    const len = Math.hypot(dx, dz);

    if (len > 1e-3) {
      dx /= len;
      dz /= len;
      const diag = Math.hypot(spanX, spanY, spanZ);
      const ox = centre[0] - dx * diag;
      const oz = centre[2] - dz * diag;

      let best = Infinity;
      for (let t = 0; t < tris.length; t += 9) {
        const d = hitTriangle(tris, t, ox, target[1], oz, dx, 0, dz);
        if (d >= 0 && d < best) best = d;
      }

      if (best < Infinity) {
        return {
          x: ox + dx * best - dx * diag * 0.006,
          y: target[1],
          z: oz + dz * best - dz * diag * 0.006,
          jalur: "face/kena",
        };
      }
    }
    return { x: target[0], y: target[1], z: target[2], jalur: "face/MELESET" };
  }

  return { x: minX + clamp01(anchor[0]) * spanX, y: minY + clamp01(anchor[1]) * spanY, z: minZ + clamp01(anchor[2]) * spanZ, jalur: "cadangan/MENTAH" };
}

/**
 * Medan ketinggian sebagai peta ASCII.
 *
 * Alat untuk MEMILIH anchor, bukan sekadar menilainya. Tiap sel satu digit
 * ketinggian ternormalisasi — titik berarti sinar tidak mengenai apa pun, jadi
 * di situ memang tidak ada bangunan. Sumbu X ke kanan, Z ke bawah, keduanya
 * dibaca 0..1 persis seperti `anchor`.
 */
function printMap(heights, box, slug) {
  const spanY = box.size[1] || 1;
  console.log(c.dim(`\n  peta ${slug}  (x -> kanan, z -> bawah, digit = tinggi 0..9)`));
  for (let iz = 0; iz < GRID; iz += 1) {
    let row = "";
    for (let ix = 0; ix < GRID; ix += 1) {
      const h = heights[iz * GRID + ix];
      if (Number.isNaN(h)) { row += " ."; continue; }
      const n = (h - box.min[1]) / spanY;
      row += ` ${Math.max(0, Math.min(9, Math.round(n * 9)))}`;
    }
    console.log(c.dim(`    z=${((iz + 0.5) / GRID).toFixed(2)} ${row}`));
  }
  console.log("");
}

/* ── Data ─────────────────────────────────────────────────────────────── */

function readHotspots(file) {
  /* Akhir baris dinormalkan dulu. Berkas data di pohon kerja bisa berakhiran
     CRLF — Git menyimpannya LF dan mengubahnya saat checkout — dan pola yang
     menuntut LF diam-diam tidak cocok dengan apa pun lalu melaporkan "tidak
     ada hotspot" alih-alih melaporkan kesalahannya. Alat ukur yang gagal
     tanpa bersuara lebih buruk daripada tidak ada alat ukur. */
  const src = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const m = src.match(/\n {2}hotspots: \[\n([\s\S]*?)\n {2}\],/);
  if (!m) {
    console.log(c.yellow(`    tidak menemukan blok hotspots di ${path.basename(file)}`));
    return [];
  }

  /* Diawali baris kosong supaya pemisahnya juga mengenali blok PERTAMA:
     tanpa itu `slice(1)` membuang hotspot nomor satu setiap berkas. */
  return `\n${m[1]}`
    .split(/\n {4}\{\n/)
    .slice(1)
    .map((block) => {
      const id = block.match(/^ {6}id: "([^"]+)"/m)?.[1] ?? "?";
      const anchor = block.match(/anchor: \[([^\]]+)\]/)?.[1].split(",").map(Number);
      const surface = block.match(/surface: "([^"]+)"/)?.[1];
      return anchor && surface ? { id, anchor, surface } : null;
    })
    .filter(Boolean);
}

/* ── Jalan ────────────────────────────────────────────────────────────── */

async function main() {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });

  const models = new Map();
  for (const continent of fs.readdirSync(MODELS_DIR)) {
    const dir = path.join(MODELS_DIR, continent);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".glb") || file.endsWith("-proxy.glb")) continue;
      models.set(file.replace(/\.glb$/, ""), path.join(dir, file));
    }
  }

  const slugs = [...models.keys()]
    .filter((s) => ONLY.length === 0 || ONLY.some((n) => s.includes(n)))
    .sort();

  console.log(c.bold(`\n  check-hotspots — ${slugs.length} model\n`));

  const suspects = [];

  for (const slug of slugs) {
    const dataFile = path.join(DATA_DIR, `${slug}.ts`);
    if (!fs.existsSync(dataFile)) continue;

    const hotspots = readHotspots(dataFile);
    const document = await io.read(models.get(slug));
    const tris = collectTriangles(document);
    const box = bounds(tris);
    const index = buildIndex(tris, box, 32);
    const heights = heightField(tris, box, index);

    if (MAP) printMap(heights, box, slug);

    const terisi = heights.filter((h) => !Number.isNaN(h)).length;
    console.log(
      `  ${c.bold(slug.padEnd(24))} ${c.dim(`${(tris.length / 9).toLocaleString()} segitiga · medan ${terisi}/${GRID * GRID}`)}`,
    );

    /* Sel tempat tiap penanda mendarat, untuk menangkap yang MENUMPUK.

       Dua hotspot yang jatuh di sel yang sama tidak pernah tertangkap ukuran
       geseran: keduanya bisa dekat dengan anchornya masing-masing dan tetap
       berakhir di satu titik yang sama di layar, satu menutupi yang lain.
       Medan ketinggiannya 20x20, jadi sel adalah satuan terkecil yang bisa
       dibedakan `snapHotspot` — dua penanda di sel yang sama memang mustahil
       dipisahkan. */
    const cells = new Map();

    for (const hotspot of hotspots) {
      const hit = snap(hotspot, tris, box, heights);
      const f = [
        (hit.x - box.min[0]) / (box.size[0] || 1),
        (hit.y - box.min[1]) / (box.size[1] || 1),
        (hit.z - box.min[2]) / (box.size[2] || 1),
      ];
      const drift = Math.hypot(f[0] - hotspot.anchor[0], f[2] - hotspot.anchor[2]);
      const dy = f[1] - hotspot.anchor[1];

      /* Tinggi permukaan di sel tempat penanda mendarat, 0..1. Ia yang
         membedakan "mendarat di bangunan" dari "mendarat di air" — banyak model
         di koleksi ini membawa lanskap atau permukaan laut yang jauh lebih luas
         daripada bangunannya, dan penanda yang jatuh di sana terbaca sebagai
         titik yang mengambang entah di mana. */
      const cx = Math.max(0, Math.min(GRID - 1, Math.floor(f[0] * GRID)));
      const cz = Math.max(0, Math.min(GRID - 1, Math.floor(f[2] * GRID)));
      const local = heights[cz * GRID + cx];
      const ground = Number.isNaN(local) ? NaN : (local - box.min[1]) / (box.size[1] || 1);

      /* **`dy` sengaja TIDAK ikut memutuskan.** Untuk `top` dan `ground`,
         `snapHotspot` mengabaikan komponen Y anchor sama sekali — ia cuma
         memilih sel lewat XZ lalu memakai tinggi permukaan yang ditemukannya di
         sana. Selisih Y karena itu bukan kesalahan melainkan jawaban: ia
         memberi tahu setinggi apa massa di titik itu. Memakainya sebagai vonis
         menandai Colosseum dan Notre-Dame yang sebenarnya benar.

         Untuk `face`, geseran besar juga sering BENAR: bentuk yang mengerucut
         seperti piramida memang punya permukaan jauh di dalam tepi kotaknya
         pada ketinggian menengah. Yang benar-benar menuduh cuma dua: sinar yang
         meleset sama sekali, dan sinar yang menyeberangi hampir seluruh model
         sebelum mengenai sesuatu. */
      const bad =
        hit.jalur.includes("MELESET") ||
        hit.jalur.includes("MENTAH") ||
        hit.jalur.includes("apa saja") ||
        (hotspot.surface !== "face" && drift > 0.15) ||
        (hotspot.surface === "face" && drift > 0.45);

      const mark = bad ? c.red("  BERMASALAH") : drift > 0.2 ? c.yellow("  meragukan") : c.green("  ok");
      console.log(
        `    ${hotspot.id.padEnd(16)} ${hotspot.surface.padEnd(7)} ` +
          `anchor [${hotspot.anchor.map((v) => v.toFixed(2)).join(" ")}] -> ` +
          `[${f.map((v) => v.toFixed(2)).join(" ")}] ` +
          c.dim(
            `geser ${drift.toFixed(2)} dy ${dy >= 0 ? "+" : ""}${dy.toFixed(2)} ` +
              `permukaan ${Number.isNaN(ground) ? "-" : ground.toFixed(2)} ${hit.jalur}`,
          ) +
          mark,
      );

      /* Kunci TIGA dimensi, bukan dua. Dua penanda yang berbagi sel XZ tetapi
         berbeda ketinggian justru sering benar — pedimen di atas pintu pada
         fasad yang sama adalah susunan yang dimaksud, bukan tabrakan. Yang
         benar-benar saling menutupi hanya yang berimpit di ketiga sumbunya. */
      const key = `${Math.floor(f[0] * GRID)},${Math.floor(f[1] * GRID)},${Math.floor(f[2] * GRID)}`;
      const twin = cells.get(key);
      if (twin) {
        console.log(`    ${" ".repeat(16)} ${c.red(`menumpuk dengan ${twin}`)}`);
        suspects.push({ slug, ...hotspot, jalur: `menumpuk/${twin}`, drift, dy, landed: f });
      } else {
        cells.set(key, hotspot.id);
      }

      if (bad) suspects.push({ slug, ...hotspot, jalur: hit.jalur, drift, dy, landed: f });
    }
    console.log("");
  }

  if (suspects.length === 0) {
    console.log(c.green("  Tidak ada yang mencurigakan.\n"));
    return;
  }

  console.log(c.bold(c.red(`  ${suspects.length} penanda bermasalah:\n`)));
  for (const s of suspects) {
    console.log(
      `    ${s.slug}/${s.id}  ${s.surface}  ${s.jalur}  geser ${s.drift.toFixed(2)}  dy ${s.dy.toFixed(2)}`,
    );
  }
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
