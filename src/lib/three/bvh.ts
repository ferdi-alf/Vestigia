/**
 * Pasang three-mesh-bvh ke three.js.
 *
 * Penempelan hotspot menembakkan 400 sinar ke setiap model. Tanpa BVH itu
 * berarti ratusan ribu uji segitiga dan jeda satu-dua detik yang membekukan
 * antarmuka tepat saat model muncul. Dengan BVH, biayanya sekali membangun
 * pohon lalu praktis gratis.
 *
 * Diimpor sekali dari sisi klien; pemanggilan berikutnya tidak berbiaya.
 */
import * as THREE from "three";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";

let installed = false;

export function installBVH() {
  if (installed) return;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  installed = true;
}
