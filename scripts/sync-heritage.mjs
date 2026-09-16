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
import { execSync } from "node:child_process";
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
/**
 * Tangga untuk varian PROXY — object seukuran kuku di atas globe.
 *
 * Bukan bagian dari tangga utama dan tidak pernah dipilih untuk halaman
 * warisan. Section Dunia menampilkan kelima belas model sekaligus, dan lima
 * belas model penuh berarti 52 MB di satu halaman — mustahil. Pada beberapa
 * puluh piksel, yang terbaca hanya siluet: tekstur 128 dan geometri yang
 * dipangkas habis tidak bisa dibedakan dari aslinya.
 *
 * Dua anak tangga, bukan satu, karena beberapa model sudah low-poly sejak awal
 * dan `simplify-ratio` adalah batas bawah, bukan target — pada model itu yang
 * menentukan ukurannya tekstur, bukan geometri.
 */
const PROXY_LADDER = [
  { name: "proxy", texture: 128, ratio: 0.02, error: 0.08 },
  { name: "proxy kecil", texture: 64, ratio: 0.008, error: 0.14 },
];

/** Anggaran per proxy. Lima belas × ini masih muat dalam satu section. */
const PROXY_BUDGET = 300 * 1024;

const DIMINISHING_RETURNS = 0.85;

/** Selisih ukuran yang masih dianggap setara, saat memilih kualitas terbaik. */
const SIZE_TIE_MARGIN = 1.1;

const FAST = process.argv.includes("--fast");
const FORCE = process.argv.includes("--force");

/**
 * Bangun varian proxy. OPT-IN, dan itu konsekuensi dari pengukuran.
 *
 *   npm run sync:heritage -- --proxy
 *
 * Empat belas dari lima belas model tidak bisa mencapai anggaran proxy selama
 * biner `ktx` dari KTX-Software belum terpasang: tekstur KTX2/ETC1S 2048x2048
 * mereka dilewati DIAM-DIAM oleh `--texture-size`, yang tidak bisa mengubah
 * ukuran tekstur terkompresi tanpa men-transcode lebih dulu. Mencobanya ulang
 * tiap sync berarti membayar lima menit untuk kegagalan yang sudah diketahui.
 *
 * Proxy yang SUDAH ada di disk tetap didaftarkan apa pun modenya, jadi
 * mematikan bendera ini tidak pernah membuat proxy yang valid hilang dari
 * manifest atau tersapu penyapu.
 */
const PROXY = process.argv.includes("--proxy");

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

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

/**
 * Nama binernya berbeda di Windows, dan itu bukan detail kosmetik.
 *
 * `execFileSync` tidak lewat shell, jadi ia mencari berkas dengan nama PERSIS
 * seperti yang diminta. Di Windows yang ada `npx.cmd`; meminta `npx` menghasilkan
 * `spawnSync npx ENOENT` — dan karena setiap kegagalan di tangga optimasi memang
 * ditelan supaya anak tangga berikutnya sempat dicoba, kegagalan ini tidak pernah
 * muncul ke permukaan. Yang terlihat cuma model yang tidak pernah teroptimasi.
 *
 * Memakai `shell: true` juga menyelesaikannya, tetapi itu menyerahkan seluruh
 * daftar argumen ke penguraian shell — dan nama berkas sumber di sini memang
 * mengandung titik dan tanda hubung.
 */
const WIN = process.platform === "win32";
const NPX = WIN ? "npx.cmd" : "npx";

/* Seluruh argumen kini melewati shell, jadi yang mengandung spasi WAJIB
   dikutip di kedua platform — bukan cuma di Windows seperti sebelumnya. */
const quoted = (arg) => (arg.includes(" ") ? `"${arg}"` : arg);

