#!/usr/bin/env node
/**
 * sync-media — jembatan antara public/images/landing dan aplikasi.
 *
 * Kembarannya sync-heritage, untuk gambar. Perbedaan pentingnya satu: GLB itu
 * wajib — heritage tanpa model tidak masuk koleksi — sedangkan gambar tidak.
 * Slot yang kosong bukan kesalahan, hanya keadaan; landing sudah dirancang
 * untuk tetap utuh tanpanya, dan komposisi CSS yang mengambil alih.
 *
 * Karena itu script ini tidak pernah gagal dan tidak pernah memblokir build.
 * Ia hanya mencatat apa yang ada dan memberi tahu apa yang belum.
 *
 *   npm run sync:media
 *
 * Berjalan otomatis sebelum `dev` dan `build`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_DIR = path.join(ROOT, "public", "images", "landing");
const VIDEO_DIR = path.join(ROOT, "public", "videos");
/* Gambar pendamping per warisan, dipakai workspace 3D. Konvensinya nama:
   `<slug>-01.webp` … `<slug>-05.webp`. Tidak ada slot yang dideklarasikan untuk
   ini — jumlahnya per warisan dan berubah setiap kali satu berkas ditaruh, jadi
   yang dipindai adalah FOLDERNYA, bukan daftar yang ditulis tangan. */
const RELATED_DIR = path.join(ROOT, "public", "images", "heritage");
const SLOTS_FILE = path.join(ROOT, "src", "data", "landing-media.ts");
const VIDEO_SLOTS_FILE = path.join(ROOT, "src", "data", "landing-video.ts");
const MANIFEST = path.join(ROOT, "src", "data", "generated", "media-manifest.ts");

/** Format yang boleh dipakai. AVIF dan WebP didahulukan; PNG hanya kalau alpha
    benar-benar perlu presisi. GIF sengaja tidak ada. */
const ALLOWED = new Set([".webp", ".avif", ".png", ".jpg", ".jpeg"]);

/* Video dan bingkai pendampingnya tinggal di folder yang sama. `.mp4` adalah
   satu-satunya wadah yang boleh: ia satu-satunya yang menjamin `currentTime`
   seek di semua peramban target, dan seluruh sekuens ini di-scrub, tidak pernah
   diputar. `.webm` sengaja tidak ada — ia menambah satu berkas lagi untuk
   keuntungan yang tidak pernah dipakai jalur ini. */
const ALLOWED_VIDEO = new Set([".mp4", ".webp", ".avif", ".jpg", ".jpeg"]);

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

/**
 * Daftar slot dibaca dari deklarasi TypeScript-nya, bukan diduplikasi di sini.
 * Satu daftar, satu tempat: menambah slot cukup di landing-media.ts dan laporan
 * ini ikut tahu tanpa disentuh.
 */
function expectedFiles() {
  if (!fs.existsSync(SLOTS_FILE)) return [];
  const source = fs.readFileSync(SLOTS_FILE, "utf8");
  const out = [];
  // Hanya `id` yang langsung diikuti `file` — `id` di dalam LocalizedText
  // punya bentuk yang berbeda dan sengaja tidak ikut tertangkap.
  const re = /\{\s*\n\s*id:\s*"([^"]+)",\s*\n\s*file:\s*"([^"]+)"/g;
  let match;
  while ((match = re.exec(source))) out.push({ id: match[1], file: match[2] });
  return out;
}

function scan(dir, allowed) {
  if (!fs.existsSync(dir)) return new Map();
  const found = new Map();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!allowed.has(path.extname(entry.name).toLowerCase())) continue;
    const stat = fs.statSync(path.join(dir, entry.name));
    found.set(entry.name, stat.size);
  }
  return found;
}

/**
 * Berkas yang dituntut slot video.
 *
 * Satu slot menuntut LIMA berkas: klipnya, posternya, dan tiga bingkai untuk
 * jalur ponsel. Kelimanya opsional dengan cara yang sama seperti gambar —
 * yang tidak ada digantikan komposisi CSS, dan laporan di bawah menyebut
 * persis mana yang belum ada supaya tidak perlu ditebak.
 */
function expectedVideoFiles() {
  if (!fs.existsSync(VIDEO_SLOTS_FILE)) return [];
  const source = fs.readFileSync(VIDEO_SLOTS_FILE, "utf8");
  const out = [];
  const re = /\{\s*\n\s*id:\s*"([^"]+)",\s*\n\s*file:\s*"([^"]+)"/g;
  let match;
  while ((match = re.exec(source))) {
    const id = match[1];
    out.push({ id, file: match[2], role: "klip" });
    const rest = source.slice(match.index, match.index + 1400);
    const poster = /poster:\s*"([^"]+)"/.exec(rest);
    if (poster) out.push({ id, file: poster[1], role: "poster" });
    const stills = /stills:\s*\[([^\]]*)\]/.exec(rest);
    if (stills) {
      for (const hit of stills[1].matchAll(/"([^"]+)"/g)) {
        out.push({ id, file: hit[1], role: "bingkai" });
      }
    }
  }
  return out;
}

function rows(found, prefix) {
  return [...found.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([file, bytes]) =>
        `  ${JSON.stringify(file)}: { src: "${prefix}/${file}", bytes: ${bytes} },`,
    )
    .join("\n");
}

