/**
 * Slot media landing page.
 *
 * Aturannya sama dengan aturan yang mengatur GLB di registry.ts: aplikasi tidak
 * pernah menebak berkas apa yang ada. Bedanya, gambar tidak wajib — sebuah slot
 * yang kosong tetap merender sesuatu yang utuh, disusun dari CSS.
 *
 * Jadi urutan kerjanya bisa terbalik dengan aman: halaman dibangun lebih dulu,
 * gambar menyusul. Menaruh berkas ke public/images/landing/ dengan nama yang
 * tertulis di `file` sudah cukup — `npm run sync:media` (otomatis lewat predev
 * dan prebuild) yang memberi tahu aplikasi bahwa berkas itu kini ada.
 */
import type { LocalizedText } from "./types";

/**
 * Cara lapisan menyatu dengan yang di belakangnya.
 *
 * Tidak ada satu pun yang menuntut kanal alpha, dan itu disengaja: hampir semua
 * model gambar tidak menghasilkan alpha, sehingga menuntutnya berarti menambah
 * langkah hapus-latar yang rapuh pada setiap asset. Transparansi di sini datang
 * dari CSS.
 *
 * - `cover`     mengisi penuh, tanpa transparansi
 * - `mask-up`   bagian atas dilarutkan gradien, sehingga lapisan ini menyatu ke
 *               kabut di belakangnya
 * - `screen`    hitam murni menjadi transparan dengan sendirinya; dipakai debu
 *               dan cahaya, yang memang menambah terang alih-alih menutupi
 * - `multiply`  putih murni menjadi transparan, gelap menutup penuh. Inilah
 *               oklusi sungguhan tanpa kanal alpha: putih × apa pun = apa pun,
 *               hitam × apa pun = hitam. Dipakai siluet punggungan, dan ia
 *               membawa perspektif udara secara cuma-cuma — siluet yang lebih
 *               terang otomatis terbaca lebih jauh.
 */
export type Composite = "cover" | "mask-up" | "screen" | "multiply";

export interface MediaSlot {
  id: string;
  /** nama berkas persis yang dicari di public/images/landing/ */
  file: string;
  alt: LocalizedText;
  composite: Composite;
  /** ukuran yang diminta saat generasi — dipakai dokumen prompt, bukan render */
  width: number;
  height: number;
  /**
   * Kedalaman parallax, 0 = tak bergerak (paling jauh), 1 = paling cepat
   * (paling dekat). Nilai inilah yang dibaca animasi scroll; mengubah rasa
   * kedalaman hero cukup dengan mengubah angka di sini.
   */
  depth: number;
  /** kelas komposisi CSS yang dipakai saat berkas belum ada. Lihat globals.css. */
  fallback: string;
  /**
   * Keburaman render. Backdrop section selalu diredam supaya teks tetap utama.
   * Nilai-nilai ini mudah digeser: semuanya di berkas ini, tidak satu pun
   * tersebar di komponen.
   */
  opacity: number;
  /** dimuat lebih dulu karena berada di atas lipatan */
  priority?: boolean;
  /**
   * Abaikan berkasnya, pakai komposisi `fallback` sebagai backdrop sungguhan.
   *
   * Ada dua alasan berbeda yang memakai bendera yang sama, dan keduanya perlu
   * dibedakan saat membacanya:
   *
   * **Permanen** — empat backdrop section. Arah seni sudah memuat aturannya:
   * apa pun yang harus ikut berganti tema dibuat prosedural. Pergantian tema
   * gelap→terang baru saja membuktikan kenapa; backdrop raster tidak ikut
   * berganti dan harus digenerate ulang seluruhnya, komposisi CSS ikut sendiri.
   *
   * **Sementara** — empat lapis hero. Berkas yang ada sekarang digenerate untuk
   * tema gelap dan konsep hero yang lama: `hero-sky` langit fajar gelap yang
   * akan menggelapkan seluruh bingkai, `hero-dust` dikomposit `screen` sehingga
   * lenyap di atas kertas, dan `hero-mid`/`hero-near` masih dibingkai untuk
   * konsep lama sehingga memuncak di tengah object. Begitu penggantinya ada,
   * hapus benderanya — nol perubahan kode lain.
   *
   * Yang TIDAK dilakukan bendera ini: memindahkan, menghapus, atau menyentuh
   * satu berkas pun. Gambarnya tetap persis di tempatnya.
   */
  procedural?: boolean;
}

/* ── Hero ────────────────────────────────────────────────────────────────
   Empat lapis, dan sejak object 3D masuk perannya berubah total: dulu mereka
   pertunjukannya, sekarang mereka panggungnya.

   Langit di belakang, cakrawala rendah tempat object berdiri, massa depan yang
   membingkai lalu menyingkir saat kamera maju, dan debu di paling depan.
   Lapisan `hero-far` dibuang bersama konsep lama — bidang keempat di belakang
   object hanya bersaing dengan subjeknya sendiri.

   Di pose pembuka object menempati 31%–65% tinggi layar. Itu angka yang
   mengikat: apa pun yang legap di antara kedua batas itu akan menguburnya. */