function runGltfTransform(args) {
  const all = [NPX, "--no-install", "gltf-transform", ...args].map(quoted);

  /* `execSync` dengan SATU string, bukan `execFileSync` dengan daftar argumen
     plus `shell: true`. Keduanya menjalankan hal yang sama, tetapi yang kedua
     membuat Node menyalakan DEP0190 pada setiap sync — argumen yang diserahkan
     ke shell memang tidak di-escape, cuma disambung. Membangun stringnya
     sendiri membuat penyambungan itu eksplisit dan terlihat, bukan tersembunyi
     di balik API yang menjanjikan hal lain. */
  execSync(all.join(" "), {
    /* `shell: true` wajib di Windows, dan bukan karena kenyamanan.

       Sejak perbaikan CVE-2024-27980, Node menolak menjalankan berkas `.cmd`
       lewat `execFileSync` tanpa shell dan melempar `EINVAL`. Jadi di sini
       urutannya mengunci: `npx` tidak ada (ENOENT), `npx.cmd` ditolak (EINVAL),
       dan hanya `npx.cmd` + shell yang berjalan. */
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

/**
 * Bangun varian proxy. Satu berkas, dua percobaan, tanpa pemilihan kualitas.
 *
 * Sengaja jauh lebih sederhana daripada `optimise`: di sana pilihan kualitas
 * penting karena hasilnya yang dilihat orang dari jarak dekat. Di sini tidak —
 * yang lebih kecil selalu menang selama siluetnya masih berdiri.
 */
function makeProxy(source, dest) {
  let best = null;
  let lastError = null;

  for (const step of PROXY_LADDER) {
    const candidate = dest.replace(/\.glb$/, `.__${step.name.replace(/\s+/g, "-")}.glb`);
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
      /* Kenapa gagalnya DICATAT, bukan ditelan: proxy yang tidak jadi membuat
         object hilang dari globe tanpa satu pun pesan, dan itu jenis kegagalan
         yang baru ketahuan saat melihat layar. */
      lastError = (error.stderr?.toString() || error.message || "").trim().slice(-160);
      if (fs.existsSync(candidate)) fs.rmSync(candidate);
      continue;
    }

    const size = fs.statSync(candidate).size;
    if (best) fs.rmSync(best.path);
    best = { path: candidate, size, level: step.name };
    if (size <= PROXY_BUDGET) break;
  }

  if (!best) {
    console.log(`  ${c.yellow("proxy gagal")} ${path.basename(dest)} ${c.dim(lastError ?? "")}`);
    return null;
  }

  /* Proxy yang tidak kecil BUKAN proxy, dan menyimpannya lebih buruk daripada
     tidak punya sama sekali: ia menggandakan berat repo untuk berkas yang tetap
     terlalu mahal dimuat lima belas sekaligus.

     Yang menahannya sekarang bukan tangga ini melainkan sumbernya. Sepuluh dari
     lima belas model membawa tekstur KTX2/ETC1S 2048x2048, dan `--texture-size`
     milik gltf-transform DIAM-DIAM melewati tekstur KTX2 — ia tidak bisa
     mengubah ukurannya tanpa men-transcode lebih dulu. Transcode itu butuh
     biner `ktx` dari KTX-Software, yang tidak terpasang di mesin ini.

     Jadi yang lolos hanya model yang geometrinya memang bisa disederhanakan dan
     teksturnya bukan KTX2. Sisanya tidak didaftarkan, dan pemakainya jatuh ke
     penanda titik. Nol asumsi asset — §1. */
  if (best.size > PROXY_BUDGET) {
    fs.rmSync(best.path);
    if (fs.existsSync(dest)) fs.rmSync(dest);
    console.log(
      `  ${" ".repeat(9)} ${c.dim(`${path.basename(dest, ".glb")}`.padEnd(24))} ` +
        `${" ".repeat(11)} ${c.yellow(kb(best.size).padStart(9))}   ` +
        `${c.dim(`lewat anggaran ${kb(PROXY_BUDGET)} — tidak didaftarkan`)}`,
    );
    return null;
  }

  fs.renameSync(best.path, dest);
  return best;
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
        (e.proxyPath
          ? `    proxyPath: ${JSON.stringify(e.proxyPath)},\n` +
            `    proxyBytes: ${e.proxyBytes},\n`
          : "") +
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

    /* Varian proxy untuk globe di section Dunia.

       Dilewati pada `--fast` (`predev`): membangunnya dua kali per model mahal,
       dan yang sudah ada tetap berlaku. Yang PENTING, proxy yang ada di disk
       tetap didaftarkan ke `entries` apa pun modenya — kalau tidak, penyapu di
       bawah akan menghapusnya sebagai berkas tak terpakai. */
    const proxyDest = path.join(outDir, `${asset.slug}-proxy.glb`);
    const proxyFresh =
      !FORCE && fs.existsSync(proxyDest) && fs.statSync(proxyDest).mtimeMs >= sourceStat.mtimeMs;

    if (PROXY && !proxyFresh && !FAST) {
      const made = makeProxy(asset.source, proxyDest);
      if (made) {
        const over = made.size > PROXY_BUDGET;
        console.log(
          `  ${" ".repeat(9)} ${c.dim(`${asset.slug}-proxy`.padEnd(24))} ` +
            `${" ".repeat(11)} ` +
            `${(over ? c.yellow : c.green)(kb(made.size).padStart(9))}   ${c.dim(made.level)}`,
        );
      }
    }

    const entry = {
      slug: asset.slug,
      continent: asset.continent,
      modelPath: `/models/${asset.continent}/${asset.slug}.glb`,
      bytes,
    };

    if (fs.existsSync(proxyDest)) {
      entry.proxyPath = `/models/${asset.continent}/${asset.slug}-proxy.glb`;
      entry.proxyBytes = fs.statSync(proxyDest).size;
    }

    entries.push(entry);
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
  /* Proxy WAJIB ikut didaftarkan. Aturan penyapu di atas dibalik dengan
     sengaja — apa pun yang tidak ada di sini dibuang — jadi berkas proxy yang
     tidak disebut akan dihapus persis setelah dibuat. */
  const wanted = new Set(entries.flatMap((e) => [
    `${e.continent}/${e.slug}.glb`,
    ...(e.proxyPath ? [`${e.continent}/${e.slug}-proxy.glb`] : []),
  ]));
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
