import type { HeritageMeta } from "../types";

export const borobudur: HeritageMeta = {
  slug: "borobudur",
  name: { id: "Borobudur", en: "Borobudur" },
  country: { id: "Indonesia", en: "Indonesia" },
  location: { id: "Magelang, Jawa Tengah", en: "Magelang, Central Java" },
  coordinates: [-7.6079, 110.2038],
  period: { id: "sekitar 780–840 M", en: "c. 780–840 CE" },
  civilization: { id: "Wangsa Sailendra", en: "Sailendra dynasty" },
  category: "temple",

  description: {
    id: "Candi Buddha terbesar di dunia, disusun dari sekitar dua juta balok batu andesit tanpa perekat di dataran Kedu. Bentuknya bukan bangunan berongga melainkan bukit yang dipahat menjadi sembilan teras bertingkat — enam persegi, tiga melingkar — dan dimahkotai satu stupa induk.",
    en: "The largest Buddhist monument in the world, raised from some two million andesite blocks laid without mortar on the Kedu plain. It is not a hollow building but a hill dressed into nine stacked terraces — six square, three circular — crowned by a single central stupa.",
  },

  significance: {
    id: "Borobudur adalah teks yang dibangun. Seluruh jalur naiknya, sekitar lima kilometer relief, menuntun peziarah dari dunia hasrat menuju kekosongan tanpa satu pun kata tertulis. Ia juga bukti bahwa Jawa abad kedelapan sudah menguasai geometri, logistik batu, dan teologi pada tingkat yang sama.",
    en: "Borobudur is a text that was built. Its entire ascent — some five kilometres of relief — walks a pilgrim from the world of desire to formlessness without a single written word. It is also evidence that eighth-century Java commanded geometry, stone logistics and theology in equal measure.",
  },

  keyFeatures: [
    {
      title: { id: "Sembilan teras bertingkat", en: "Nine stacked terraces" },
      body: {
        id: "Enam teras persegi di bawah, tiga teras melingkar di atas. Pembagian ini memetakan tiga alam dalam kosmologi Buddha: Kamadhatu, Rupadhatu, dan Arupadhatu. Peziarah tidak membaca urutan itu — ia menaikinya.",
        en: "Six square terraces below, three circular above. The division maps the three realms of Buddhist cosmology: Kamadhatu, Rupadhatu and Arupadhatu. A pilgrim does not read the sequence — they climb it.",
      },
    },
    {
      title: { id: "2.672 panel relief", en: "2,672 relief panels" },
      body: {
        id: "Dipahat pada dinding dan pagar langkan sepanjang jalur pradaksina. Panel bawah menggambarkan hukum sebab-akibat, panel atas mengisahkan riwayat Buddha dan perjalanan Sudhana mencari kebijaksanaan.",
        en: "Carved along the walls and balustrades of the circumambulation path. The lower panels depict cause and effect; the upper ones tell the life of the Buddha and Sudhana's search for wisdom.",
      },
    },
    {
      title: { id: "72 stupa berlubang", en: "72 perforated stupas" },
      body: {
        id: "Berdiri di tiga teras melingkar, masing-masing memuat satu arca Buddha yang hanya terlihat samar melalui celah batu berbentuk belah ketupat dan bujur sangkar. Pemahaman sengaja dibuat tidak langsung.",
        en: "Standing on the three circular terraces, each housing a Buddha figure visible only in glimpses through diamond- and square-cut apertures. Understanding is deliberately made indirect.",
      },
    },
    {
      title: { id: "Sistem pelesapan air", en: "Water shedding system" },
      body: {
        id: "Seratus lebih pancuran berbentuk makara mengalirkan air hujan keluar dari setiap teras. Tanpa itu, air akan menggenang di antara lapisan batu dan meruntuhkan bangunan dalam hitungan musim.",
        en: "More than a hundred makara-shaped spouts drain rainwater off every terrace. Without them water would sit between the stone courses and bring the structure down within a few seasons.",
      },
    },
  ],

  hotspots: [
    {
      id: "stupa-induk",
      title: { id: "Stupa Induk", en: "Central Stupa" },
      summary: { id: "Puncak jalur, dan ruang yang kosong.", en: "The summit of the path, and an empty chamber." },
      detail: {
        id: "Stupa terbesar di puncak berdiameter sekitar sebelas meter dan tertutup rapat. Ruang di dalamnya kosong — pembacaan yang paling banyak diterima adalah bahwa kekosongan itulah pesannya, tahap terakhir setelah bentuk ditinggalkan.",
        en: "The largest stupa at the summit is about eleven metres across and wholly sealed. Its chamber is empty — the most widely held reading is that the emptiness is the point, the final stage once form is left behind.",
      },
      anchor: [0.5, 0.95, 0.5],
      surface: "top",
    },
    {
      id: "teras-melingkar",
      title: { id: "Teras Melingkar", en: "Circular Terraces" },
      summary: { id: "Tempat dinding berhenti dan pandangan terbuka.", en: "Where the walls stop and the view opens." },
      detail: {
        id: "Naik dari teras persegi, dinding relief tiba-tiba hilang dan peziarah berdiri di ruang terbuka bersama stupa-stupa berlubang. Perubahan pengalaman ruang ini disengaja: dari terkurung cerita menjadi lepas darinya.",
        en: "Rising from the square terraces, the relief walls fall away and the pilgrim stands in open space among the perforated stupas. The shift is deliberate: from being enclosed by narrative to being released from it.",
      },
      anchor: [0.35, 0.75, 0.45],
      surface: "top",
    },
    {
      id: "dinding-relief",
      title: { id: "Dinding Relief", en: "Relief Galleries" },
      summary: { id: "Lima kilometer pahatan sepanjang jalur.", en: "Five kilometres of carving along the path." },
      detail: {
        id: "Lorong-lorong sempit di teras persegi diapit dua dinding berpahat, sehingga peziarah hanya bisa melihat relief dan langit. Pengarahan pandangan ini yang membuat jalur naiknya terbaca sebagai satu urutan, bukan kumpulan gambar.",
        en: "The narrow galleries of the square terraces are flanked by carved walls on both sides, leaving a pilgrim only the reliefs and the sky. That framing is what makes the ascent read as one sequence rather than a collection of pictures.",
      },
      anchor: [0.5, 0.45, 0.04],
      surface: "face",
    },
    {
      id: "dasar-tersembunyi",
      title: { id: "Kaki Candi", en: "The Hidden Foot" },
      summary: { id: "Lapisan relief yang tertimbun batu penyangga.", en: "A relief layer buried under a stone encasement." },
      detail: {
        id: "Di bawah lantai dasar terdapat 160 panel relief yang tertutup lapisan batu tambahan. Alasan penutupannya masih diperdebatkan: penguatan struktur yang mulai melorot, atau keputusan menyembunyikan penggambaran hukum karma.",
        en: "Beneath the base floor lie 160 relief panels sealed by an added stone encasement. Why it was covered is still debated: structural reinforcement against slumping, or a decision to hide the depiction of karmic law.",
      },
      anchor: [0.5, 0.05, 0.9],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "c. 780 M", event: { id: "Pembangunan dimulai di bawah Wangsa Sailendra.", en: "Construction begins under the Sailendra dynasty." } },
    { year: "c. 840 M", event: { id: "Bangunan pada dasarnya selesai.", en: "The monument is substantially complete." } },
    { year: "abad ke-14", event: { id: "Ditinggalkan seiring pusat kekuasaan Jawa bergeser ke timur.", en: "Abandoned as Javanese power shifts eastward." } },
    { year: "1814", event: { id: "Dibersihkan kembali dari tumbuhan dan abu vulkanik atas perintah Thomas Stamford Raffles.", en: "Cleared of vegetation and volcanic ash on the orders of Thomas Stamford Raffles." } },
    { year: "1975–1982", event: { id: "Pemugaran besar: lebih dari satu juta batu dibongkar, dibersihkan, dan dipasang kembali dengan sistem drainase baru.", en: "Major restoration: over a million stones dismantled, cleaned and reset with a new drainage system." } },
    { year: "1991", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Batu andesit, tanpa perekat", en: "Andesite stone, laid without mortar" } },
    { label: { id: "Luas dasar", en: "Base area" }, value: { id: "sekitar 123 × 123 meter", en: "about 123 × 123 metres" } },
    { label: { id: "Arca Buddha", en: "Buddha figures" }, value: { id: "504 arca", en: "504 statues" } },
    { label: { id: "Panel relief", en: "Relief panels" }, value: { id: "2.672 panel", en: "2,672 panels" } },
  ],

  /* Borobudur dibaca dari ATAS. Auto-framing membingkainya dari samping pada
     elevasi rendah, dan dari sana sembilan teras bertingkat saling menutup
     sampai bangunannya terbaca sebagai gundukan biasa. Elevasi tinggi yang
     memulihkan bentuknya: enam teras persegi dan tiga teras melingkar hanya
     terbaca sebagai susunan kalau dilihat menurun ke arah stupa induk.

     `distance` di bawah 1 berarti lebih dekat daripada auto-framing. Bidang
     dasarnya persegi 2x2 unit setelah normalisasi, jadi pada elevasi tinggi
     diagonalnya melipat ke arah vertikal layar dan memakan tinggi bingkai —
     itu sebabnya angkanya tidak bisa didorong lebih rendah lagi tanpa
     memotong sudut alasnya. */
  camera: {
    azimuth: -32,
    elevation: 44,
    distance: 0.86,
    targetY: 0.16,
  },

  sources: [
    { title: "UNESCO World Heritage Centre — Borobudur Temple Compounds", url: "https://whc.unesco.org/en/list/592/" },
    { title: "Britannica — Borobudur", url: "https://www.britannica.com/topic/Borobudur" },
  ],

  keywords: ["borobudur", "candi", "buddha", "jawa", "java", "sailendra", "stupa", "magelang", "indonesia"],
};
