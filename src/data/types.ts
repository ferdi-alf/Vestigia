/**
 * Vestigia — kontrak data heritage.
 *
 * Satu heritage = satu file GLB di /3d-object + satu file metadata di src/data/heritage/.
 * Keduanya wajib ada. Kalau salah satu hilang, object tidak masuk koleksi aktif.
 * Registry (src/data/registry.ts) yang menegakkan aturan itu.
 */

/** Lima benua yang dikenali. Nilainya = nama folder di /3d-object. */
export const CONTINENTS = ["asia", "africa", "europe", "americas", "oceania"] as const;
export type Continent = (typeof CONTINENTS)[number];

export type Locale = "id" | "en";

/** Teks dwibahasa. Keduanya wajib — UI tidak pernah menampilkan bahasa yang salah. */
export interface LocalizedText {
  id: string;
  en: string;
}

/**
 * Hotspot menandai fitur arsitektural pada model.
 *
 * Anchor disimpan dalam ruang model ternormalisasi: x dan z adalah fraksi
 * melintasi footprint (0..1, dari min ke max), y fraksi dari tinggi model.
 * Koordinat mati akan menaruh pin di udara sesering di batu, jadi `surface`
 * yang menentukan: viewer mencari permukaan nyata dari geometri dan anchor
 * hanya memilih *bagian mana* dari permukaan itu.
 */
export interface Hotspot {
  id: string;
  title: LocalizedText;
  /** satu kalimat, muncul di label saat hover */
  summary: LocalizedText;
  /** penjelasan penuh, muncul saat hotspot dibuka */
  detail: LocalizedText;
  /** posisi acuan dalam ruang model ternormalisasi */
  anchor: [number, number, number];
  /**
   * Permukaan tempat pin harus mendarat:
   * - `top`    massa bangunan tertinggi di dekat anchor (puncak, atap, stupa)
   * - `ground` tanah terbuka rendah di sekitar massa (halaman, plaza, dasar)
   * - `face`   kulit luar, ditemui dengan menembak horizontal dari luar (dinding, relief, fasad)
   */
  surface: "top" | "ground" | "face";
  /** seberapa dekat kamera mendorong saat hotspot dibuka (1 = default) */
  zoom?: number;
}

export interface TimelineEntry {
  /** ditampilkan apa adanya: "c. 800 M", "1814", "abad ke-9" */
  year: string;
  event: LocalizedText;
}

export interface Fact {
  label: LocalizedText;
  value: LocalizedText;
}

export interface KeyFeature {
  title: LocalizedText;
  body: LocalizedText;
}

/**
 * Sumber rujukan. Dipakai dua kali: ditampilkan di halaman heritage, dan
 * disuntikkan ke konteks AI supaya model punya rujukan nyata untuk dikutip
 * alih-alih mengarang sumber.
 */
export interface Source {
  title: string;
  url: string;
}

/** Sudut kamera awal. Opsional — ada default per kategori. */
export interface CameraPreset {
  /** azimuth derajat (0 = depan +Z, positif memutar ke kanan) */
  azimuth: number;
  /** elevasi derajat di atas horizon */
  elevation: number;
  /** pengali jarak relatif terhadap auto-framing */
  distance: number;
  /** bias framing vertikal: fraksi tinggi model untuk titik pandang */
  targetY: number;
}

export type HeritageCategory =
  | "temple"
  | "monument"
  | "city"
  | "tomb"
  | "fortification"
  | "palace"
  | "other";

/**
 * Metadata yang ditulis tangan per heritage.
 * Tidak memuat `modelPath` — itu datang dari asset manifest, supaya path
 * tidak pernah bisa menunjuk file yang tidak ada.
 */
export interface HeritageMeta {
  /** wajib sama persis dengan nama file GLB tanpa ekstensi */
  slug: string;
  name: LocalizedText;
  country: LocalizedText;
  /** lokasi lebih spesifik: "Magelang, Jawa Tengah" */
  location: LocalizedText;
  /** [lintang, bujur] — dipakai peta dunia di landing */
  coordinates: [number, number];
  /** periode pembangunan, ditampilkan apa adanya */
  period: LocalizedText;
  civilization: LocalizedText;
  category: HeritageCategory;
  description: LocalizedText;
  /** kenapa situs ini penting bagi umat manusia */
  significance: LocalizedText;
  keyFeatures: KeyFeature[];
  hotspots: Hotspot[];
  timeline: TimelineEntry[];
  facts: Fact[];
  sources: Source[];
  camera?: CameraPreset;
  /** kata kunci pencarian, huruf kecil, dua bahasa boleh dicampur */
  keywords?: string[];
}

/** Satu entri di asset manifest yang digenerate script. */
export interface HeritageAsset {
  slug: string;
  continent: Continent;
  /** path yang bisa di-fetch browser, relatif ke root situs */
  modelPath: string;
  /** ukuran file setelah optimasi, byte */
  bytes: number;
  /**
   * Varian jauh lebih kecil untuk dipakai saat object cuma sebesar kuku.
   *
   * Opsional, dan itu disengaja: globe di section Dunia butuh lima belas model
   * sekaligus, dan lima belas model penuh berarti 52 MB. Pada ukuran di layar
   * beberapa puluh piksel, tekstur 128 dan geometri yang dipangkas habis tidak
   * bisa dibedakan dari aslinya — yang terbaca cuma siluetnya.
   *
   * Kalau `sync-heritage` belum pernah dijalankan sejak proxy ada, field ini
   * kosong dan pemanggilnya jatuh ke `modelPath`. Nol asumsi asset, §1.
   */
  proxyPath?: string;
  /** ukuran varian proxy, byte */
  proxyBytes?: number;
}

/**
 * Heritage aktif: metadata yang sudah terbukti punya asset 3D.
 * Ini satu-satunya bentuk yang dilihat UI.
 */
export interface Heritage extends HeritageMeta {
  continent: Continent;
  modelPath: string;
  bytes: number;
  proxyPath?: string;
  proxyBytes?: number;
}

/** Ambil sisi bahasa yang benar dari teks dwibahasa. */
export function t(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
