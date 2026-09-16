#!/usr/bin/env node
/**
 * sync-heritage — jembatan antara /3d-object dan aplikasi.
 *
 * Folder /3d-object adalah sumber kebenaran tentang heritage mana yang ada.
 * Script ini membacanya, memampatkan tiap GLB sampai muat anggaran web,
 * menyalinnya ke public/, dan menuliskan manifest yang dikonsumsi registry.
 * Aplikasi tidak pernah menebak asset apa yang tersedia — ia hanya tahu apa
 * yang tertulis di manifest ini.
 *
 *   npm run sync:heritage              optimasi + tulis manifest
 *   npm run sync:heritage -- --fast    lewati optimasi, salin apa adanya
 *   npm run sync:heritage -- --force   optimasi ulang walau sudah mutakhir
 *
 * Berjalan otomatis sebelum `build` (penuh) dan `dev` (--fast).
 * Aman dijalankan berulang: file yang sudah mutakhir dilewati.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.resolve(ROOT, "..", "3d-object");
const PUBLIC_DIR = path.join(ROOT, "public", "models");
const META_DIR = path.join(ROOT, "src", "data", "heritage");
const MANIFEST = path.join(ROOT, "src", "data", "generated", "asset-manifest.ts");
const SLUG_MAP_FILE = path.join(ROOT, "scripts", "heritage-slugs.json");

/**
 * Nama folder yang dikenali, dipetakan ke slug benua kanonik.
 * Bahasa Indonesia maupun Inggris sama-sama diterima — folder drop zone
 * adalah wilayah Anda, aplikasi yang menyesuaikan diri.
 */
