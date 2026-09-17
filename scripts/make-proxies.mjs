#!/usr/bin/env node
/**
 * make-proxies — object seukuran kuku untuk berdiri di atas globe.
 *
 * Section Dunia menampilkan kelima belas warisan sekaligus di permukaan bola.
 * Model penuhnya berjumlah 52 MB; pada beberapa puluh piksel di layar, yang
 * terbaca dari sebuah candi hanyalah SILUETNYA.
 *
 *   npm run make:proxies
 *
 * ---
 *
 * **KENAPA BUKAN `gltf-transform optimize` SEPERTI SAUDARANYA.**
 *
 * Sudah dicoba, dan hasilnya diukur: lima belas proxy = 38,7 MB, dengan
 * Borobudur justru LEBIH BESAR daripada model penuhnya. `gltf-transform inspect`
 * menunjukkan dua sebab yang berdiri sendiri-sendiri:
 *
 *   1. Teksturnya KTX2/ETC1S 2048x2048, dan `--texture-size` melewatinya
 *      diam-diam — ia tidak bisa mengubah ukuran tekstur terkompresi tanpa
 *      men-transcode lebih dulu, dan itu butuh biner `ktx` yang tidak ada.
 *   2. `--simplify-ratio 0.02` meninggalkan Borobudur pada 173.220 verteks.
 *      Penyederhana tidak bisa merapatkan mesh yang penuh JAHITAN ATRIBUT, dan
 *      model ini membawa TIGA set UV plus tangent.
 *
 * Script ini menyerang keduanya di akarnya: **buang teksturnya, lalu buang
 * atribut yang hanya ada untuk melayani tekstur itu.** Setelah UV dan tangent
 * pergi, yang tersisa cuma posisi dan normal — dan di situ penyederhana punya
 * ruang gerak yang sebenarnya.
 *
 * Yang hilang bersamanya adalah warna permukaan. Itu bukan kerugian di sini:
 * object di globe diwarnai satu material batu dari token, sama seperti bolanya.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Logger, NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression, ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  compactPrimitive,
  dedup,
  dequantize,
  draco,
  normals,
  prune,
  simplify,
  weld,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = path.join(ROOT, "public", "models");

/**
 * Anggaran per proxy.
 *
 * Lima belas kali angka ini adalah yang benar-benar diunduh section Dunia, dan
 * ia section TERAKHIR — pengunjung yang sampai ke sana sudah membaca dua babak.
 * Itu yang membuat 150 KB masuk akal di sini sementara di halaman warisan 4 MB
 * masuk akal: yang berbeda bukan toleransinya, melainkan berapa banyak yang
 * dimuat sekaligus.
 */
const BUDGET = 150 * 1024;

/**
 * Tangga penyederhanaan. Turun satu anak tangga tiap kali hasilnya lewat anggaran.
 *
 * `ratio` adalah pecahan segitiga yang DIINGINKAN tersisa, `error` batas galat
 * yang boleh diterima. Keduanya batas, bukan perintah: penyederhana berhenti
 * pada yang mana pun tercapai lebih dulu, jadi mesh yang bersih turun jauh
 * sementara mesh yang kacau berhenti di tengah jalan.
 */
const LADDER = [
  { name: "sedang", ratio: 0.08, error: 0.02 },
  { name: "kuat", ratio: 0.03, error: 0.05 },
  { name: "agresif", ratio: 0.012, error: 0.1 },
  { name: "maksimum", ratio: 0.004, error: 0.25 },
  /* Anak tangga terakhir untuk mesh yang topologinya melawan. Galat sebesar ini
     merusak bentuk pada ukuran penuh — dan justru tidak terlihat pada ukuran
     yang dipakai section Dunia, beberapa puluh piksel di atas bola. */
  { name: "ekstrem", ratio: 0.0015, error: 0.6 },

  /* ── Di bawah sini penyederhana BERGANTI, bukan cuma disetel lebih keras ──
     Empat anak tangga di atas memakai `meshopt_simplify`, yang menjaga topologi:
     ia menolak setiap peruntuhan rusuk yang akan membuat mesh jadi non-manifold.
     Pada model hasil pemindaian, penolakan itu mengunci hasilnya jauh di atas
     target — terukur pada Colosseum: diminta 0,15% segitiga, yang keluar 36%,
     dan menaikkan galat sampai 0,6 tidak menggesernya.

     `meshopt_simplifySloppy` membuang jaminan itu. Ia tidak peduli manifold,
     tidak peduli rusuk tepi, dan tidak menjanjikan siluet yang terjaga — ia cuma
     menjanjikan sesuatu yang MIRIP pada jumlah segitiga yang diminta. Itu tepat
     kontrak yang dibutuhkan sebuah proxy: pada beberapa puluh piksel di atas
     bola, yang terbaca cuma massa dan tingginya. */
  { name: "kasar", ratio: 0.03, error: 1, sloppy: true },
  { name: "kasar-kuat", ratio: 0.008, error: 1, sloppy: true },
];

