#!/usr/bin/env node
/**
 * preweld — siapkan mesh fotogrametri agar bisa disederhanakan.
 *
 * Model pindaian datang dengan normal per-sudut: setiap segitiga membawa
 * salinan vertexnya sendiri. Akibatnya `weld` bawaan gltf-transform, yang
 * hanya menggabungkan vertex yang identik bit demi bit, tidak menemukan satu
 * pun pasangan — dan tanpa vertex bersama, penyederhana mesh tidak punya
 * rusuk untuk dikolapskan. Model 157 MB tetap 157 MB.
 *
 * Script ini membuang atribut NORMAL dan TANGENT lebih dulu, sehingga vertex
 * dicocokkan berdasarkan posisi dan UV saja. Setelah itu weld bekerja, dan
 * penyederhana punya topologi untuk digarap. Normal dihitung ulang di sisi
 * klien saat model dimuat — untuk pindaian, hasil halus itu justru lebih
 * baik daripada permukaan bersegi.
 *
 *   node scripts/preweld.mjs <input.glb> <output.glb>
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, join, prune, weld } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("penggunaan: node scripts/preweld.mjs <input.glb> <output.glb>");
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});

const document = await io.read(input);
const root = document.getRoot();

let before = 0;
let after = 0;

for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const position = prim.getAttribute("POSITION");
    before += position ? position.getCount() : 0;

    // Normal dibuang supaya vertex bisa dicocokkan; tangent dibuang karena
    // bisa diturunkan dari UV dan normal di sisi klien.
    prim.setAttribute("NORMAL", null);
    prim.setAttribute("TANGENT", null);

    // Set UV kedua dan ketiga hanya berguna kalau ada material yang
    // menunjuknya. Untuk model pindaian, biasanya tidak ada.
    for (const slot of ["TEXCOORD_1", "TEXCOORD_2", "TEXCOORD_3"]) {
      prim.setAttribute(slot, null);
    }
  }
}

await document.transform(
  weld({ overwrite: true }),
  join(),
  dedup(),
  prune({ keepAttributes: false, keepLeaves: false }),
);

for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const position = prim.getAttribute("POSITION");
    after += position ? position.getCount() : 0;
  }
}

await io.write(output, document);

const pct = before > 0 ? Math.round((1 - after / before) * 100) : 0;
console.log(`preweld: ${before.toLocaleString()} → ${after.toLocaleString()} vertex (−${pct}%)`);
