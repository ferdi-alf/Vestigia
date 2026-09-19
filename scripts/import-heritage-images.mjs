#!/usr/bin/env node
/**
 * import-heritage-images — drop zone gambar pemilik project jadi asset aplikasi.
 *
 *   npm run import:images              seluruh koleksi
 *   npm run import:images -- borobudur satu situs
 *   npm run import:images -- --icons   apple-icon.png dari src/app/icon.svg
 *
 * ---
 *
 * **Jalurnya sudah ada; yang belum ada isinya.** `RelatedStrip` sudah merender
 * lima bingkai per halaman warisan dan `sync-media.mjs` sudah memindai
 * `public/images/heritage/` dengan konvensi `<slug>-01.webp` … `<slug>-05.webp`.
 * Script ini cuma mengisi folder itu; nol baris kode aplikasi berubah karenanya,
 * dan itu memang janji §2 — menambah isi tidak boleh mengubah arsitektur.
 *
 * ---
 *
 * **PETA FOLDER DITULIS TANGAN, DAN ITU BUKAN KEMALASAN.**
 *
 * Tujuh dari lima belas nama folder tidak sama dengan slug-nya, dan beberapa
 * salah eja: `cichen-itza`, `machu-pichu`, `terakota`, `piramida`. Menormalkan
 * nama secara otomatis berarti menebak, dan tebakan yang meleset menaruh foto
 * Lalibela di halaman Petra — kesalahan yang tidak akan pernah dilaporkan build
 * dan hanya ketahuan kalau ada yang kebetulan mengenali batunya.
 *
 * Jadi pemetaannya eksplisit, dan tiap slug tujuan diperiksa punya berkas data
 * di `src/data/heritage/` sebelum satu berkas pun ditulis.
 *
 * ---
 *
 * **KENAPA LIMA TERBESAR.**
 *
 * Tiap folder memuat lima sampai enam gambar dengan nama yang tidak memberi
 * petunjuk apa pun — `images (1).jpg`, `noylbl2tuilbbrafowbp.jpg`. Tidak ada
 * cara menilai mana yang paling bagus tanpa melihat isinya, dan mengarang
 * peringkat berdasarkan nama berkas adalah persis jenis klaim yang dilarang
 * project ini.
 *
 * Luas piksel satu-satunya ukuran mutu yang bisa dihitung. Slot 01 yang paling
 * menonjol di halaman, jadi ia mendapat sumber dengan detail terbanyak.
 *
 * ---
 *
 * **KENAPA SHARP, DAN KENAPA TIDAK DIDAFTARKAN.**
 *
 * Sharp sudah ada di pohon dependency sebagai dependensi Next.js. Ia dipakai di
 * sini oleh script LOKAL yang tidak pernah berjalan di CI — sumbernya berada di
 * luar repo dan mesin build tidak akan pernah punya foldernya — jadi
 * mendaftarkannya di `package.json` menambah baris tanpa menambah kemampuan.
 * Presedennya `make-thumbs.mjs`, yang menulis PNG lewat `zlib` bawaan Node dan
 * karena itu tidak perlu mendaftarkan apa pun sama sekali.
 *
 * Yang wajib: gagal dengan SUARA. Script berhenti dengan pesan yang menyebut
 * penyebabnya kalau sharp tidak bisa dimuat, bukan diam-diam menghasilkan nol
 * berkas lalu terbaca seperti sukses.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.resolve(ROOT, "..", "images");
const OUT_DIR = path.join(ROOT, "public", "images", "heritage");
const DATA_DIR = path.join(ROOT, "src", "data", "heritage");
const ICON_SVG = path.join(ROOT, "src", "app", "icon.svg");
const APPLE_ICON = path.join(ROOT, "src", "app", "apple-icon.png");

const ARGS = process.argv.slice(2);
const ONLY = ARGS.filter((a) => !a.startsWith("-"));
const ICONS_ONLY = ARGS.includes("--icons");

/**
 * Folder drop zone -> slug kanonik.
 *
 * Delapan sama persis, tujuh tidak. Yang tidak sama ditulis apa adanya termasuk
 * salah ejanya, karena yang harus cocok adalah nama folder yang BENAR-BENAR ada
 * di disk, bukan nama yang seharusnya.
 */
const FOLDERS = {
  "abu-simbel": "abu-simbel",
  "angkor-wat": "angkor-wat",
  "bete-giyorgis": "lalibela",
  borobudur: "borobudur",
  "cichen-itza": "chichen-itza",
  colosseum: "colosseum",
  liberty: "statue-of-liberty",
  "machu-pichu": "machu-picchu",
  moai: "moai",
  "notre-dame": "notre-dame",
  petra: "petra",
  piramida: "great-pyramid-of-giza",
  stonehenge: "stonehenge",
  sydney: "sydney-opera-house",
  terakota: "terracotta-army",
};