export const HERO_LAYERS: readonly MediaSlot[] = [
  {
    id: "hero-sky",
    file: "hero-sky.webp",
    alt: {
      id: "Langit fajar berkabut di atas cakrawala",
      en: "Hazy dawn sky above the horizon",
    },
    composite: "cover",
    width: 2560,
    height: 1440,
    depth: 0.06,
    fallback: "fb-sky",
    procedural: true,
    opacity: 1,
    priority: true,
  },
  {
    id: "hero-mid",
    file: "hero-mid.webp",
    alt: {
      id: "Siluet tebing batu berlapis",
      en: "Silhouette of a layered rock escarpment",
    },
    composite: "multiply",
    width: 2560,
    height: 1440,
    /* Diturunkan dari 0,42 saat object 3D masuk ke hero. Perannya berubah:
       dulu ia subjek bidang tengah, sekarang ia cakrawala tempat object itu
       berdiri. Cakrawala yang bergerak secepat subjeknya berhenti terbaca
       sebagai cakrawala. */
    depth: 0.3,
    /* Gambarnya sendiri masih dibingkai untuk konsep lama — siluetnya memuncak
       di sekitar 48% tinggi bingkai, yang jatuh tepat di tengah object. Perlu
       dibingkai ulang ke ~70%. Lihat _internal/02-image-prompts.md. */
    fallback: "fb-ridge-mid",
    procedural: true,
    opacity: 1,
    priority: true,
  },
  {
    id: "hero-near",
    file: "hero-near.webp",
    alt: { id: "Siluet batu di latar depan", en: "Silhouette of foreground stone" },
    composite: "multiply",
    width: 2560,
    height: 1440,
    depth: 0.75,
    fallback: "fb-ridge-near",
    procedural: true,
    opacity: 1,
  },
  {
    id: "hero-dust",
    file: "hero-dust.webp",
    alt: { id: "Debu melayang dalam berkas cahaya", en: "Dust drifting in shafts of light" },
    composite: "screen",
    width: 2048,
    height: 1152,
    depth: 0.5,
    fallback: "fb-dust",
    procedural: true,
    opacity: 0.75,
  },
];

/* ── Backdrop section ───────────────────────────────────────────────────
   Satu gambar per section, selalu di belakang teks dan selalu diredam.
   Perannya memberi suhu, bukan menarik perhatian. */
export const SECTION_MEDIA: readonly MediaSlot[] = [
  {
    id: "intro-texture",
    file: "intro-texture.webp",
    alt: { id: "Permukaan batu pasir terkikis", en: "Weathered sandstone surface" },
    composite: "cover",
    width: 2048,
    height: 1152,
    depth: 0.12,
    fallback: "fb-stone",
    procedural: true,
    opacity: 1,
  },
  {
    id: "world-backdrop",
    file: "world-backdrop.webp",
    alt: { id: "Langit malam di atas gurun", en: "Night sky above a desert" },
    composite: "cover",
    width: 2048,
    height: 1152,
    depth: 0.08,
    fallback: "fb-chart",
    procedural: true,
    opacity: 1,
  },
  {
    id: "ai-backdrop",
    file: "ai-backdrop.webp",
    alt: { id: "Cahaya menembus ruang berdebu", en: "Light falling through a dusty chamber" },
    composite: "cover",
    width: 2048,
    height: 1152,
    depth: 0.1,
    fallback: "fb-chamber",
    procedural: true,
    opacity: 1,
  },
  {
    id: "closing-scene",
    file: "closing-scene.webp",
    alt: { id: "Cakrawala senja di atas dataran luas", en: "Dusk horizon over an open plain" },
    composite: "cover",
    width: 2560,
    height: 1440,
    depth: 0.14,
    fallback: "fb-dusk",
    procedural: true,
    opacity: 1,
  },
];


