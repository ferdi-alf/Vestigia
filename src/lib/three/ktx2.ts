import { KTX2Loader } from "three-stdlib";
import type { GLTFLoader } from "three-stdlib";

/**
 * Dukungan tekstur KTX2 / Basis Universal.
 *
 * Sepuluh dari lima belas model di koleksi ini membawa tekstur `KHR_texture_basisu`,
 * dan itu datang dari GLB sumbernya — bukan dari pipeline. `sync-heritage.mjs`
 * memakai `--texture-compress webp`, yang hanya menyentuh tekstur PNG/JPEG dan
 * membiarkan KTX2 apa adanya. Jadi kesepuluhnya lolos ke `public/models/` dengan
 * tekstur yang GLTFLoader tidak tahu cara membacanya, dan gagal dengan
 * "setKTX2Loader must be called before loading KTX2 textures".
 *
 * Transcoder-nya di-host sendiri di `/basis/`, persis seperti decoder Draco di
 * `/draco/gltf/`, dan alasannya sama: bawaan three mengambilnya dari CDN pihak
 * ketiga, dan satu permintaan yang diblokir jaringan berarti sepuluh model
 * berhenti tampil.
 */
const TRANSCODER_PATH = "/basis/";

/**
 * Renderer tiruan untuk `detectSupport`.
 *
 * `detectSupport` terlihat menuntut WebGLRenderer, padahal yang benar-benar
 * dibacanya cuma dua hal: `extensions.has(...)` untuk enam format tekstur
 * terkompresi, dan `capabilities.isWebGL2`. Keduanya bisa dijawab konteks WebGL
 * biasa.
 *
 * Itu yang membuat masalah urutan hilang. Kalau deteksinya menunggu renderer
 * R3F, maka `useGLTF.preload()` yang dipanggil kartu heritage saat hover —
 * jauh sebelum kanvas mana pun ter-mount — akan melempar, dan `useLoader`
 * menyimpan promise gagal itu di cache berdasarkan path. Model yang sempat
 * di-preload terlalu awal akan tetap rusak meskipun nanti kanvasnya ada.
 *
 * Konteksnya dilepas segera setelah dibaca, jadi tidak ada konteks WebGL kedua
 * yang menganggur — aturan "satu konteks per halaman" tetap utuh.
 */
function probeRenderer() {
  const canvas = document.createElement("canvas");
  const gl =
    (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
    (canvas.getContext("webgl") as WebGLRenderingContext | null);

  const has = (name: string) => Boolean(gl?.getExtension(name));
  const isWebGL2 =
    typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

  /* Dilepas eksplisit. Tanpa ini konteksnya hidup sampai pengumpul sampah
     memutuskan sebaliknya, dan peramban membatasi jumlah konteks WebGL yang
     boleh ada sekaligus. */
  gl?.getExtension("WEBGL_lose_context")?.loseContext();

  return { extensions: { has }, capabilities: { isWebGL2 } };
}

let loader: KTX2Loader | null = null;

/** Satu loader untuk seluruh aplikasi — transcoder-nya mahal untuk diulang. */
function ktx2Loader(): KTX2Loader {
  if (!loader) {
    loader = new KTX2Loader().setTranscoderPath(TRANSCODER_PATH);
    /* `detectSupport` mengembalikan `this`; tipenya menuntut WebGLRenderer,
       sementara yang dipakainya hanya dua properti di atas. */
    loader.detectSupport(probeRenderer() as unknown as Parameters<KTX2Loader["detectSupport"]>[0]);
  }
  return loader;
}

/**
 * Dipasang ke `useGLTF` lewat parameter `extendLoader`.
 *
 * Aman dipanggil untuk model yang tidak memakai KTX2: GLTFLoader hanya menyentuh
 * loader ini kalau berkasnya benar-benar mendeklarasikan `KHR_texture_basisu`,
 * jadi lima model sisanya tidak membayar apa pun — transcoder-nya pun tidak
 * pernah diunduh sampai ada yang membutuhkannya.
 */
export function withKTX2(gltfLoader: GLTFLoader) {
  gltfLoader.setKTX2Loader(ktx2Loader());
}
