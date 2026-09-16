import type { HeritageMeta } from "../types";

export const petra: HeritageMeta = {
  slug: "petra",
  name: { id: "Petra — Ad-Deir", en: "Petra — Ad-Deir" },
  country: { id: "Yordania", en: "Jordan" },
  location: { id: "Kegubernuran Ma'an", en: "Ma'an Governorate" },
  coordinates: [30.3285, 35.4444],
  period: { id: "sekitar abad ke-1 M", en: "c. 1st century CE" },
  civilization: { id: "Nabatea", en: "Nabataean" },
  category: "monument",

  description: {
    id: "Ad-Deir, atau \"Biara\", adalah fasad terbesar di Petra: lebar sekitar 47 meter dan tinggi 48 meter, dipahat langsung ke dalam tebing batu pasir. Ia bukan bangunan yang didirikan melainkan ruang negatif — batu yang dibuang, bukan batu yang disusun.",
    en: "Ad-Deir, the \"Monastery\", is the largest facade at Petra: about 47 metres wide and 48 metres high, cut directly into a sandstone cliff. It is not a structure raised but a negative space — stone removed rather than stone stacked.",
  },

  significance: {
    id: "Petra membuktikan bahwa sebuah kota bisa berdiri di gurun bukan karena punya air, melainkan karena tahu cara menahannya. Bendungan, saluran, dan sisterna Nabatea menangkap banjir bandang yang jarang dan menyimpannya, dan atas dasar itulah kota perdagangan ini bisa ada sama sekali.",
    en: "Petra proves a city can stand in a desert not because it has water but because it knows how to hold it. Nabataean dams, channels and cisterns caught rare flash floods and stored them, and on that foundation alone this trading city could exist.",
  },

  keyFeatures: [
    {
      title: { id: "Dipahat dari atas ke bawah", en: "Carved from the top down" },
      body: {
        id: "Pemahat mulai dari puncak tebing dan turun, sehingga tidak pernah perlu perancah. Kesalahan pada tahap ini tidak bisa diperbaiki: batu yang sudah dibuang tidak bisa dikembalikan.",
        en: "Carvers began at the top of the cliff and worked down, so scaffolding was never needed. Mistakes at this stage cannot be corrected: stone once removed cannot be put back.",
      },
    },
    {
      title: { id: "Fasad bergaya Helenistik", en: "A Hellenistic facade" },
      body: {
        id: "Pilar, pedimen pecah, dan tholos bundar di tingkat atas berasal dari kosakata arsitektur Yunani-Romawi, tetapi diterapkan pada bentuk pemakaman Nabatea. Petra berada di persilangan jalur dagang, dan fasadnya menunjukkan itu.",
        en: "Columns, a broken pediment and the round tholos on the upper storey come from Greco-Roman architectural vocabulary, applied to a Nabataean funerary form. Petra sat at a crossing of trade routes, and its facades show it.",
      },
    },
    {
      title: { id: "Batu pasir berlapis warna", en: "Banded sandstone" },
      body: {
        id: "Guratan merah, jingga, dan krem pada dinding bukan cat melainkan lapisan besi oksida di dalam batu itu sendiri. Pemahat memilih muka tebing sebagian karena pola ini.",
        en: "The red, orange and cream banding on the walls is not paint but iron-oxide layering within the rock itself. Carvers chose cliff faces partly for this patterning.",
      },
    },
    {
      title: { id: "Sekitar 800 anak tangga", en: "Some 800 rock-cut steps" },
      body: {
        id: "Ad-Deir hanya bisa dicapai lewat tangga panjang yang dipahat di lereng. Pendakian itu bagian dari pengalamannya — fasad raksasa muncul tiba-tiba di ujung jalur sempit, tanpa pandangan pendahuluan.",
        en: "Ad-Deir is reachable only by a long stair cut into the slope. The climb is part of the experience — the vast facade appears suddenly at the end of a narrow path, with no preliminary view.",
      },
    },
  ],

  hotspots: [
    {
      id: "tholos",
      title: { id: "Tholos", en: "The Tholos" },
      summary: { id: "Menara bundar bermahkota guci di puncak fasad.", en: "The urn-topped round drum crowning the facade." },
      detail: {
        id: "Struktur bundar di tingkat atas dimahkotai guci batu setinggi beberapa meter. Ukurannya sengaja dibesarkan agar tetap terbaca dari dasar tebing, hampir lima puluh meter di bawah.",
        en: "The round structure on the upper storey is crowned by a stone urn several metres tall. Its size is deliberately exaggerated so that it still reads from the base of the cliff, nearly fifty metres below.",
      },
      anchor: [0.5, 0.9, 0.4],
      surface: "top",
    },
    {
      id: "pedimen",
      title: { id: "Pedimen Pecah", en: "Broken Pediment" },
      summary: { id: "Atap segitiga yang sengaja dibelah dua.", en: "A triangular gable deliberately split in two." },
      detail: {
        id: "Pedimen yang terbelah di tengah adalah ciri khas arsitektur Nabatea. Belahan itu membingkai tholos di belakangnya, mengarahkan pandangan ke atas alih-alih menutupnya.",
        en: "The pediment split at its centre is a Nabataean signature. The break frames the tholos behind it, carrying the eye upward instead of closing the composition.",
      },
      anchor: [0.5, 0.72, 0.1],
      surface: "face",
    },
    {
      id: "pintu",
      title: { id: "Pintu Masuk", en: "The Doorway" },
      summary: { id: "Delapan meter tinggi, dan hampir kosong di dalam.", en: "Eight metres tall, and nearly empty within." },
      detail: {
        id: "Di balik pintu raksasa itu hanya ada satu ruang persegi yang polos. Seluruh usaha dicurahkan pada fasad, karena bangunan ini dimaksudkan untuk dilihat dari luar dalam upacara, bukan dihuni.",
        en: "Behind the enormous doorway lies a single plain rectangular chamber. All the effort went into the facade, because this building was meant to be seen from outside during ritual, not inhabited.",
      },
      anchor: [0.5, 0.25, 0.05],
      surface: "face",
    },
    {
      id: "pelataran",
      title: { id: "Pelataran Depan", en: "The Forecourt" },
      summary: { id: "Ruang datar tempat upacara berlangsung.", en: "The level ground where ritual took place." },
      detail: {
        id: "Tanah di depan fasad diratakan dengan memahat batu, membentuk pelataran luas. Ruang inilah yang menampung jemaah, sementara bangunannya sendiri berperan sebagai latar belakang.",
        en: "The ground before the facade was levelled by cutting away rock, forming a broad court. This space held the gathering, while the building itself served as backdrop.",
      },
      anchor: [0.5, 0.03, 0.85],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "abad ke-4 SM", event: { id: "Nabatea menjadikan Petra pusat perdagangan dupa dan rempah.", en: "The Nabataeans make Petra a centre of the incense and spice trade." } },
    { year: "abad ke-1 M", event: { id: "Ad-Deir dipahat pada masa puncak kemakmuran kota.", en: "Ad-Deir is carved at the height of the city's prosperity." } },
    { year: "106 M", event: { id: "Roma mencaplok kerajaan Nabatea.", en: "Rome annexes the Nabataean kingdom." } },
    { year: "363 M", event: { id: "Gempa besar merusak sebagian besar bangunan berdiri di kota.", en: "A major earthquake destroys much of the city's free-standing architecture." } },
    { year: "1812", event: { id: "Johann Ludwig Burckhardt membawa keberadaan Petra ke perhatian Eropa.", en: "Johann Ludwig Burckhardt brings Petra to European attention." } },
    { year: "1985", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Batu pasir, dipahat di tempat", en: "Sandstone, carved in situ" } },
    { label: { id: "Ukuran fasad", en: "Facade size" }, value: { id: "sekitar 47 × 48 meter", en: "about 47 × 48 metres" } },
    { label: { id: "Anak tangga menuju lokasi", en: "Steps to reach it" }, value: { id: "sekitar 800", en: "about 800" } },
    { label: { id: "Fungsi", en: "Function" }, value: { id: "Kuil atau ruang peringatan", en: "Temple or commemorative hall" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Petra", url: "https://whc.unesco.org/en/list/326/" },
    { title: "Britannica — Petra", url: "https://www.britannica.com/place/Petra-ancient-city-Jordan" },
  ],

  keywords: ["petra", "ad-deir", "monastery", "nabatea", "nabataean", "yordania", "jordan", "batu pasir"],
};