const CONTINENT_ALIASES = {
  asia: "asia",
  africa: "africa",
  afrika: "africa",
  europe: "europe",
  eropa: "europe",
  americas: "americas",
  america: "americas",
  amerika: "americas",
  oceania: "oceania",
  oseania: "oceania",
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Anggaran ukuran per model, byte.
 *
 * Angka ini menentukan pengalaman di ponsel lebih dari setelan lain mana pun.
 * Model 40 MB akan sampai juga di jaringan yang bagus, tetapi di 4G biasa ia
 * berarti setengah menit layar kosong, dan itu bukan pengalaman yang sedang
 * kita bangun.
 */
const SIZE_BUDGET = 4 * 1024 * 1024;

/**
 * Tangga optimasi, dari paling menjaga detail ke paling agresif.
 *
 * Model dijalankan menuruni tangga sampai muat anggaran. Naskah pemindaian
 * fotogrametri bisa datang 157 MB; satu setelan tetap tidak mungkin melayani
 * itu sekaligus melayani model 1 MB yang sudah rapi tanpa merusaknya.
 *
 * Anak tangga terakhir menurunkan tekstur sampai 512. Itu terdengar merusak,
 * dan memang bisa — karena itu ia tidak pernah dipilih hanya karena tersedia.
 * Yang menentukan adalah aturan pemilihan di bawah: sebuah anak tangga yang
 * lebih agresif hanya menang kalau ia benar-benar jauh lebih kecil.
 *
 * Pengujian menunjukkan kenapa aturan itu perlu, dan kenapa tidak boleh ada
 * lantai tekstur yang dipatok di muka. Pada Colosseum, tekstur hanya 99 KB
 * dari 11 MB — menurunkannya ke 512 merusak tampilan tanpa memangkas apa pun.
 * Pada Borobudur, yang punya tiga tekstur beresolusi tinggi, justru sebaliknya:
 * tekstur adalah hampir seluruh berkasnya. Satu aturan tetap tidak bisa
 * melayani keduanya; pengukuran per model bisa.
 */
const LADDER = [
  { name: "ringan", texture: 2048, ratio: 0.75, error: 0.001 },
  { name: "sedang", texture: 2048, ratio: 0.4, error: 0.004 },
  { name: "kuat", texture: 1024, ratio: 0.2, error: 0.01 },
  { name: "agresif", texture: 1024, ratio: 0.08, error: 0.02 },
  { name: "maksimum", texture: 512, ratio: 0.04, error: 0.04 },
];

/**
 * Ambang hasil yang menurun.
 *
 * Kalau satu anak tangga tidak memangkas setidaknya sebesar ini dibanding
 * yang terbaik sejauh ini, penyederhana jelas tidak bisa bekerja pada mesh
 * itu — biasanya karena geometrinya tidak punya vertex bersama sama sekali —
 * dan melanjutkan hanya menukar kualitas dengan nol keuntungan.
 */
const DIMINISHING_RETURNS = 0.85;

/** Selisih ukuran yang masih dianggap setara, saat memilih kualitas terbaik. */
const SIZE_TIE_MARGIN = 1.1;

const FAST = process.argv.includes("--fast");
const FORCE = process.argv.includes("--force");

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function loadSlugMap() {
  if (!fs.existsSync(SLUG_MAP_FILE)) return {};
  const raw = JSON.parse(fs.readFileSync(SLUG_MAP_FILE, "utf8"));
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
}

/** Ubah nama file berantakan jadi slug yang layak URL. */
function normaliseSlug(name) {
  return name
    .toLowerCase()
    .replace(/[\s_.]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Kumpulkan GLB yang benar-benar ada, dan catat apa saja yang janggal. */
function scanSource(slugMap) {
  const assets = [];
  const problems = [];

  if (!fs.existsSync(SOURCE_DIR)) return { assets, problems, missingSourceDir: true };

  for (const entry of fs.readdirSync(SOURCE_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const continent = CONTINENT_ALIASES[entry.name.toLowerCase()];
    if (!continent) {
      problems.push(`folder "${entry.name}/" bukan nama benua yang dikenali — dilewati`);
      continue;
    }

    const dir = path.join(SOURCE_DIR, entry.name);
    for (const file of fs.readdirSync(dir)) {
      if (!file.toLowerCase().endsWith(".glb")) {
        if (!file.startsWith(".") && file.toLowerCase() !== "readme.md") {
          problems.push(`${entry.name}/${file} bukan .glb — dilewati`);
        }
        continue;
      }

      const base = file.slice(0, -4);
      const slug = slugMap[base] ?? normaliseSlug(base);
      if (!SLUG_RE.test(slug)) {
        problems.push(`${entry.name}/${file} tidak bisa dijadikan slug — tambahkan pemetaan di scripts/heritage-slugs.json`);
        continue;
      }

      assets.push({ slug, continent, source: path.join(dir, file), sourceName: base });
    }
  }

  const seen = new Map();
  for (const asset of assets) {
    if (seen.has(asset.slug)) {
      problems.push(`slug "${asset.slug}" dipakai dua file: ${seen.get(asset.slug)} dan ${asset.sourceName}`);
    }
    seen.set(asset.slug, asset.sourceName);
  }

  assets.sort((a, b) => a.continent.localeCompare(b.continent) || a.slug.localeCompare(b.slug));
  return { assets, problems, missingSourceDir: false };
}

function runGltfTransform(args) {
  execFileSync("npx", ["--no-install", "gltf-transform", ...args], {
    stdio: "pipe",
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
}

/**
 * Turuni tangga optimasi dan pilih hasil terbaik.
 *
 * Bukan sekadar "pakai yang paling agresif". Aturannya:
 *  1. berhenti begitu satu anak tangga muat anggaran;
 *  2. berhenti kalau pemangkasan sudah tidak berarti — tanda penyederhana
 *     tidak bisa bekerja pada mesh ini;
 *  3. di antara hasil yang ukurannya setara, ambil yang kualitasnya paling tinggi.
 *
 * Aturan ketiga itu yang penting. Tanpanya, model yang geometrinya tidak bisa
 * disederhanakan tetap diturunkan teksturnya sampai hancur, dan hasilnya
 * terlihat jauh lebih buruk tanpa menjadi lebih kecil.
 */
function optimise(source, dest) {
  if (FAST) {
    fs.copyFileSync(source, dest);
    return { level: null, fallback: true };
  }

  const attempts = [];
  let lastError = null;
  let stoppedEarly = false;

  for (const [index, step] of LADDER.entries()) {
    // Ekstensi harus tetap .glb: gltf-transform memilih format penulisan dari
    // ekstensi berkas, dan nama berakhiran .tmp menghasilkan berkas kosong.
    const candidate = dest.replace(/\.glb$/, `.__${step.name}.glb`);
    try {
      runGltfTransform([
        "optimize",
        source,
        candidate,
        "--compress",
        "draco",
        "--texture-compress",
        "webp",
        "--texture-size",
        String(step.texture),
        "--simplify",
        "true",
        "--simplify-error",
        String(step.error),
        "--simplify-ratio",
        String(step.ratio),
      ]);
    } catch (error) {
      lastError = (error.stderr?.toString() || error.message || "").trim().split("\n").pop();
      if (fs.existsSync(candidate)) fs.rmSync(candidate);
      continue;
    }

    const size = fs.statSync(candidate).size;
    attempts.push({ step, size, path: candidate, index });

    if (size <= SIZE_BUDGET) break;

    const best = Math.min(...attempts.map((a) => a.size));
    if (attempts.length >= 2 && size > best * DIMINISHING_RETURNS) {
      stoppedEarly = index < LADDER.length - 1;
      break;
    }
  }

  /**
   * Aturan hasil-menurun di atas mengukur satu hal, padahal tangga ini
   * menggerakkan dua tuas: penyederhanaan geometri dan resolusi tekstur.
   * Pada model yang geometrinya tidak bisa disederhanakan, beberapa anak
   * tangga pertama tampak sia-sia dan aturan itu menghentikan pencarian —
   * padahal kemenangan sesungguhnya baru datang di anak tangga terakhir,
   * tempat tekstur turun ke 512. Borobudur adalah kasus persisnya: berhenti
   * lebih awal menghasilkan 19 MB, sedangkan anak tangga terakhir 6 MB.
   *
   * Jadi kalau pencarian berhenti lebih awal dan belum ada yang muat, anak
   * tangga terakhir tetap dicoba sekali. Biayanya satu proses tambahan;
   * imbalannya model yang benar-benar bisa dimuat di ponsel.
   */
  if (stoppedEarly && !attempts.some((a) => a.size <= SIZE_BUDGET)) {
    const step = LADDER[LADDER.length - 1];
    if (!attempts.some((a) => a.step.name === step.name)) {
      const candidate = dest.replace(/\.glb$/, `.__${step.name}.glb`);
      try {
        runGltfTransform([
          "optimize", source, candidate,
          "--compress", "draco",
          "--texture-compress", "webp",
          "--texture-size", String(step.texture),
          "--simplify", "true",
          "--simplify-error", String(step.error),
          "--simplify-ratio", String(step.ratio),
        ]);
        attempts.push({ step, size: fs.statSync(candidate).size, path: candidate, index: LADDER.length - 1 });
      } catch {
        if (fs.existsSync(candidate)) fs.rmSync(candidate);
      }
    }
  }

  if (attempts.length === 0) {
    fs.copyFileSync(source, dest);
    return { level: null, fallback: true, reason: lastError };
  }

  const underBudget = attempts.find((a) => a.size <= SIZE_BUDGET);
  let chosen;
  if (underBudget) {
    chosen = underBudget;
  } else {
    // Tidak ada yang muat. Ambil yang paling kecil, tetapi kalau ada hasil
    // lebih awal yang ukurannya setara, hasil itu lebih baik dilihat.
    const smallest = attempts.reduce((a, b) => (b.size < a.size ? b : a));
    chosen = attempts.find((a) => a.size <= smallest.size * SIZE_TIE_MARGIN) ?? smallest;
  }

  fs.renameSync(chosen.path, dest);
  for (const attempt of attempts) {
    if (attempt.path !== chosen.path && fs.existsSync(attempt.path)) fs.rmSync(attempt.path);
  }

  return { level: chosen.step.name, overBudget: chosen.size > SIZE_BUDGET, tried: attempts.length };
}

function writeManifest(entries) {
  const body = entries
    .map(
      (e) =>
        `  {\n` +
        `    slug: ${JSON.stringify(e.slug)},\n` +
        `    continent: ${JSON.stringify(e.continent)},\n` +
        `    modelPath: ${JSON.stringify(e.modelPath)},\n` +
        `    bytes: ${e.bytes},\n` +
        `  },`,
    )
    .join("\n");

  const source = `// DIGENERATE OTOMATIS oleh scripts/sync-heritage.mjs — jangan diedit tangan.
// Mencerminkan isi /3d-object pada saat sync terakhir.
// Jalankan \`npm run sync:heritage\` setelah menambah atau menghapus file GLB.
import type { HeritageAsset } from "../types";

export const ASSET_MANIFEST: readonly HeritageAsset[] = [
${body || "  // belum ada asset 3D — taruh file .glb di /3d-object/<benua>/"}
];
`;

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  const previous = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, "utf8") : "";
  if (previous !== source) fs.writeFileSync(MANIFEST, source);
  return previous !== source;
}

function main() {
  console.log(c.bold("\n  sync-heritage"));
  console.log(c.dim(`  sumber   ${path.relative(process.cwd(), SOURCE_DIR)}`));
  console.log(c.dim(`  anggaran ${mb(SIZE_BUDGET)} per model${FAST ? "  ·  mode cepat, optimasi dilewati" : ""}\n`));

  const slugMap = loadSlugMap();
  const { assets, problems, missingSourceDir } = scanSource(slugMap);

  if (missingSourceDir) {
    console.log(c.yellow(`  Folder /3d-object tidak ditemukan di ${SOURCE_DIR}`));
    console.log(c.dim("  Manifest dikosongkan. Aplikasi tetap bisa di-build.\n"));
    writeManifest([]);
    return;
  }

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const entries = [];
  let processed = 0;
  let skipped = 0;
  let overBudget = 0;

  for (const asset of assets) {
    const outDir = path.join(PUBLIC_DIR, asset.continent);
    fs.mkdirSync(outDir, { recursive: true });
    const dest = path.join(outDir, `${asset.slug}.glb`);

    const sourceStat = fs.statSync(asset.source);
    const fresh =
      !FORCE && fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= sourceStat.mtimeMs;

    let note;
    if (fresh) {
      skipped += 1;
      note = c.dim("mutakhir");
    } else {
      const result = optimise(asset.source, dest);
      processed += 1;
      const after = fs.statSync(dest).size;
      const saved = Math.max(0, 100 - Math.round((after / sourceStat.size) * 100));
      if (result.fallback) {
        note = c.yellow(`disalin apa adanya${result.reason ? c.dim(` (${result.reason})`) : ""}`);
      } else {
        note = `${c.green(`−${saved}%`)} ${c.dim(result.level)}`;
      }
    }

    const bytes = fs.statSync(dest).size;
    const over = bytes > SIZE_BUDGET;
    if (over) overBudget += 1;

    console.log(
      `  ${c.cyan(asset.continent.padEnd(9))} ${asset.slug.padEnd(24)} ` +
        `${c.dim(mb(sourceStat.size).padStart(9))} ${c.dim("→")} ` +
        `${(over ? c.yellow : c.green)(mb(bytes).padStart(9))}   ${note}`,
    );

    entries.push({
      slug: asset.slug,
      continent: asset.continent,
      modelPath: `/models/${asset.continent}/${asset.slug}.glb`,
      bytes,
    });
  }

  /**
   * Sapu bersih apa pun di public/models yang bukan model aktif.
   *
   * Dua jenis sampah bisa menumpuk di sini. Yang pertama, model yang berkas
   * sumbernya sudah dihapus dari /3d-object. Yang kedua lebih halus: kalau
   * sebuah proses optimasi terhenti di tengah jalan, gltf-transform bisa
   * meninggalkan berkas kandidat dan sumber daya eksternalnya — .bin, .webp,
   * .ktx2 — yang tidak dirujuk siapa pun tetapi ikut terbawa ke hosting.
   *
   * Karena itu aturannya dibalik: apa pun yang tidak ada di manifest dibuang,
   * bukan hanya berkas .glb yang dikenali.
   */
  const wanted = new Set(entries.map((e) => `${e.continent}/${e.slug}.glb`));
  let swept = 0;
  for (const continent of new Set(Object.values(CONTINENT_ALIASES))) {
    const dir = path.join(PUBLIC_DIR, continent);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (wanted.has(`${continent}/${file}`)) continue;
      fs.unlinkSync(path.join(dir, file));
      swept += 1;
      if (file.endsWith(".glb") && !file.includes(".__")) {
        console.log(`  ${c.cyan(continent.padEnd(9))} ${file.padEnd(24)} ${c.red("dihapus (sumber hilang)")}`);
      }
    }
    if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  }
  if (swept > 0) console.log(c.dim(`  ${swept} berkas tak terpakai disapu dari public/models`));

  const changed = writeManifest(entries);
  const totalBytes = entries.reduce((n, e) => n + e.bytes, 0);

  const hasMeta = (slug) => fs.existsSync(path.join(META_DIR, `${slug}.ts`));
  const needsMeta = entries.filter((e) => !hasMeta(e.slug));
  const metaFiles = fs.existsSync(META_DIR)
    ? fs
        .readdirSync(META_DIR)
        .filter((f) => f.endsWith(".ts") && f !== "index.ts" && !f.startsWith("_"))
        .map((f) => f.slice(0, -3))
    : [];
  const orphanMeta = metaFiles.filter((slug) => !entries.some((e) => e.slug === slug));

  console.log(
    c.dim(
      `\n  ${entries.length} asset  ·  ${processed} diproses  ·  ${skipped} dilewati  ·  ` +
        `total ${mb(totalBytes)}  ·  manifest ${changed ? "diperbarui" : "tidak berubah"}`,
    ),
  );

  if (problems.length) {
    console.log(c.yellow(`\n  ${problems.length} file diabaikan:`));
    for (const p of problems) console.log(c.yellow(`    · ${p}`));
  }

  if (overBudget) {
    console.log(
      c.yellow(`\n  ${overBudget} model masih di atas anggaran ${mb(SIZE_BUDGET)}.`) +
        c.dim("\n    Sumbernya terlalu berat untuk dipampatkan tanpa merusak bentuk."),
    );
  }

  if (needsMeta.length) {
    console.log(c.yellow(`\n  ${needsMeta.length} asset belum punya metadata — belum tampil di web:`));
    for (const e of needsMeta) console.log(c.yellow(`    · src/data/heritage/${e.slug}.ts`));
  }

  if (orphanMeta.length) {
    console.log(c.dim(`\n  ${orphanMeta.length} metadata tanpa asset 3D — di luar koleksi aktif:`));
    for (const slug of orphanMeta) console.log(c.dim(`    · ${slug}`));
  }

  const active = entries.length - needsMeta.length;
  console.log(
    entries.length === 0
      ? c.dim("\n  Belum ada asset 3D. Aplikasi akan menampilkan empty state.\n")
      : c.green(`\n  ${active} heritage aktif di koleksi.\n`),
  );
}

main();
