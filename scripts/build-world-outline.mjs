#!/usr/bin/env node
/**
 * build-world-outline — mengubah garis daratan dunia jadi satu path SVG.
 *
 * Dijalankan sekali, hasilnya di-commit. Script-nya ikut disimpan supaya angka
 * di src/data/world-outline.ts bisa ditelusuri ulang: siapa pun bisa menjalankan
 * ini dan mendapat berkas yang sama persis.
 *
 *   node scripts/build-world-outline.mjs
 *
 * Sumber : Natural Earth 1:110m land (ne_110m_land)
 * Lisensi: domain publik — https://www.naturalearthdata.com/about/terms-of-use/
 *
 * Proyeksi equirectangular, 1 satuan = 1 derajat, viewBox "0 0 360 180".
 * Sederhana, dan itu justru syaratnya: titik warisan diplot dari lintang-bujur
 * mentah tanpa satu pun perhitungan proyeksi di sisi klien.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson";
const OUT = path.join(ROOT, "src", "data", "world-outline.ts");

/** Toleransi penyederhanaan, derajat. Cukup untuk peta selebar ~1000 px. */
const TOLERANCE = 0.42;
/** Cincin yang kotak batasnya lebih kecil dari ini dibuang — pulau sebutir debu. */
const MIN_EXTENT = 1.6;

const project = ([lon, lat]) => [lon + 180, 90 - lat];

/** Douglas–Peucker. Membuang titik yang tidak mengubah bentuk yang terlihat. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;

  const sqTol = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxSq = 0;
    let index = 0;

    const [x1, y1] = points[first];
    const [x2, y2] = points[last];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const denom = dx * dx + dy * dy;

    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      let t = denom > 0 ? ((px - x1) * dx + (py - y1) * dy) / denom : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = x1 + t * dx - px;
      const ey = y1 + t * dy - py;
      const sq = ex * ex + ey * ey;
      if (sq > maxSq) {
        maxSq = sq;
        index = i;
      }
    }

    if (maxSq > sqTol) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

function extentOf(points) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return Math.max(maxX - minX, maxY - minY);
}

function ringsOf(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

const round = (n) => Math.round(n * 10) / 10;

async function main() {
  process.stdout.write(`  mengambil ${SOURCE}\n`);
  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const geo = await response.json();

  let rings = 0;
  let pointsIn = 0;
  let pointsOut = 0;
  const parts = [];

  for (const feature of geo.features) {
    for (const ring of ringsOf(feature.geometry)) {
      pointsIn += ring.length;
      const projected = ring.map(project);
      if (extentOf(projected) < MIN_EXTENT) continue;

      const simplified = simplify(projected, TOLERANCE);
      if (simplified.length < 4) continue;

      rings += 1;
      pointsOut += simplified.length;
      const d = simplified
        .map(([x, y], i) => `${i === 0 ? "M" : "L"}${round(x)} ${round(y)}`)
        .join("");
      parts.push(`${d}Z`);
    }
  }

  const d = parts.join("");
  const source = `// DIGENERATE OTOMATIS oleh scripts/build-world-outline.mjs — jangan diedit tangan.
//
// Garis daratan dunia, proyeksi equirectangular, 1 satuan = 1 derajat.
// Sumber : Natural Earth 1:110m land (ne_110m_land)
// Lisensi: domain publik — https://www.naturalearthdata.com/about/terms-of-use/
//
// Disederhanakan Douglas-Peucker pada toleransi ${TOLERANCE}°; pulau yang lebih
// kecil dari ${MIN_EXTENT}° dibuang. ${rings} cincin, ${pointsOut} titik
// (dari ${pointsIn}).

/** viewBox yang harus dipakai elemen <svg> pembungkusnya. */
export const WORLD_VIEWBOX = "0 0 360 180";

/**
 * Ubah [lintang, bujur] jadi koordinat di dalam viewBox itu.
 * Sengaja sesederhana ini: tidak ada pustaka proyeksi di sisi klien.
 */
export function project(latitude: number, longitude: number): { x: number; y: number } {
  return { x: longitude + 180, y: 90 - latitude };
}

export const WORLD_LAND_PATH =
  ${JSON.stringify(d)};
`;

  fs.writeFileSync(OUT, source);
  const kb = (Buffer.byteLength(source) / 1024).toFixed(1);
  process.stdout.write(
    `  ${rings} cincin  ·  ${pointsIn} → ${pointsOut} titik  ·  ${kb} KB  ·  ${path.relative(ROOT, OUT)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`  gagal: ${error.message}\n`);
  process.exitCode = 1;
});