/* ── Media konsep ────────────────────────────────────────────────────────
   Slot yang hanya dipakai route `/concepts/*`.

   Dipisah dari `SECTION_MEDIA` dengan sengaja: kedelapan slot landing lama
   punya nasib yang sudah diputuskan (empat backdrop permanen prosedural), dan
   mencampur slot sementara ke dalamnya akan mengaburkan keputusan itu. Begitu
   satu konsep dipilih, slot milik dua konsep lain dihapus dari sini dan tidak
   ada berkas lain yang perlu disentuh.

   TEMUAN YANG MENGUBAH RENCANA: tujuh dari sembilan berkas di `./images/`
   ternyata byte-identik dengan yang sudah terpasang (MD5 cocok) — mereka set
   tema gelap yang dulu DITOLAK karena situs berpindah ke terang. Tetapi
   **konsep A gelap**, jadi justru merekalah yang cocok sekarang. Nol gambar
   baru perlu digenerate.

   `sky-light.png` satu-satunya yang benar-benar baru, dan satu-satunya yang
   terang — jadi ia milik B dan C. Ukurannya 960 KB sebagai SUMBER; `MediaLayer`
   merendernya lewat `next/image`, yang menyajikan WebP teroptimasi, sehingga
   yang diunduh peramban jauh lebih kecil. */
export const CONCEPT_MEDIA: readonly MediaSlot[] = [
  {
    id: "a-void",
    file: "world-backdrop.webp",
    alt: { id: "Langit malam di atas cakrawala", en: "Night sky above a horizon" },
    composite: "cover",
    width: 2048,
    height: 1152,
    /* Paling jauh, jadi paling lambat. Langit yang bergerak secepat
       subjeknya berhenti terbaca sebagai langit. */
    depth: 0.06,
    fallback: "fb-chart",
    /* Berkasnya langit MALAM. Di atas kapur ia menggelapkan seluruh bingkai
       dan melawan dasar halamannya sendiri. Komposisi CSS mengambil alih —
       dan karena ia dilukis dari token, ia ikut berganti sendiri kalau
       paletnya bergeser lagi. */
    procedural: true,
    opacity: 1,
    priority: true,
  },
  {
    id: "a-dust",
    file: "hero-dust.webp",
    alt: { id: "Debu melayang dalam berkas cahaya", en: "Dust drifting in shafts of light" },
    /* `screen` hanya bisa MENERANGKAN, jadi hitam murni jadi transparan
       dengan sendirinya. Itu benar di atas dasar gelap; di atas kapur ia
       melenyapkan butirannya sama sekali — komposit yang berlawanan arah
       dengan latarnya. `fb-dust` melukis butir lebih GELAP daripada
       udaranya, arah yang benar untuk latar terang. */
    composite: "screen",
    width: 2048,
    height: 1152,
    depth: 0.5,
    fallback: "fb-dust",
    procedural: true,
    opacity: 0.7,
  },
  {
    id: "a-chamber",
    file: "ai-backdrop.webp",
    alt: { id: "Cahaya menembus ruang batu berdebu", en: "Light falling through a dusty stone chamber" },
    composite: "cover",
    width: 2048,
    height: 1152,
    depth: 0.12,
    fallback: "fb-chamber",
    /* Ruang batu GELAP, tempat object mendarat. Di atas kapur ia jadi lubang
       hitam di tengah halaman. `fb-chamber` melukis ruang yang sama dengan
       cahaya dari kiri, hanya dalam nada terang. */
    procedural: true,
    opacity: 1,
  },
  {
    id: "a-stone",
    file: "intro-texture.webp",
    alt: { id: "Permukaan batu terkikis disapu cahaya rendah", en: "Weathered stone raked by low light" },
    composite: "cover",
    width: 2048,
    height: 1152,
    depth: 0.1,
    fallback: "fb-stone",
    opacity: 0.7,
  },
  {
    id: "a-dusk",
    file: "closing-scene.webp",
    alt: { id: "Cakrawala senja di atas dataran luas", en: "Dusk horizon over an open plain" },
    composite: "cover",
    width: 2560,
    height: 1440,
    depth: 0.14,
    fallback: "fb-dusk",
    opacity: 0.9,
  },
  {
    id: "a-ridge",
    file: "hero-mid.webp",
    alt: { id: "Siluet punggungan batu", en: "Silhouette of a rock ridge" },
    /* `multiply`: putih murni jadi transparan, gelap menutup penuh. Itu
       oklusi sungguhan tanpa kanal alpha. */
    composite: "multiply",
    width: 2560,
    height: 1440,
    depth: 0.28,
    fallback: "fb-ridge-mid",
    opacity: 0.35,
  },
  {
    id: "bc-sky",
    file: "sky-light.png",
    alt: { id: "Langit pucat dengan matahari rendah di kiri", en: "Pale sky with a low sun at the left" },
    composite: "cover",
    width: 1989,
    height: 793,
    depth: 0.08,
    fallback: "fb-sky",
    opacity: 0.5,
  },
];

/** Semua slot yang dipindai script. Gambar Open Graph ditangani terpisah. */
export const MEDIA_SLOTS: readonly MediaSlot[] = [
  ...HERO_LAYERS,
  ...SECTION_MEDIA,
  ...CONCEPT_MEDIA,
];

export function getSlot(id: string): MediaSlot | undefined {
  return MEDIA_SLOTS.find((slot) => slot.id === id);
}