function writeManifest(found, foundVideo, foundRelated) {
  const body = rows(found, "/images/landing");
  const videoBody = rows(foundVideo, "/videos");
  const relatedBody = rows(foundRelated, "/images/heritage");

  const source = `// DIGENERATE OTOMATIS oleh scripts/sync-media.mjs — jangan diedit tangan.
// Mencerminkan isi public/images/landing/ dan public/videos/ pada saat sync terakhir.
// Jalankan \`npm run sync:media\` setelah menambah atau menghapus berkas.

export interface MediaFile {
  src: string;
  bytes: number;
}

export const MEDIA_MANIFEST: Readonly<Record<string, MediaFile>> = {
${body || "  /* belum ada gambar */"}
};

/* Klip video dan bingkai pendampingnya. Kosong bukan kesalahan: section yang
   memakainya turun ke komposisi CSS, sama seperti slot gambar yang kosong. */
export const VIDEO_MANIFEST: Readonly<Record<string, MediaFile>> = {
${videoBody || "  /* belum ada video */"}
};

/* Gambar pendamping per warisan. Workspace merender bingkai kosong untuk yang
   belum ada, jadi menaruh berkas ke public/images/heritage/ sudah cukup. */
export const RELATED_MANIFEST: Readonly<Record<string, MediaFile>> = {
${relatedBody || "  /* belum ada gambar pendamping */"}
};
`;

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  const previous = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, "utf8") : "";
  if (previous !== source) fs.writeFileSync(MANIFEST, source);
  return previous !== source;
}

function main() {
  const expected = expectedFiles();
  const found = scan(IMAGE_DIR, ALLOWED);
  const expectedVideo = expectedVideoFiles();
  const foundVideo = scan(VIDEO_DIR, ALLOWED_VIDEO);
  const foundRelated = scan(RELATED_DIR, ALLOWED);
  const changed = writeManifest(found, foundVideo, foundRelated);

  console.log(c.bold("\n  sync-media"));
  console.log(c.dim(`  sumber   ${path.relative(process.cwd(), IMAGE_DIR)}\n`));

  const filled = [];
  const missing = [];
  for (const slot of expected) {
    if (found.has(slot.file)) filled.push(slot);
    else missing.push(slot);
  }

  for (const slot of filled) {
    console.log(
      `  ${c.cyan(slot.id.padEnd(18))} ${slot.file.padEnd(24)} ${c.green(kb(found.get(slot.file)).padStart(8))}`,
    );
  }

  /* Laporan video. Sengaja dipisah dari gambar dan bukan digabung: keduanya
     punya anggaran yang berbeda dan nasib yang berbeda, dan menggabungkannya
     akan menyembunyikan satu klip 4 MB di antara sembilan berkas 40 KB. */
  if (expectedVideo.length > 0) {
    const vFilled = expectedVideo.filter((s) => foundVideo.has(s.file));
    const vMissing = expectedVideo.filter((s) => !foundVideo.has(s.file));
    const vTotal = [...foundVideo.values()].reduce((n, b) => n + b, 0);

    console.log(c.dim(`  video    ${path.relative(process.cwd(), VIDEO_DIR)}`));
    for (const slot of vFilled) {
      console.log(
        `  ${c.cyan(slot.id.padEnd(18))} ${slot.file.padEnd(24)} ${c.green(kb(foundVideo.get(slot.file)).padStart(8))}`,
      );
    }
    console.log(
      c.dim(
        `  ${expectedVideo.length} berkas  ·  ${vFilled.length} ada  ·  ${vMissing.length} belum  ·  total ${kb(vTotal)}\n`,
      ),
    );
    if (vMissing.length > 0) {
      console.log(c.yellow(`  ${vMissing.length} berkas video belum ada — section turun ke komposisi CSS:`));
      for (const slot of vMissing) {
        console.log(c.yellow(`    · ${slot.role.padEnd(8)} ${c.dim(`public/videos/${slot.file}`)}`));
      }
      console.log("");
    }
  }

  const known = new Set(expected.map((s) => s.file));
  const extra = [...found.keys()].filter((f) => !known.has(f));

  const total = [...found.values()].reduce((n, b) => n + b, 0);
  console.log(
    c.dim(
      `\n  ${expected.length} slot  ·  ${filled.length} terisi  ·  ${missing.length} kosong` +
        `  ·  total ${kb(total)}${changed ? "  ·  manifest diperbarui" : ""}\n`,
    ),
  );

  if (missing.length > 0) {
    console.log(c.yellow(`  ${missing.length} slot belum punya gambar — memakai komposisi CSS:`));
    for (const slot of missing) {
      console.log(c.yellow(`    · ${slot.id.padEnd(18)} ${c.dim(`public/images/landing/${slot.file}`)}`));
    }
    console.log(c.dim("\n    Ini bukan kesalahan. Landing tetap tampil utuh tanpanya.\n"));
  }

  if (extra.length > 0) {
    console.log(c.dim(`  ${extra.length} berkas tidak dipakai slot mana pun:`));
    for (const file of extra) console.log(c.dim(`    · ${file}`));
    console.log("");
  }
}

main();