const FORCE = process.argv.includes("--force");

/**
 * Saringan slug opsional: `npm run make:proxies -- colosseum`.
 *
 * Membangun ulang kelima belas model memakan menit, dan menyetel satu anak
 * tangga untuk satu model yang melawan tidak membutuhkan empat belas lainnya.
 */
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function makeIO() {
  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });
}

/**
 * Lucuti segalanya yang hanya ada untuk melayani tekstur.
 *
 * Urutannya penting. Material dilepas dari teksturnya LEBIH DULU, supaya
 * `prune` di akhir melihat gambar-gambar itu sebagai tak terpakai dan benar-benar
 * membuangnya dari berkas. Melakukannya terbalik meninggalkan megabyte KTX2 yang
 * tidak lagi dirujuk siapa pun tetapi tetap ikut ditulis.
 */
function stripSurface(document) {
  for (const material of document.getRoot().listMaterials()) {
    material
      .setBaseColorTexture(null)
      .setNormalTexture(null)
      .setEmissiveTexture(null)
      .setOcclusionTexture(null)
      .setMetallicRoughnessTexture(null);
    /* Warna dasar dinetralkan juga: object ini diwarnai material batu di
       komponennya, dan warna dasar bawaan model akan menimpanya. */
    material.setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0).setRoughnessFactor(1);
  }

  /* SEMUA atribut dibuang kecuali POSITION — termasuk NORMAL, dan NORMAL itulah
     yang paling menentukan.

     `weld()` hanya menggabungkan verteks yang SELURUH atributnya sama. Pada mesh
     berbayang datar, tiap segitiga punya normalnya sendiri, jadi tidak ada satu
     pun verteks yang bisa digabungkan — dan penyederhana melihat sejuta segitiga
     yang saling lepas, tanpa satu pun rusuk yang boleh diruntuhkan.

     Terukur pada Angkor Wat: dengan NORMAL dipertahankan, 1.452.498 verteks
     tinggal 1.441.294 — nol koma delapan persen, dan menaikkan batas galat dari
     0,2 ke 0,8 tidak mengubahnya sama sekali. Dengan NORMAL dibuang lebih dulu:
     14.523 verteks. Dari 1.798 KB jadi 27 KB.

     Normalnya dihitung ulang setelah penyederhanaan — lihat `normals()` di
     `buildProxy`. Menghitungnya dari bentuk yang SUDAH disederhanakan juga lebih
     benar daripada membawa normal lama yang menggambarkan permukaan lain. */
  let dropped = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      for (const name of prim.listSemantics()) {
        if (name === "POSITION") continue;
        prim.setAttribute(name, null);
        dropped += 1;
      }
    }
  }
  return dropped;
}

/**
 * Anak tangga `sloppy` — penyederhana yang melepaskan topologi.
 *
 * Ditulis tangan karena `simplify()` milik gltf-transform hanya membungkus
 * `meshopt_simplify`, dan yang dibutuhkan di sini justru saudaranya.
 * Bedanya satu kalimat: yang pertama menolak peruntuhan yang merusak
 * manifold, yang kedua tidak mengenal konsep itu sama sekali.
 *
 * `dequantize()` dijalankan lebih dulu karena `simplifySloppy` menuntut
 * `Float32Array` — model yang posisinya masih terkuantisasi integer akan
 * ditolak assert-nya, bukan diam-diam salah.
 *
 * `compactPrimitive()` menutup pekerjaannya: mengganti indeks saja
 * meninggalkan seluruh verteks lama di dalam berkas, tidak lagi dirujuk
 * siapa pun tetapi tetap ikut ditulis dan ikut dikompresi Draco.
 */
function sloppyPass(ratio, error) {
  return async (document) => {
    await MeshoptSimplifier.ready;
    await document.transform(dequantize());

    for (const mesh of document.getRoot().listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const indices = prim.getIndices();
        const position = prim.getAttribute("POSITION");
        if (!indices || !position) continue;

        const srcIndices = new Uint32Array(indices.getArray());
        const srcPositions = new Float32Array(position.getArray());

        /* Kelipatan tiga, dan tidak pernah nol: sebuah mesh tanpa satu pun
           segitiga bukan penyederhanaan melainkan penghapusan. */
        let target = Math.floor((srcIndices.length * ratio) / 3) * 3;
        if (target < 3) target = 3;
        if (target >= srcIndices.length) continue;

        const [dstIndices] = MeshoptSimplifier.simplifySloppy(
          srcIndices,
          srcPositions,
          3,
          null,
          target,
          error,
        );

        indices.setArray(dstIndices);
        compactPrimitive(prim);
      }
    }
  };
}

