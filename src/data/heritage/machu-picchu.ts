import type { HeritageMeta } from "../types";

export const machuPicchu: HeritageMeta = {
  slug: "machu-picchu",
  name: { id: "Machu Picchu", en: "Machu Picchu" },
  country: { id: "Peru", en: "Peru" },
  location: { id: "Wilayah Cusco, Pegunungan Andes", en: "Cusco Region, Andes" },
  coordinates: [-13.1631, -72.545],
  period: { id: "sekitar 1450 M", en: "c. 1450 CE" },
  civilization: { id: "Kekaisaran Inka", en: "Inca Empire" },
  category: "city",

  description: {
    id: "Kota batu di punggungan gunung setinggi 2.430 meter di atas permukaan laut, dibangun pada masa Pachacuti. Sekitar dua ratus bangunan tersusun mengikuti kontur lereng, disangga teras-teras bertingkat yang sekaligus menahan tanah dan menanam pangan.",
    en: "A stone settlement on a mountain ridge 2,430 metres above sea level, built in the reign of Pachacuti. Some two hundred structures follow the contours of the slope, held by stepped terraces that retain the earth and grow food at once.",
  },

  significance: {
    id: "Machu Picchu adalah rekayasa lereng sebelum ia menjadi arsitektur. Bagian terbesar dari pekerjaannya justru tidak terlihat: lapisan batu pecah dan kerikil di bawah teras yang mengalirkan air hujan deras Andes, dan itulah alasan kota ini masih berdiri setelah lima ratus tahun di daerah rawan longsor.",
    en: "Machu Picchu is slope engineering before it is architecture. The largest part of the work is the part you cannot see: layers of rubble and gravel beneath the terraces that drain the heavy Andean rain, and that is why the site still stands after five hundred years in landslide country.",
  },

  keyFeatures: [
    {
      title: { id: "Batu tanpa perekat", en: "Mortarless masonry" },
      body: {
        id: "Bangunan terpenting disusun dengan teknik ashlar: batu dipotong sedemikian rupa sehingga bertemu tanpa celah, tanpa semen apa pun. Sambungan yang rapat namun tidak kaku ini membuat dinding bergerak saat gempa lalu kembali duduk.",
        en: "The most important buildings use ashlar masonry: stones cut so they meet without a gap and without any mortar. Joints this tight yet unrigid let walls shift during earthquakes and settle back.",
      },
    },
    {
      title: { id: "Teras bertingkat", en: "Stepped terraces" },
      body: {
        id: "Teras-teras ini bukan sekadar lahan tanam. Di bawah lapisan tanah atas terdapat pasir dan batu pecah yang menyalurkan air ke bawah, mencegah lereng jenuh dan longsor pada musim hujan.",
        en: "The terraces are not merely planting beds. Beneath the topsoil lie sand and broken stone that carry water downward, keeping the slope from saturating and sliding in the wet season.",
      },
    },
    {
      title: { id: "Intihuatana", en: "The Intihuatana" },
      body: {
        id: "Pilar batu yang dipahat dari batuan induk di tempatnya berdiri, dengan sudut-sudut yang berhubungan dengan posisi matahari. Namanya sering diterjemahkan sebagai \"tempat mengikat matahari\".",
        en: "A stone pillar carved from the bedrock where it stands, its angles related to solar positions. The name is often rendered as \"the place that ties the sun\".",
      },
    },
    {
      title: { id: "Saluran air sepanjang kota", en: "A water channel through the city" },
      body: {
        id: "Air dialirkan dari mata air di lereng melalui saluran batu menuju enam belas pancuran bertingkat. Yang paling dekat dengan tempat tinggal penguasa berada di urutan pertama — hierarki yang tertulis dalam sistem air.",
        en: "Water was led from a spring on the slope through a stone channel to sixteen stepped fountains. The one nearest the ruler's residence came first — hierarchy written into the plumbing.",
      },
    },
  ],

  hotspots: [
    {
      id: "puncak",
      title: { id: "Bangunan Puncak", en: "Upper Structures" },
      summary: { id: "Sektor suci di titik tertinggi punggungan.", en: "The sacred sector at the ridge's highest point." },
      detail: {
        id: "Bangunan di bagian tertinggi menggunakan pengerjaan batu paling halus di seluruh kota. Kualitas potongan batu di Machu Picchu bukan soal selera melainkan penanda peringkat: makin penting bangunannya, makin rapat sambungannya.",
        en: "The buildings at the top use the finest stonework on the site. Cut quality at Machu Picchu is not a matter of taste but a marker of rank: the more important the building, the tighter its joints.",
      },
      anchor: [0.4, 0.95, 0.45],
      surface: "top",
    },
    {
      id: "teras",
      title: { id: "Teras Pertanian", en: "Agricultural Terraces" },
      summary: { id: "Lereng yang diubah menjadi tangga.", en: "A slope turned into a stair." },
      detail: {
        id: "Deretan teras di sisi selatan menempati bagian terluas dari kota. Selain menanam jagung dan kentang, teras ini menstabilkan seluruh punggungan — tanpa itu, bangunan di atasnya akan turun bersama tanah.",
        en: "The terrace ranks on the southern side occupy the largest part of the site. Besides growing maize and potatoes, they stabilise the whole ridge — without them the buildings above would go down with the soil.",
      },
      anchor: [0.5, 0.3, 0.85],
      surface: "ground",
    },
    {
      id: "dinding",
      title: { id: "Dinding Ashlar", en: "Ashlar Walls" },
      summary: { id: "Sambungan yang tidak bisa disisipi pisau.", en: "Joints a knife blade cannot enter." },
      detail: {
        id: "Dinding-dinding utama sedikit miring ke dalam dan sudut-sudutnya dibulatkan. Kemiringan itu menurunkan titik berat, dan bersama sambungan yang tidak kaku, membuat bangunan bertahan di zona gempa aktif.",
        en: "The principal walls lean slightly inward and their corners are rounded. The batter lowers the centre of gravity and, with the unrigid joints, keeps the buildings standing in an active earthquake zone.",
      },
      anchor: [0.3, 0.5, 0.1],
      surface: "face",
    },
    {
      id: "plaza",
      title: { id: "Plaza Utama", en: "The Main Plaza" },
      summary: { id: "Ruang kosong yang memisahkan dua sektor.", en: "The void that separates two sectors." },
      detail: {
        id: "Lapangan berumput di tengah kota memisahkan sektor suci dari sektor tempat tinggal. Ruang kosong ini disengaja — pembagian sosial kota ini dibuat terbaca lewat jarak.",
        en: "The grassed plaza at the centre separates the sacred sector from the residential one. The emptiness is deliberate — the settlement's social division is made legible through distance.",
      },
      anchor: [0.55, 0.1, 0.5],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "c. 1450", event: { id: "Dibangun pada masa pemerintahan Pachacuti.", en: "Built during the reign of Pachacuti." } },
    { year: "c. 1530", event: { id: "Kekaisaran Inka runtuh di bawah penaklukan Spanyol.", en: "The Inca Empire falls under Spanish conquest." } },
    { year: "c. 1572", event: { id: "Situs ditinggalkan; Spanyol tampaknya tidak pernah menemukannya.", en: "The site is abandoned; the Spanish appear never to have found it." } },
    { year: "1911", event: { id: "Hiram Bingham membawa keberadaannya ke perhatian internasional.", en: "Hiram Bingham brings it to international attention." } },
    { year: "1983", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Granit, tanpa perekat", en: "Granite, laid without mortar" } },
    { label: { id: "Ketinggian", en: "Elevation" }, value: { id: "2.430 meter di atas permukaan laut", en: "2,430 metres above sea level" } },
    { label: { id: "Jumlah bangunan", en: "Structures" }, value: { id: "sekitar 200", en: "about 200" } },
    { label: { id: "Pancuran air", en: "Fountains" }, value: { id: "16, tersusun bertingkat", en: "16, in a stepped sequence" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Historic Sanctuary of Machu Picchu", url: "https://whc.unesco.org/en/list/274/" },
    { title: "Britannica — Machu Picchu", url: "https://www.britannica.com/place/Machu-Picchu" },
  ],

  keywords: ["machu picchu", "inka", "inca", "peru", "andes", "cusco", "pachacuti", "teras", "ashlar"],
};
