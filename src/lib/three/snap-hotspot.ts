/**
 * Penempelan hotspot ke permukaan nyata.
 *
 * Menulis hotspot sebagai koordinat mati di dalam bounding box menaruh pin di
 * udara sesering di batu — bounding box adalah kotak, bangunan tidak. Yang
 * berlaku untuk stupa Borobudur tidak berlaku untuk lengkung Colosseum.
 *
 * Jadi hotspot hanya mendeklarasikan *jenis permukaan* yang ia maksud:
 *
 *   top     massa terbangun tertinggi di dekat anchor  (puncak, atap, stupa)
 *   ground  tanah terbuka rendah di sekitar massa      (halaman, plaza, dasar)
 *   face    kulit luar, ditemui dari luar ke dalam     (dinding, relief, fasad)
 *
 * Engine menemukan permukaan itu dari geometri model itu sendiri, dan anchor
 * hanya memilih *bagian mana* dari permukaan tersebut. Hasilnya: pin mendarat
 * di fitur yang ia namai, apa pun bentuk objectnya, tanpa penyetelan manual
 * per model.
 */
import * as THREE from "three";
import type { Hotspot } from "@/data/types";

/** Resolusi sampling medan ketinggian. 20×20 = 400 raycast, sekali per model. */
const GRID = 20;

export interface HeightField {
  /** ketinggian permukaan atas per sel, NaN kalau sinar tidak kena apa pun */
  heights: Float32Array;
  min: THREE.Vector3;
  max: THREE.Vector3;
  size: THREE.Vector3;
}

/**
 * Tembakkan sinar lurus ke bawah pada grid di atas footprint model dan catat
 * di mana sinar mengenai sesuatu. Sekali per model, hasilnya dipakai ulang
 * oleh setiap hotspot.
 */
export function buildHeightField(meshes: THREE.Mesh[], box: THREE.Box3): HeightField {
  const heights = new Float32Array(GRID * GRID).fill(NaN);
  const min = box.min.clone();
  const max = box.max.clone();
  const size = box.getSize(new THREE.Vector3());

  const raycaster = new THREE.Raycaster();
  raycaster.firstHitOnly = true;
  const origin = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const above = max.y + size.y * 0.1;

  for (let iz = 0; iz < GRID; iz += 1) {
    for (let ix = 0; ix < GRID; ix += 1) {
      // sampel di tengah sel, bukan di tepi — tepi jatuh tepat di dinding
      origin.set(
        min.x + ((ix + 0.5) / GRID) * size.x,
        above,
        min.z + ((iz + 0.5) / GRID) * size.z,
      );
      raycaster.set(origin, down);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (hit) heights[iz * GRID + ix] = hit.point.y;
    }
  }

  return { heights, min, max, size };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Cari sel yang cocok dengan kriteria dan paling dekat dengan anchor.
 * Kedekatan dalam ruang XZ ternormalisasi, jadi anchor mengarahkan pilihan
 * tanpa mendiktekan koordinat pasti.
 */
function findCell(
  field: HeightField,
  anchor: [number, number, number],
  accept: (height: number, normalised: number) => boolean,
): { x: number; y: number; z: number } | null {
  const [ax, , az] = anchor;
  let best: { x: number; y: number; z: number; score: number } | null = null;

  for (let iz = 0; iz < GRID; iz += 1) {
    for (let ix = 0; ix < GRID; ix += 1) {
      const height = field.heights[iz * GRID + ix];
      if (Number.isNaN(height)) continue;

      const normalised = field.size.y > 0 ? (height - field.min.y) / field.size.y : 0;
      if (!accept(height, normalised)) continue;

      const fx = (ix + 0.5) / GRID;
      const fz = (iz + 0.5) / GRID;
      const distance = Math.hypot(fx - ax, fz - az);
      if (!best || distance < best.score) {
        best = {
          x: field.min.x + fx * field.size.x,
          y: height,
          z: field.min.z + fz * field.size.z,
          score: distance,
        };
      }
    }
  }

  return best;
}

/** Titik dari anchor mentah, dipakai kalau pencarian permukaan tidak menemukan apa pun. */
function anchorPoint(field: HeightField, anchor: [number, number, number]): THREE.Vector3 {
  const [ax, ay, az] = anchor;
  return new THREE.Vector3(
    field.min.x + clamp01(ax) * field.size.x,
    field.min.y + clamp01(ay) * field.size.y,
    field.min.z + clamp01(az) * field.size.z,
  );
}

/**
 * Selesaikan satu hotspot menjadi titik dunia di permukaan model.
 * Selalu mengembalikan sesuatu — pin yang sedikit meleset jauh lebih baik
 * daripada pin yang hilang.
 */
export function snapHotspot(
  hotspot: Hotspot,
  field: HeightField,
  meshes: THREE.Mesh[],
): THREE.Vector3 {
  const { anchor, surface } = hotspot;

  if (surface === "top") {
    // massa terbangun tinggi: ambil yang di atas 60% ketinggian model
    const hit =
      findCell(field, anchor, (_, n) => n > 0.6) ??
      findCell(field, anchor, (_, n) => n > 0.35) ??
      findCell(field, anchor, () => true);
    if (hit) return new THREE.Vector3(hit.x, hit.y + field.size.y * 0.015, hit.z);
  }

  if (surface === "ground") {
    // tanah terbuka rendah: di bawah 25% ketinggian, dan diangkat sedikit
    // supaya pin tidak terkubur di dalam lantai
    const hit =
      findCell(field, anchor, (_, n) => n < 0.25) ??
      findCell(field, anchor, (_, n) => n < 0.5) ??
      findCell(field, anchor, () => true);
    if (hit) return new THREE.Vector3(hit.x, hit.y + field.size.y * 0.04, hit.z);
  }

  if (surface === "face") {
    // Datang dari luar pada ketinggian anchor dan tembak ke dalam. Yang
    // pertama kena adalah kulit luar — persis yang dimaksud "dinding".
    const target = anchorPoint(field, anchor);
    const centre = new THREE.Vector3(
      (field.min.x + field.max.x) / 2,
      target.y,
      (field.min.z + field.max.z) / 2,
    );
    const direction = centre.clone().sub(target).setY(0);

    if (direction.lengthSq() > 1e-6) {
      direction.normalize();
      const outside = centre.clone().sub(direction.clone().multiplyScalar(field.size.length()));
      outside.y = target.y;

      const raycaster = new THREE.Raycaster();
      raycaster.firstHitOnly = true;
      raycaster.set(outside, direction);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      // dorong sedikit keluar dari dinding supaya pin tidak z-fight
      if (hit) return hit.point.clone().addScaledVector(direction, -field.size.length() * 0.006);
    }
  }

  return anchorPoint(field, anchor);
}

/** Selesaikan semua hotspot sebuah model sekaligus. */
export function snapHotspots(
  hotspots: readonly Hotspot[],
  meshes: THREE.Mesh[],
  box: THREE.Box3,
): Map<string, THREE.Vector3> {
  const resolved = new Map<string, THREE.Vector3>();
  if (hotspots.length === 0 || meshes.length === 0) return resolved;

  const field = buildHeightField(meshes, box);
  for (const hotspot of hotspots) {
    resolved.set(hotspot.id, snapHotspot(hotspot, field, meshes));
  }
  return resolved;
}