function countVertices(document) {
  let total = 0;
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      total += prim.getAttribute("POSITION")?.getCount() ?? 0;
    }
  }
  return total;
}

/**
 * Setiap pass gltf-transform mengumumkan dirinya ke konsol, dan lima belas model
 * kali enam pass mengubur tabel ukurannya. Yang dicari saat menjalankan script
 * ini hanya satu: berapa kilobyte. Kesalahan tetap lewat.
 */
const QUIET = new Logger(Logger.Verbosity.ERROR);

async function buildProxy(io, source, dest) {
  const before = await io.read(source);
  const vertsBefore = countVertices(before);

  let best = null;

  for (const step of LADDER) {
    const document = await io.read(source);
    document.setLogger(QUIET);
    stripSurface(document);

    const reduce = step.sloppy
      ? sloppyPass(step.ratio, step.error)
      : simplify({ simplifier: MeshoptSimplifier, ratio: step.ratio, error: step.error });

    await document.transform(
      weld(),
      reduce,
      /* Normal dihitung ulang DARI bentuk yang sudah disederhanakan. Ia dibuang
         sebelum weld supaya penyederhana punya ruang gerak; dikembalikan di sini
         supaya object tetap punya naungan saat berdiri di atas globe. */
      normals({ overwrite: true }),
      dedup(),
      prune({ keepAttributes: false, keepLeaves: false }),
      draco(),
    );

    const candidate = dest.replace(/\.glb$/, `.__${step.name}.glb`);
    await io.write(candidate, document);

    const size = fs.statSync(candidate).size;
    const verts = countVertices(document);

    if (best) fs.rmSync(best.path);
    best = { path: candidate, size, verts, level: step.name };
    if (size <= BUDGET) break;
  }

  if (!best) return null;
  fs.renameSync(best.path, dest);
  return { ...best, vertsBefore, vertsAfter: best.verts };
}

async function main() {
  if (!fs.existsSync(MODELS_DIR)) {
    console.log(c.yellow(`Tidak ada ${MODELS_DIR} — jalankan \`npm run sync:heritage\` dulu.`));
    return;
  }

  const io = await makeIO();
  io.registerExtensions([KHRDracoMeshCompression]);

  const jobs = [];
  for (const continent of fs.readdirSync(MODELS_DIR)) {
    const dir = path.join(MODELS_DIR, continent);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".glb") || file.endsWith("-proxy.glb")) continue;
      const slug = file.replace(/\.glb$/, "");
      if (ONLY.length > 0 && !ONLY.some((needle) => slug.includes(needle))) continue;
      jobs.push({ continent, slug, source: path.join(dir, file) });
    }
  }

  jobs.sort((a, b) => a.continent.localeCompare(b.continent) || a.slug.localeCompare(b.slug));

  console.log(c.bold(`\n  make-proxies — ${jobs.length} model, anggaran ${kb(BUDGET)}\n`));

  let over = 0;
  let total = 0;

  for (const job of jobs) {
    const dest = path.join(MODELS_DIR, job.continent, `${job.slug}-proxy.glb`);
    const sourceStat = fs.statSync(job.source);

    if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= sourceStat.mtimeMs) {
      const size = fs.statSync(dest).size;
      total += size;
      console.log(
        `  ${c.cyan(job.continent.padEnd(9))} ${job.slug.padEnd(24)} ${c.dim(kb(size).padStart(9))}   ${c.dim("mutakhir")}`,
      );
      continue;
    }

    try {
      const result = await buildProxy(io, job.source, dest);
      if (!result) {
        console.log(`  ${c.cyan(job.continent.padEnd(9))} ${job.slug.padEnd(24)} ${c.red("gagal")}`);
        continue;
      }

      total += result.size;
      const fits = result.size <= BUDGET;
      if (!fits) over += 1;

      console.log(
        `  ${c.cyan(job.continent.padEnd(9))} ${job.slug.padEnd(24)} ` +
          `${c.dim(mb(sourceStat.size).padStart(8))} ${c.dim("→")} ` +
          `${(fits ? c.green : c.yellow)(kb(result.size).padStart(9))}   ` +
          `${c.dim(`${result.vertsBefore.toLocaleString()} → ${result.vertsAfter.toLocaleString()} verteks · ${result.level}`)}`,
      );
    } catch (error) {
      console.log(
        `  ${c.cyan(job.continent.padEnd(9))} ${job.slug.padEnd(24)} ${c.red("gagal")} ${c.dim(String(error.message).slice(-120))}`,
      );
    }
  }

  console.log(
    `\n  ${jobs.length} model  ·  total ${mb(total)}  ·  ` +
      (over > 0 ? c.yellow(`${over} lewat anggaran`) : c.green("semuanya muat")) +
      "\n",
  );
  console.log(c.dim("  Jalankan `npm run sync:heritage` supaya manifest mencatat proxy-nya.\n"));
}

main();
