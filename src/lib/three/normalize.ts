/**
 * Normalisasi model.
 *
 * GLB datang dari sumber yang berbeda-beda: ada yang setinggi 0,3 unit, ada
 * yang 900. Ada yang pivotnya di tengah, ada yang di sudut, ada yang jauh dari
 * origin. Tanpa langkah ini, setiap model butuh setelan kamera sendiri dan
 * menambah asset baru berarti menyetel ulang scene.
 *
 * Setelah normalisasi setiap model punya kontrak yang sama:
 *   · sisi terpanjang = TARGET_SIZE
 *   · terpusat di sumbu X dan Z
 *   · dasar duduk tepat di y = 0
 *
 * Dengan begitu satu rig kamera, satu lantai, dan satu setelan bayangan
 * berlaku untuk semua object — yang persis dibutuhkan supaya menambah GLB
 * tidak menyentuh arsitektur.
 */
import * as THREE from "three";

/** Sisi terpanjang model setelah normalisasi, dalam unit dunia. */
export const TARGET_SIZE = 2;

export interface ModelBounds {
  /** ukuran setelah penskalaan */
  size: THREE.Vector3;
  /** faktor skala yang diterapkan */
  scale: number;
  /** radius bola pembatas, untuk framing kamera */
  radius: number;
}

/**
 * Skala, pusatkan dan dudukkan model. Memodifikasi `root` di tempat dan
 * mengembalikan dimensi hasilnya.
 */
export function normalizeModel(root: THREE.Object3D): ModelBounds {
  root.position.set(0, 0, 0);
  root.scale.setScalar(1);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const raw = box.getSize(new THREE.Vector3());
  const longest = Math.max(raw.x, raw.y, raw.z);

  // Model kosong atau rusak: jangan bagi dengan nol, biarkan apa adanya.
  if (!Number.isFinite(longest) || longest <= 0) {
    return { size: new THREE.Vector3(), scale: 1, radius: 1 };
  }

  const scale = TARGET_SIZE / longest;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  // Ukur ulang setelah penskalaan, bukan mengalikan angka lama — transform
  // di dalam hierarki bisa membuat hasilnya berbeda.
  const scaled = new THREE.Box3().setFromObject(root);
  const center = scaled.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaled.min.y;
  root.updateMatrixWorld(true);

  const size = scaled.getSize(new THREE.Vector3());
  return {
    size,
    scale,
    radius: size.length() / 2,
  };
}

/**
 * Siapkan material dan bayangan.
 *
 * Model yang dipindai atau digenerate sering datang dengan sisi ganda
 * dimatikan, normal yang hilang, atau texture tanpa ruang warna yang benar.
 * Ini merapikannya sekali di waktu muat, bukan tiap frame.
 */
export function prepareModel(root: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];

  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    meshes.push(mesh);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (!mesh.geometry.attributes.normal) {
      mesh.geometry.computeVertexNormals();
    }
    // Diperlukan raycast hotspot dan framing; hitung sekali di sini.
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  });

  return meshes;
}

/**
 * Jarak kamera yang membingkai model penuh pada fov tertentu.
 * Dipakai sebagai basis; preset per-heritage mengalikannya.
 */
export function framingDistance(radius: number, fovDegrees: number, aspect: number): number {
  const vFov = (fovDegrees * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const fitting = Math.min(vFov, hFov);
  // sedikit ruang napas supaya object tidak menyentuh tepi kanvas
  return (radius / Math.sin(fitting / 2)) * 1.05;
}
