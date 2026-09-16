import type { HeritageMeta } from "../types";

export const terracottaArmy: HeritageMeta = {
  slug: "terracotta-army",
  name: { id: "Tentara Terakota", en: "Terracotta Army" },
  country: { id: "Tiongkok", en: "China" },
  location: { id: "Distrik Lintong, Xi'an, Shaanxi", en: "Lintong District, Xi'an, Shaanxi" },
  coordinates: [34.3841, 109.2785],
  period: { id: "sekitar 210 SM", en: "c. 210 BCE" },
  civilization: { id: "Dinasti Qin", en: "Qin dynasty" },
  category: "tomb",

  description: {
    id: "Ribuan prajurit tanah liat seukuran manusia, dikubur dalam formasi tempur untuk mengawal makam Qin Shi Huang, kaisar pertama Tiongkok yang bersatu. Ditemukan tidak sengaja pada 1974 oleh petani yang sedang menggali sumur.",
    en: "Thousands of life-size clay soldiers, buried in battle formation to guard the tomb of Qin Shi Huang, first emperor of a unified China. Found by accident in 1974 by farmers digging a well.",
  },

  significance: {
    id: "Pasukan ini adalah potret produksi massal yang paling awal dan paling ambisius yang pernah ditemukan. Tubuhnya dibuat dari cetakan berulang, tetapi wajahnya dirakit dari komponen yang dikombinasikan sehingga hampir tidak ada dua kepala yang sama — industri dan individualitas dalam satu bengkel.",
    en: "The army is the earliest and most ambitious portrait of mass production yet found. Bodies came from repeated moulds, but faces were assembled from combinable components so that almost no two heads repeat — industry and individuality in one workshop.",
  },

  keyFeatures: [
    {
      title: { id: "Wajah yang tidak berulang", en: "Faces that do not repeat" },
      body: {
        id: "Telinga, hidung, mata, mulut, kumis, dan gaya rambut dibuat sebagai komponen terpisah lalu dipasangkan dalam kombinasi berbeda. Hasilnya bukan potret individu nyata, melainkan variasi yang cukup untuk membuat barisan tidak terlihat seragam.",
        en: "Ears, noses, eyes, mouths, moustaches and hairstyles were made as separate components and combined differently. The result is not portraits of real individuals but variation sufficient to keep the ranks from reading as uniform.",
      },
    },
    {
      title: { id: "Pernah berwarna", en: "Originally painted" },
      body: {
        id: "Setiap patung dulunya dilapisi pernis lalu dicat dengan warna terang. Lapisan itu mengering dan mengelupas dalam hitungan menit setelah terkena udara saat penggalian, sehingga sebagian besar penemuan awal kehilangan warnanya secara permanen.",
        en: "Every figure was once lacquered and painted in bright colour. On excavation the layer dried and flaked within minutes of contact with air, so most early finds lost their colour permanently.",
      },
    },
    {
      title: { id: "Peringkat yang terbaca dari bentuk", en: "Rank legible from form" },
      body: {
        id: "Tinggi patung, gaya baju zirah, ikatan rambut, dan sikap tubuh menandai jabatan. Perwira berdiri lebih tinggi dari prajurit biasa — perbedaan yang disengaja, bukan akibat pembuatan yang tidak seragam.",
        en: "Height, armour style, hair binding and posture mark rank. Officers stand taller than infantry — a deliberate distinction, not an artefact of uneven manufacture.",
      },
    },
    {
      title: { id: "Senjata perunggu asli", en: "Real bronze weapons" },
      body: {
        id: "Patung-patung ini memegang senjata sungguhan: pedang, tombak, dan busur silang perunggu. Sebagian bilah masih tajam setelah dua ribu tahun berkat lapisan permukaan yang kaya kromium.",
        en: "The figures held real weapons: bronze swords, spears and crossbow triggers. Some blades remain sharp after two thousand years thanks to a chromium-rich surface layer.",
      },
    },
  ],

  hotspots: [
    {
      id: "kepala",
      title: { id: "Kepala dan Wajah", en: "Head and Face" },
      summary: { id: "Bagian yang membuat setiap prajurit berbeda.", en: "The part that makes each soldier different." },
      detail: {
        id: "Kepala dibuat terpisah dari tubuh dan dipasang belakangan. Karena itulah bengkel bisa memproduksi badan secara berulang sambil tetap menghasilkan wajah yang berbeda-beda — pemisahan yang menyelesaikan masalah skala dan variasi sekaligus.",
        en: "Heads were made separately from bodies and fitted afterwards. That is what let the workshops repeat torsos while still producing differing faces — a separation that solved scale and variation at once.",
      },
      anchor: [0.5, 0.95, 0.5],
      surface: "top",
    },
    {
      id: "zirah",
      title: { id: "Baju Zirah", en: "Armour" },
      summary: { id: "Lempeng bersusun yang dipahat satu per satu.", en: "Overlapping plates, cut one by one." },
      detail: {
        id: "Zirah dipahat sebagai lempeng-lempeng kecil yang saling menindih, lengkap dengan paku keling dan tali pengikatnya. Tingkat kerincian ini menjadi sumber utama pengetahuan modern tentang perlengkapan tempur Dinasti Qin.",
        en: "Armour is carved as small overlapping plates, complete with rivets and binding cords. That level of detail is the main source of modern knowledge about Qin-dynasty battle equipment.",
      },
      anchor: [0.5, 0.6, 0.05],
      surface: "face",
    },
    {
      id: "sikap-tubuh",
      title: { id: "Sikap Tubuh", en: "Stance" },
      summary: { id: "Posisi tangan menunjukkan senjata yang hilang.", en: "Hand position reveals a missing weapon." },
      detail: {
        id: "Banyak patung berdiri dengan tangan menggenggam ruang kosong. Bentuk genggaman itulah yang memberi tahu arkeolog jenis senjata yang dulu dipegang, jauh setelah gagang kayunya membusuk.",
        en: "Many figures stand gripping empty air. The shape of the grip is what tells archaeologists which weapon was once held, long after the wooden shafts rotted away.",
      },
      anchor: [0.7, 0.5, 0.3],
      surface: "face",
    },
    {
      id: "alas",
      title: { id: "Alas Kaki", en: "Base and Footing" },
      summary: { id: "Lempeng persegi yang menahan berat.", en: "The square slab that carries the weight." },
      detail: {
        id: "Setiap prajurit berdiri di atas lempeng tanah liat persegi. Alas ini mencegah patung setinggi hampir dua meter itu terbenam ke lantai lorong yang berupa tanah padat, dan menjaga formasi tetap rapi.",
        en: "Each soldier stands on a square clay slab. The base kept a figure of nearly two metres from sinking into the packed-earth corridor floor, and held the formation in line.",
      },
      anchor: [0.5, 0.02, 0.5],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "246 SM", event: { id: "Pembangunan kompleks makam dimulai saat Ying Zheng naik takhta Qin.", en: "Work on the tomb complex begins when Ying Zheng takes the Qin throne." } },
    { year: "221 SM", event: { id: "Ying Zheng menyatukan Tiongkok dan bergelar Qin Shi Huang.", en: "Ying Zheng unifies China and takes the title Qin Shi Huang." } },
    { year: "210 SM", event: { id: "Kaisar wafat dan dimakamkan; pasukan terakota dikubur bersamanya.", en: "The emperor dies and is entombed; the terracotta army is buried with him." } },
    { year: "1974", event: { id: "Petani yang menggali sumur menemukan pecahan patung.", en: "Farmers digging a well uncover fragments of the figures." } },
    { year: "1987", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Tanah liat bakar, dulu berpernis dan bercat", en: "Fired clay, once lacquered and painted" } },
    { label: { id: "Perkiraan jumlah", en: "Estimated figures" }, value: { id: "sekitar 8.000 prajurit", en: "about 8,000 soldiers" } },
    { label: { id: "Tinggi rata-rata", en: "Average height" }, value: { id: "1,75–2,00 meter", en: "1.75–2.00 metres" } },
    { label: { id: "Ditemukan", en: "Discovered" }, value: { id: "1974", en: "1974" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Mausoleum of the First Qin Emperor", url: "https://whc.unesco.org/en/list/441/" },
    { title: "Britannica — Qin tomb", url: "https://www.britannica.com/topic/Qin-tomb" },
  ],

  keywords: ["terracotta", "terakota", "qin", "xian", "shaanxi", "tiongkok", "china", "qin shi huang", "makam"],
};
