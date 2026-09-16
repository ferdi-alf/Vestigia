import type { HeritageMeta } from "../types";

export const sydneyOperaHouse: HeritageMeta = {
  slug: "sydney-opera-house",
  name: { id: "Sydney Opera House", en: "Sydney Opera House" },
  country: { id: "Australia", en: "Australia" },
  location: { id: "Bennelong Point, Sydney", en: "Bennelong Point, Sydney" },
  coordinates: [-33.8568, 151.2153],
  period: { id: "1957–1973", en: "1957–1973" },
  civilization: { id: "Modernisme abad ke-20", en: "Twentieth-century modernism" },
  category: "monument",

  description: {
    id: "Gedung pertunjukan di semenanjung yang menjorok ke pelabuhan Sydney, dengan atap berupa deretan cangkang beton berlapis ubin putih. Rancangan Jørn Utzon memenangi sayembara terbuka pada 1957, dan menghabiskan enam belas tahun untuk dibangun.",
    en: "A performing arts building on a peninsula reaching into Sydney Harbour, roofed by a series of concrete shells clad in white tile. Jørn Utzon's design won an open competition in 1957 and took sixteen years to build.",
  },

  significance: {
    id: "Gedung ini adalah warisan dunia yang usianya belum genap satu abad, dan alasannya bukan sekadar keindahan siluetnya. Bentuk cangkangnya semula tidak bisa dihitung maupun dibangun — jalan keluarnya, mengambil setiap cangkang dari permukaan satu bola yang sama, adalah salah satu pemecahan masalah paling elegan dalam arsitektur modern.",
    en: "This is a world heritage site not yet a century old, and not merely for its silhouette. The shell forms were originally neither calculable nor buildable — the resolution, taking every shell from the surface of one and the same sphere, is among the most elegant pieces of problem-solving in modern architecture.",
  },

  keyFeatures: [
    {
      title: { id: "Semua cangkang dari satu bola", en: "Every shell from one sphere" },
      body: {
        id: "Setelah bertahun-tahun buntu, Utzon menyadari seluruh cangkang bisa diambil sebagai potongan dari permukaan satu bola berjari-jari 75 meter. Karena semua lengkungnya kini sama, rusuk beton bisa dicetak berulang alih-alih dibuat satu per satu.",
        en: "After years at an impasse, Utzon realised every shell could be taken as a section from the surface of a single sphere of 75-metre radius. With all curvatures now identical, the concrete ribs could be cast repeatedly rather than made one by one.",
      },
    },
    {
      title: { id: "Lebih dari satu juta ubin", en: "Over a million tiles" },
      body: {
        id: "Cangkangnya dilapisi ubin keramik buatan Swedia dalam dua rona: mengilap dan matte. Campuran keduanya membuat atap tidak menyilaukan di bawah matahari Sydney, dan berubah rupa sepanjang hari alih-alih memantulkan cahaya rata.",
        en: "The shells are clad in Swedish-made ceramic tiles in two finishes: glossy and matte. The mix keeps the roof from glaring under the Sydney sun, and lets it change through the day rather than reflecting flatly.",
      },
    },
    {
      title: { id: "Ubin dipasang sebagai panel", en: "Tiles fitted as panels" },
      body: {
        id: "Ubin tidak dipasang satu per satu di ketinggian, melainkan dirakit lebih dulu menjadi panel beton pracetak di darat lalu diangkat ke tempatnya. Tanpa cara itu, pekerjaan di permukaan melengkung setinggi enam puluh meter tidak akan selesai.",
        en: "The tiles were not laid one by one at height but pre-assembled into precast concrete panels on the ground and lifted into place. Without that method, work on a curved surface sixty metres up would never have finished.",
      },
    },
    {
      title: { id: "Podium sebagai lanskap", en: "The podium as landscape" },
      body: {
        id: "Cangkang berdiri di atas podium besar yang menyimpan seluruh fungsi teknis dan sirkulasi. Utzon merancangnya terinspirasi platform candi Maya dan Mesoamerika — sebuah dataran buatan yang mengangkat pengunjung di atas tanah.",
        en: "The shells stand on a great podium holding all the technical and circulation functions. Utzon designed it drawing on Maya and Mesoamerican temple platforms — a made plateau that lifts the visitor above the ground.",
      },
    },
  ],

  hotspots: [
    {
      id: "cangkang",
      title: { id: "Cangkang Utama", en: "The Main Shells" },
      summary: { id: "Potongan-potongan dari satu bola yang sama.", en: "Sections of one and the same sphere." },
      detail: {
        id: "Cangkang tertinggi mencapai sekitar enam puluh meter di atas permukaan laut. Karena semuanya berasal dari bola berjari-jari sama, cangkang yang tampak berbeda ukuran sebenarnya hanya potongan yang berbeda luasnya.",
        en: "The tallest shell reaches about sixty metres above sea level. Because all come from a sphere of the same radius, shells that appear different in size are only differently sized sections.",
      },
      anchor: [0.45, 0.95, 0.5],
      surface: "top",
    },
    {
      id: "ubin",
      title: { id: "Permukaan Berubin", en: "The Tiled Surface" },
      summary: { id: "Dua rona putih yang bekerja bersama.", en: "Two whites working together." },
      detail: {
        id: "Dari jauh atap terlihat putih polos. Dari dekat, pola berlian dari ubin mengilap dan matte terlihat jelas — dan pola itulah yang membuat bangunan ini tidak pernah terlihat sama pada dua jam yang berbeda.",
        en: "From a distance the roof reads as plain white. Up close the diamond pattern of glossy and matte tiles is clear — and that pattern is why the building never looks the same at two different hours.",
      },
      anchor: [0.5, 0.6, 0.05],
      surface: "face",
    },
    {
      id: "kaca",
      title: { id: "Dinding Kaca", en: "The Glass Walls" },
      summary: { id: "Bagian terakhir yang dipecahkan, setelah Utzon pergi.", en: "The last problem solved, after Utzon had gone." },
      detail: {
        id: "Menutup celah antara cangkang dan podium dengan kaca adalah masalah yang belum selesai saat Utzon mengundurkan diri pada 1966. Penyelesaiannya dikerjakan Peter Hall, dan bagian inilah yang paling menyimpang dari niat awal perancangnya.",
        en: "Closing the gap between shell and podium with glass was unresolved when Utzon resigned in 1966. It was completed by Peter Hall, and it is the part that departs furthest from the designer's original intent.",
      },
      anchor: [0.5, 0.3, 0.9],
      surface: "face",
    },
    {
      id: "podium",
      title: { id: "Podium", en: "The Podium" },
      summary: { id: "Dataran batu yang menopang segalanya.", en: "The stone plateau that carries everything." },
      detail: {
        id: "Podium berundak ini menampung ruang latihan, bengkel, dan seluruh sirkulasi penonton. Ia juga yang mengangkat cangkang cukup tinggi sehingga terbaca dari air — bangunan ini dirancang untuk dilihat dari pelabuhan.",
        en: "The stepped podium houses rehearsal rooms, workshops and all audience circulation. It also lifts the shells high enough to read from the water — this building was designed to be seen from the harbour.",
      },
      anchor: [0.5, 0.05, 0.85],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "1957", event: { id: "Jørn Utzon memenangi sayembara internasional terbuka.", en: "Jørn Utzon wins the open international competition." } },
    { year: "1961", event: { id: "Masalah geometri cangkang terpecahkan lewat gagasan bola tunggal.", en: "The shell geometry problem is solved by the single-sphere idea." } },
    { year: "1966", event: { id: "Utzon mengundurkan diri setelah perselisihan dengan pemerintah negara bagian.", en: "Utzon resigns after disputes with the state government." } },
    { year: "20 Oktober 1973", event: { id: "Gedung diresmikan, enam belas tahun setelah sayembara.", en: "The building opens, sixteen years after the competition." } },
    { year: "1999", event: { id: "Utzon diminta kembali untuk menyusun prinsip panduan pemugaran.", en: "Utzon is re-engaged to set out guiding principles for future work." } },
    { year: "2007", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Beton pracetak, ubin keramik, kaca", en: "Precast concrete, ceramic tile, glass" } },
    { label: { id: "Jari-jari bola cangkang", en: "Shell sphere radius" }, value: { id: "75 meter", en: "75 metres" } },
    { label: { id: "Jumlah ubin", en: "Tiles" }, value: { id: "lebih dari satu juta", en: "over one million" } },
    { label: { id: "Lama pembangunan", en: "Construction period" }, value: { id: "16 tahun", en: "16 years" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Sydney Opera House", url: "https://whc.unesco.org/en/list/166/" },
    { title: "Britannica — Sydney Opera House", url: "https://www.britannica.com/topic/Sydney-Opera-House" },
  ],

  keywords: ["sydney", "opera house", "utzon", "australia", "cangkang", "shell", "modernisme", "bennelong"],
};