/** Berapa slot per warisan. `RelatedStrip` merender tepat lima, selalu. */
const SLOTS = 5;

/** Sisi terpanjang setelah penskalaan. Cukup untuk dibuka penuh di dialog,
    jauh di bawah ukuran sumber yang sebagian lebih dari empat ribu piksel. */
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;

/**
 * Tangga kualitas WebP.
 *
 * 74 duduk di tempat artefaknya belum terbaca pada foto batu dan langit. Tetapi
 * satu angka tetap tidak cukup, dan itu terukur: sumber yang SUDAH berupa webp
 * atau avif beresolusi besar keluar lebih GEMUK daripada masuknya — petra-02
 * membengkak dari 332 KB jadi 393 KB pada 74. Foto berbutir halus juga menolak
 * memampat pada kualitas yang sama yang cukup untuk langit bersih.
 *
 * Jadi tiap berkas dicoba menurun sampai ia masuk anggaran. Yang keluar bukan
 * "kualitas 74 apa pun ukurannya" melainkan "kualitas setinggi mungkin yang
 * masih muat", dan sebagian besar berkas selesai pada anak tangga pertama.
 */
const QUALITY_STEPS = [74, 64, 56, 48];

/** Anggaran per berkas, byte. Ditegakkan lewat tangga di atas, bukan sekadar
    dilaporkan — ia tidak berguna kalau cuma jadi catatan kaki. */
const BUDGET = 200 * 1024;

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff"]);

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
};

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    console.error(
      c.red("\n  sharp tidak bisa dimuat.\n") +
        c.dim(
          "  Ia biasanya ikut terpasang bersama Next.js. Coba `npm install` dulu;\n" +
            "  kalau tetap tidak ada, `npm install --no-save sharp` sudah cukup —\n" +
            "  script ini lokal dan tidak pernah berjalan di mesin build.\n",
        ),
    );
    process.exit(1);
  }
}

/* ── apple-icon dari icon.svg ─────────────────────────────────────────── */

/**
 * Satu bentuk, dua berkas.
 *
 * `icon.svg` yang jadi sumber kebenaran; PNG-nya dirender darinya, bukan
 * digambar ulang. Dua gambar yang sama-sama ditulis tangan adalah dua gambar
 * yang akan berbeda pada perubahan berikutnya.
 */
async function buildAppleIcon(sharp) {
  if (!fs.existsSync(ICON_SVG)) {
    console.log(c.yellow(`  Tidak ada ${path.relative(ROOT, ICON_SVG)} — apple-icon dilewati.`));
    return;
  }

  await sharp(fs.readFileSync(ICON_SVG), { density: 512 })
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(APPLE_ICON);

  const size = fs.statSync(APPLE_ICON).size;
  console.log(`  ${c.green("apple-icon.png")} 180x180 ${c.dim(kb(size))}`);
}

/* ── Impor ────────────────────────────────────────────────────────────── */

