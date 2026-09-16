import type { HeritageMeta } from "../types";

export const chichenItza: HeritageMeta = {
  slug: "chichen-itza",
  name: { id: "Chichén Itzá — El Castillo", en: "Chichén Itzá — El Castillo" },
  country: { id: "Meksiko", en: "Mexico" },
  location: { id: "Yucatán", en: "Yucatán" },
  coordinates: [20.6829, -88.5686],
  period: { id: "sekitar abad ke-9–12 M", en: "c. 9th–12th century CE" },
  civilization: { id: "Maya", en: "Maya" },
  category: "temple",

  description: {
    id: "Piramida berundak setinggi sekitar tiga puluh meter dengan tangga di keempat sisinya, dikenal juga sebagai Kuil Kukulkán. Bentuknya bukan sekadar bangunan melainkan alat: geometrinya menyimpan perhitungan kalender dan perilaku matahari.",
    en: "A stepped pyramid about thirty metres tall with a stairway on each of its four sides, also known as the Temple of Kukulcán. Its form is not only a building but an instrument: the geometry holds calendar arithmetic and the behaviour of the sun.",
  },

  significance: {
    id: "El Castillo memperlihatkan bagaimana Maya menuangkan astronomi ke dalam batu. Bangunan ini tidak menyimpan catatan tentang tahun — ia adalah catatan itu sendiri, dan dua kali setahun ia memperagakan hasil perhitungannya di hadapan siapa pun yang berdiri di kaki tangganya.",
    en: "El Castillo shows how the Maya poured astronomy into stone. The building does not hold a record of the year — it is the record, and twice a year it performs its own arithmetic in front of anyone standing at the foot of the stairs.",
  },

  keyFeatures: [
    {
      title: { id: "365 anak tangga", en: "365 steps" },
      body: {
        id: "Empat tangga masing-masing berisi 91 anak tangga; ditambah platform puncak, jumlahnya menjadi 365 — satu untuk setiap hari dalam tahun matahari.",
        en: "Four stairways of 91 steps each; with the top platform, the total is 365 — one for each day of the solar year.",
      },
    },
    {
      title: { id: "Bayangan ular saat ekuinoks", en: "The equinox serpent" },
      body: {
        id: "Pada sore hari sekitar ekuinoks, sudut-sudut teras melemparkan bayangan bergerigi ke sisi tangga utara. Bayangan itu menyambung dengan kepala ular batu di dasar tangga, membentuk sosok ular yang seolah turun dari puncak.",
        en: "On afternoons near the equinoxes, the terrace corners throw a serrated shadow along the northern stairway. It joins the stone serpent head at the base, forming a snake that appears to descend from the summit.",
      },
    },
    {
      title: { id: "Piramida di dalam piramida", en: "A pyramid inside the pyramid" },
      body: {
        id: "Di dalam bangunan yang terlihat sekarang terdapat piramida yang lebih tua dan lebih kecil, lengkap dengan ruangan berisi singgasana jaguar merah. Membangun di atas bangunan lama adalah praktik Maya yang lazim.",
        en: "Inside the structure now visible stands an older and smaller pyramid, complete with a chamber holding a red jaguar throne. Building over an older building was common Maya practice.",
      },
    },
    {
      title: { id: "Akustik tangga", en: "Stairway acoustics" },
      body: {
        id: "Tepukan tangan di depan tangga menghasilkan gema mencicit yang sering dibandingkan dengan suara burung quetzal. Efek ini timbul dari pemantulan berulang antar anak tangga; apakah ia disengaja masih diperdebatkan.",
        en: "A handclap before the stairway returns a chirped echo often likened to the call of a quetzal. The effect arises from repeated reflection between the steps; whether it was intended remains debated.",
      },
    },
  ],

  hotspots: [
    {
      id: "kuil-puncak",
      title: { id: "Kuil Puncak", en: "The Summit Temple" },
      summary: { id: "Ruang kecil di atas sembilan teras.", en: "A small chamber above nine terraces." },
      detail: {
        id: "Bangunan persegi di puncak jauh lebih kecil dari massa piramida di bawahnya. Perbandingan ini disengaja: pendakian itu sendiri yang menjadi ritual, sedangkan ruangnya hanya untuk sedikit orang.",
        en: "The rectangular structure at the top is far smaller than the mass beneath it. The proportion is deliberate: the ascent is the ritual, while the chamber is for only a few.",
      },
      anchor: [0.5, 0.97, 0.5],
      surface: "top",
    },
    {
      id: "tangga-utara",
      title: { id: "Tangga Utara", en: "North Stairway" },
      summary: { id: "Sisi tempat bayangan ular muncul.", en: "The side where the serpent shadow appears." },
      detail: {
        id: "Tangga utara diapit balustrade yang berakhir dengan kepala ular berukir di dasarnya. Hanya sisi inilah yang menghasilkan efek ekuinoks, karena hanya sisi ini yang menerima bayangan dari sudut teras barat.",
        en: "The north stairway is flanked by balustrades ending in carved serpent heads at the base. Only this side produces the equinox effect, because only this side receives the shadow of the western terrace corners.",
      },
      anchor: [0.5, 0.45, 0.98],
      surface: "face",
    },
    {
      id: "teras",
      title: { id: "Sembilan Teras", en: "Nine Terraces" },
      summary: { id: "Sudut-sudut yang menghasilkan bayangan bergerigi.", en: "The corners that make the serrated shadow." },
      detail: {
        id: "Sembilan lapis teras dibelah tangga menjadi delapan belas bagian per sisi — sesuai jumlah bulan dalam kalender Haab' Maya. Sudut menonjol tiap teras inilah yang melemparkan segitiga bayangan.",
        en: "Nine terrace levels, split by the stairways into eighteen sections per side — matching the number of months in the Maya Haab' calendar. The projecting corner of each terrace throws one shadow triangle.",
      },
      anchor: [0.15, 0.5, 0.15],
      surface: "face",
    },
    {
      id: "plaza",
      title: { id: "Plaza", en: "The Plaza" },
      summary: { id: "Tanah datar tempat semua orang berdiri.", en: "The level ground where everyone stood." },
      detail: {
        id: "Piramida berdiri sendirian di tengah lapangan luas. Ruang kosong itu bagian dari rancangan: efek bayangan hanya bekerja kalau ada tempat untuk mundur dan melihatnya secara utuh.",
        en: "The pyramid stands alone in a wide plaza. The emptiness is part of the design: the shadow effect only works if there is room to step back and see the whole of it.",
      },
      anchor: [0.5, 0.02, 0.9],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "c. 600 M", event: { id: "Chichén Itzá berkembang menjadi pusat besar di Yucatán utara.", en: "Chichén Itzá grows into a major centre in northern Yucatán." } },
    { year: "c. 900–1100", event: { id: "El Castillo dibangun menutupi piramida yang lebih tua.", en: "El Castillo is built over an earlier pyramid." } },
    { year: "c. 1250", event: { id: "Kota sebagian besar ditinggalkan sebagai pusat kekuasaan.", en: "The city is largely abandoned as a seat of power." } },
    { year: "1841", event: { id: "John Lloyd Stephens dan Frederick Catherwood mempublikasikan catatan dan gambar situs.", en: "John Lloyd Stephens and Frederick Catherwood publish accounts and drawings of the site." } },
    { year: "1988", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Batu kapur", en: "Limestone" } },
    { label: { id: "Tinggi", en: "Height" }, value: { id: "sekitar 30 meter", en: "about 30 metres" } },
    { label: { id: "Jumlah anak tangga", en: "Total steps" }, value: { id: "365 termasuk platform puncak", en: "365 including the top platform" } },
    { label: { id: "Jumlah teras", en: "Terraces" }, value: { id: "9 lapis", en: "9 levels" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Pre-Hispanic City of Chichen-Itza", url: "https://whc.unesco.org/en/list/483/" },
    { title: "Britannica — Chichén Itzá", url: "https://www.britannica.com/place/Chichen-Itza" },
  ],

  keywords: ["chichen itza", "el castillo", "kukulkan", "maya", "meksiko", "mexico", "yucatan", "piramida", "ekuinoks"],
};