async function main() {
  const sharp = await loadSharp();

  if (ICONS_ONLY) {
    console.log(c.bold("\n  import-heritage-images — ikon saja\n"));
    await buildAppleIcon(sharp);
    console.log("");
    return;
  }

  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(c.yellow(`\n  Drop zone tidak ada: ${SOURCE_DIR}`));
    console.log(c.dim("  Tidak ada yang bisa diimpor. Berkas yang sudah ada dibiarkan.\n"));
    return;
  }

  const jobs = Object.entries(FOLDERS)
    .filter(([folder, slug]) => ONLY.length === 0 || ONLY.some((n) => folder.includes(n) || slug.includes(n)))
    .map(([folder, slug]) => ({ folder, slug, dir: path.join(SOURCE_DIR, folder) }));

  /* Slug diperiksa SEBELUM satu berkas pun ditulis. Berkas yang mendarat pada
     slug yang tidak ada di koleksi tidak akan pernah dirender, tidak akan
     pernah mengeluh, dan hanya menambah berat repo. */
  const unknown = jobs.filter((j) => !fs.existsSync(path.join(DATA_DIR, `${j.slug}.ts`)));
  if (unknown.length > 0) {
    console.error(c.red("\n  Slug tujuan tidak ada di src/data/heritage:\n"));
    for (const j of unknown) console.error(`    ${j.folder} -> ${j.slug}`);
    console.error("");
    process.exit(1);
  }

  console.log(c.bold(`\n  import-heritage-images — ${jobs.length} situs, ${SLOTS} slot\n`));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  let total = 0;
  let overBudget = 0;
  const missing = [];

  for (const job of jobs) {
    if (!fs.existsSync(job.dir)) {
      missing.push(`${job.folder} (folder tidak ada)`);
      continue;
    }

    const files = fs
      .readdirSync(job.dir, { withFileTypes: true })
      .filter((e) => e.isFile() && ALLOWED.has(path.extname(e.name).toLowerCase()))
      .map((e) => path.join(job.dir, e.name));

    /* Dimensi dibaca lebih dulu supaya urutannya ditentukan luas piksel, bukan
       ukuran berkas: JPEG mutu rendah beresolusi besar mengalahkan JPEG mutu
       tinggi beresolusi kecil pada byte, padahal yang dibutuhkan detailnya. */
    const measured = [];
    for (const file of files) {
      try {
        const meta = await sharp(file).metadata();
        const width = meta.width ?? 0;
        const height = meta.height ?? 0;
        if (width > 0 && height > 0) measured.push({ file, width, height, area: width * height });
      } catch {
        console.log(c.yellow(`    ${path.basename(file)} tidak terbaca — dilewati`));
      }
    }

    measured.sort((a, b) => b.area - a.area);
    const picked = measured.slice(0, SLOTS);

    if (picked.length < SLOTS) {
      missing.push(`${job.folder} (${picked.length}/${SLOTS} gambar terbaca)`);
    }

    console.log(`  ${c.bold(job.slug.padEnd(24))} ${c.dim(`${measured.length} sumber`)}`);

    for (const [index, source] of picked.entries()) {
      const name = `${job.slug}-0${index + 1}.webp`;
      const dest = path.join(OUT_DIR, name);

      let size = Infinity;
      let used = QUALITY_STEPS[0];
      let width = MAX_WIDTH;
      let height = MAX_HEIGHT;

      /* Tangga kualitas dulu, lalu — kalau anak tangga terendah pun masih
         kegemukan — DIMENSINYA yang turun, bukan kualitasnya lagi.

         Urutan itu disengaja. Foto berbutir halus menolak memampat pada
         kualitas berapa pun; menekannya lebih jauh menukar butiran asli dengan
         artefak blok, dan yang hilang justru tekstur batu yang jadi alasan foto
         itu ada. Memperkecil bingkainya membuang piksel yang memang tidak
         pernah terlihat: dialog terbesar pun tidak melampaui 1280 piksel CSS di
         hampir semua layar. */
      const ladder = [
        ...QUALITY_STEPS.map((quality) => ({ quality, w: MAX_WIDTH, h: MAX_HEIGHT })),
        { quality: 60, w: 1280, h: 960 },
        { quality: 56, w: 1024, h: 768 },
      ];

      for (const step of ladder) {
        const quality = step.quality;
        width = step.w;
        height = step.h;
        await sharp(source.file)
          /* Orientasi EXIF diterapkan, lalu dibuang bersama sisa metadata.
             Sharp membuang metadata secara bawaan — yang berarti koordinat GPS
             dan nama kamera di dalam foto orang lain tidak ikut ter-commit. */
          .rotate()
          .resize({
            width,
            height,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality, effort: 5 })
          .toFile(dest);

        size = fs.statSync(dest).size;
        used = quality;
        if (size <= BUDGET) break;
      }

      written += 1;
      total += size;
      if (size > BUDGET) overBudget += 1;

      console.log(
        `    ${name.padEnd(30)} ${c.dim(`${source.width}x${source.height} -> `)}` +
          `${size > BUDGET ? c.yellow(kb(size)) : c.green(kb(size))} ` +
          c.dim(
            `(dari ${kb(fs.statSync(source.file).size)}` +
              `${used === QUALITY_STEPS[0] ? "" : `, q${used}`}` +
              `${width === MAX_WIDTH ? "" : `, ${width}px`})`,
          ),
      );
    }
  }

  console.log("");
  console.log(c.bold(`  ${written} berkas · ${kb(total)} · rata-rata ${kb(total / (written || 1))}`));
  if (overBudget > 0) {
    console.log(c.yellow(`  ${overBudget} berkas melewati anggaran ${kb(BUDGET)} per gambar.`));
  }
  for (const note of missing) console.log(c.yellow(`  ${note}`));

  console.log(c.dim("\n  Jalankan `npm run sync:media` supaya manifestnya ikut tahu.\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
