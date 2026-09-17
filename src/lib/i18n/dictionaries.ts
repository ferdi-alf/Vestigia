/**
 * Kamus UI dwibahasa.
 *
 * Hanya untuk chrome aplikasi — tombol, label, judul section, empty state.
 * Konten heritage tidak ada di sini; ia hidup di src/data/heritage/ sebagai
 * LocalizedText, supaya teks tetap berdampingan dengan datanya.
 */
import type { Locale } from "@/data/types";

export const LOCALES: readonly Locale[] = ["id", "en"];
export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "vestigia-locale";

export const LOCALE_LABEL: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

const id = {
  brand: "Vestigia",
  tagline: "Jejak peradaban, dalam tiga dimensi",

  nav: {
    home: "Beranda",
    explore: "Jelajahi",
    lost: "Yang Hilang",
    compare: "Bandingkan",
    about: "Tentang",
    skipToContent: "Lompat ke konten",
    menu: "Menu",
    closeMenu: "Tutup menu",
  },

  footer: {
    preview: "Pratinjau",
    collection: "Koleksi",
    project: "Project",
    rights: "Hanya yang benar-benar ada.",
  },

  language: {
    switch: "Ganti bahasa",
    current: "Bahasa saat ini",
  },

  explore: {
    title: "Jelajahi Warisan Dunia",
    lead: "Pilih benua, lalu masuk ke dalam objectnya.",
    continents: "Benua",
    objectCount: (n: number) => (n === 1 ? "1 warisan" : `${n} warisan`),
    viewContinent: "Lihat koleksi",
    backToWorld: "Kembali ke peta dunia",
    backToContinent: "Kembali ke koleksi",
    empty: {
      title: "Koleksi sedang disiapkan",
      body: "Belum ada object 3D yang aktif. Warisan akan muncul di sini begitu modelnya masuk ke koleksi.",
    },
    emptyContinent: {
      title: "Belum ada warisan di benua ini",
      body: "Benua ini belum memiliki object 3D yang aktif.",
    },
  },

  heritage: {
    overview: "Sekilas",
    significance: "Mengapa penting",
    keyFeatures: "Fitur utama",
    timeline: "Lini masa",
    facts: "Fakta singkat",
    sources: "Sumber rujukan",
    hotspots: "Titik penanda",
    period: "Periode",
    civilization: "Peradaban",
    location: "Lokasi",
    coordinates: "Koordinat",
    country: "Negara",
    category: "Kategori",
  },

  viewer: {
    label: "Penampil 3D",
    loading: "Memuat model",
    loadFailed: "Model gagal dimuat",
    retry: "Coba lagi",
    reset: "Atur ulang kamera",
    zoomIn: "Perbesar",
    zoomOut: "Perkecil",
    fullscreen: "Layar penuh",
    exitFullscreen: "Keluar layar penuh",
    toggleHotspots: "Tampilkan titik penanda",
    autoRotate: "Putar otomatis",
    help: "Bantuan kontrol",
    controls: {
      title: "Kontrol",
      orbit: "Seret untuk memutar",
      zoom: "Gulir untuk memperbesar",
      pan: "Klik kanan atau dua jari untuk menggeser",
      keyboard: "Panah untuk memutar, +/− untuk zoom, Home untuk reset",
    },
  },

  ai: {
    guide: "Pemandu Budaya",
    guideLead: "Tanyakan apa saja tentang warisan ini.",
    ask: "Tanyakan",
    placeholder: "Tulis pertanyaan Anda…",
    thinking: "Menyusun jawaban…",
    stop: "Hentikan",
    clear: "Bersihkan percakapan",
    level: "Kedalaman penjelasan",
    levels: { child: "Anak", general: "Umum", deep: "Mendalam" },
    quiz: "Kuis",
    quizStart: "Mulai kuis",
    quizNext: "Soal berikutnya",
    quizRestart: "Ulangi kuis",
    quizScore: (correct: number, total: number) => `${correct} dari ${total} benar`,
    quizCorrect: "Benar",
    quizWrong: "Salah",
    compare: "Bandingkan",
    compareLead: "Pilih dua warisan untuk dibandingkan.",
    compareRun: "Bandingkan sekarang",
    story: "Kisah singkat",
    offline: "Mode luring",
    offlineNote: "Jawaban disusun langsung dari basis pengetahuan, tanpa layanan AI eksternal.",
    grounded: "Berdasarkan data warisan ini",
    error: "Jawaban gagal dimuat. Coba lagi.",
    outOfScope: "Informasi itu tidak ada dalam data warisan ini.",
  },

  common: {
    loading: "Memuat…",
    error: "Terjadi kesalahan",
    close: "Tutup",
    back: "Kembali",
    readMore: "Selengkapnya",
    notFound: "Halaman tidak ditemukan",
    notFoundBody: "Halaman yang Anda cari tidak ada atau warisan itu belum masuk koleksi.",
    backHome: "Kembali ke beranda",
  },

  landing: {
    kicker: "Warisan dunia dalam tiga dimensi",
    heroTitle: "Manusia meninggalkan kisahnya pada tempat.",
    heroLead:
      "Batu, bata dan kayu yang disusun ribuan tahun lalu masih berdiri — dan masih bisa dibaca, kalau kita tahu cara melihatnya.",
    heroPrimary: "Mulai menjelajah",
    heroSecondary: "Tentang project ini",
    /* Dipecah dari satu kalimat jadi label terpisah supaya angkanya bisa
       dicacah naik sendiri pada beat tahan. Angkanya tetap dirender sebagai
       teks sungguhan, bukan nol yang menunggu JavaScript — halaman tanpa skrip
       harus menyebut jumlah yang benar, bukan jumlah yang belum dihitung. */
    heroStatSites: "warisan",
    heroStatContinents: "benua",
    heroStatTail: "model 3D sungguhan",
    scrollHint: "Gulir",
    illustration: "Ilustrasi suasana",

    lossKicker: "Yang hilang",
    lossTitle: "Sebuah situs tidak hilang sekaligus.",
    lossBody: [
      "Ia hilang sedikit demi sedikit. Satu relief terkikis angin, satu atap runtuh, satu lapisan cat memudar sampai polanya tidak lagi terbaca. Tidak ada satu hari pun yang bisa ditunjuk sebagai hari kehilangannya.",
      "Dan yang paling sering hilang lebih dulu bukan batunya, melainkan alasannya: kenapa dibangun begitu, untuk siapa, dengan cara apa. Pengetahuan itu tinggal di dalam detail yang hanya terlihat dari jarak dekat — jarak yang tidak pernah didapat kebanyakan orang.",
    ],
    lossClose:
      "Vestigia tidak bisa menghentikan kikisan itu. Yang bisa ia lakukan adalah memindahkan jarak dekatnya ke mana pun Anda berada.",

    worldKicker: "Peta",
    worldTitle: "Lima benua, satu rentang waktu.",
    worldLead:
      "Setiap titik adalah warisan yang benar-benar ada di koleksi ini — lengkap dengan model 3D dan datanya. Tidak ada titik yang menandai sesuatu yang belum siap.",
    worldEmpty: "Belum ada titik untuk dipetakan.",

    collectionKicker: "Koleksi",
    collectionTitle: "Apa yang ada sekarang",
    collectionLead:
      "Arahkan kursor ke sebuah kartu dan modelnya mulai diunduh di latar, supaya saat Anda mengkliknya objectnya sudah siap.",
    collectionAll: "Lihat semua",

    stageKicker: "Penjelajah",
    stageTitle: "Bukan gambar. Objectnya sendiri.",
    stageLead:
      "Putar, dekati, dan lihat dari sudut yang tidak tersedia bahkan bagi orang yang berdiri di depannya.",
    stageOpen: "Buka penjelajah penuh",
    stageIdle: "Panggung dimuat saat Anda sampai di sini",

    aiKicker: "Pemandu Budaya",
    aiTitle: "Bertanya, dan dijawab dari datanya sendiri.",
    aiLead:
      "Pemandu ini terikat pada satu situs. Ia menjawab dari data situs itu, menyebut sumbernya, dan berhenti ketika datanya habis.",
    aiTryTitle: "Coba salah satu:",
    aiQuestions: (name: string) => [
      `Mengapa ${name} penting?`,
      `Kapan ${name} dibangun?`,
      `Berapa jumlah pengunjung ${name} tahun lalu?`,
    ],
    aiSources: "Sumber",
    aiIdle: "Pilih satu pertanyaan di atas.",
    aiHonestLabel: "Pertanyaan di luar data",
    aiHonestNote:
      "Pertanyaan ketiga sengaja tidak ada jawabannya di dalam data. Perhatikan apa yang terjadi — itulah bagian yang paling penting.",

    closeTitle: "Mulai dari satu tempat.",
    closeLead: "Pilih satu benua, lalu masuk ke dalam objectnya.",
    closeCta: "Jelajahi Warisan Dunia",
  },
};

/**
 * Bentuk kamus, diturunkan dari kamus Indonesia.
 *
 * Tanpa `as const`, tiap nilai bertipe `string` alih-alih literalnya, sehingga
 * kamus Inggris bisa memenuhi bentuk yang sama. Yang tetap ditegakkan justru
 * yang penting: setiap kunci yang ada di satu bahasa wajib ada di bahasa lain,
 * dengan bentuk yang sama persis — kunci yang lupa diterjemahkan gagal saat build,
 * bukan muncul sebagai teks kosong di layar.
 */
export type Dictionary = typeof id;

const en: Dictionary = {
  brand: "Vestigia",
  tagline: "Traces of civilisation, in three dimensions",

  nav: {
    home: "Home",
    explore: "Explore",
    lost: "What is lost",
    compare: "Compare",
    about: "About",
    skipToContent: "Skip to content",
    menu: "Menu",
    closeMenu: "Close menu",
  },

  footer: {
    preview: "Preview",
    collection: "Collection",
    project: "Project",
    rights: "Only what is actually there.",
  },

  language: {
    switch: "Change language",
    current: "Current language",
  },

  explore: {
    title: "Explore World Heritage",
    lead: "Choose a continent, then step inside the object.",
    continents: "Continents",
    objectCount: (n: number) => (n === 1 ? "1 site" : `${n} sites`),
    viewContinent: "View collection",
    backToWorld: "Back to the world map",
    backToContinent: "Back to collection",
    empty: {
      title: "The collection is being prepared",
      body: "No 3D objects are active yet. Heritage sites appear here as soon as their models join the collection.",
    },
    emptyContinent: {
      title: "No heritage here yet",
      body: "This continent has no active 3D objects.",
    },
  },

  heritage: {
    overview: "Overview",
    significance: "Why it matters",
    keyFeatures: "Key features",
    timeline: "Timeline",
    facts: "Quick facts",
    sources: "Sources",
    hotspots: "Markers",
    period: "Period",
    civilization: "Civilisation",
    location: "Location",
    coordinates: "Coordinates",
    country: "Country",
    category: "Category",
  },

  viewer: {
    label: "3D viewer",
    loading: "Loading model",
    loadFailed: "The model failed to load",
    retry: "Try again",
    reset: "Reset camera",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    toggleHotspots: "Show markers",
    autoRotate: "Auto-rotate",
    help: "Control help",
    controls: {
      title: "Controls",
      orbit: "Drag to orbit",
      zoom: "Scroll to zoom",
      pan: "Right-click or two fingers to pan",
      keyboard: "Arrows to orbit, +/− to zoom, Home to reset",
    },
  },

  ai: {
    guide: "Cultural Guide",
    guideLead: "Ask anything about this heritage site.",
    ask: "Ask",
    placeholder: "Type your question…",
    thinking: "Composing an answer…",
    stop: "Stop",
    clear: "Clear conversation",
    level: "Explanation depth",
    levels: { child: "Child", general: "General", deep: "In depth" },
    quiz: "Quiz",
    quizStart: "Start quiz",
    quizNext: "Next question",
    quizRestart: "Restart quiz",
    quizScore: (correct: number, total: number) => `${correct} of ${total} correct`,
    quizCorrect: "Correct",
    quizWrong: "Wrong",
    compare: "Compare",
    compareLead: "Pick two heritage sites to compare.",
    compareRun: "Compare now",
    story: "Short story",
    offline: "Offline mode",
    offlineNote: "Answers are assembled directly from the knowledge base, with no external AI service.",
    grounded: "Based on this site's data",
    error: "The answer failed to load. Try again.",
    outOfScope: "That information is not in this site's data.",
  },

  common: {
    loading: "Loading…",
    error: "Something went wrong",
    close: "Close",
    back: "Back",
    readMore: "Read more",
    notFound: "Page not found",
    notFoundBody: "The page you are looking for does not exist, or that heritage site is not in the collection yet.",
    backHome: "Back to home",
  },

  landing: {
    kicker: "World heritage in three dimensions",
    heroTitle: "Humanity left its story in places.",
    heroLead:
      "Stone, brick and timber raised thousands of years ago are still standing — and still legible, if you know how to look.",
    heroPrimary: "Start exploring",
    heroSecondary: "About this project",
    heroStatSites: "sites",
    heroStatContinents: "continents",
    heroStatTail: "real 3D models",
    scrollHint: "Scroll",
    illustration: "Atmospheric illustration",

    lossKicker: "What is lost",
    lossTitle: "A site does not disappear all at once.",
    lossBody: [
      "It goes a little at a time. One relief scoured by wind, one roof fallen in, one layer of pigment faded until the pattern no longer reads. There is never a single day you can point to as the day it was lost.",
      "And what usually goes first is not the stone but the reason: why it was built that way, for whom, by what means. That knowledge lives in detail visible only from close up — a closeness most people never get.",
    ],
    lossClose:
      "Vestigia cannot stop the weathering. What it can do is move the close-up to wherever you are.",

    worldKicker: "The map",
    worldTitle: "Five continents, one span of time.",
    worldLead:
      "Every point is a site that genuinely exists in this collection, with both a 3D model and its data. No point marks something that is not ready.",
    worldEmpty: "No points to map yet.",

    collectionKicker: "Collection",
    collectionTitle: "What is here now",
    collectionLead:
      "Hover a card and its model starts downloading in the background, so the object is ready by the time you click.",
    collectionAll: "See all",

    stageKicker: "The explorer",
    stageTitle: "Not a picture. The object itself.",
    stageLead:
      "Turn it, move in close, and look from angles unavailable even to someone standing in front of it.",
    stageOpen: "Open the full explorer",
    stageIdle: "The stage loads when you reach it",

    aiKicker: "Cultural Guide",
    aiTitle: "Ask, and be answered from its own data.",
    aiLead:
      "The guide is bound to one site. It answers from that site's data, names its sources, and stops where the data stops.",
    aiTryTitle: "Try one:",
    aiQuestions: (name: string) => [
      `Why does ${name} matter?`,
      `When was ${name} built?`,
      `How many visitors did ${name} have last year?`,
    ],
    aiSources: "Sources",
    aiIdle: "Pick one of the questions above.",
    aiHonestLabel: "A question outside the data",
    aiHonestNote:
      "The third question deliberately has no answer in the data. Watch what happens — that is the part that matters most.",

    closeTitle: "Begin with one place.",
    closeLead: "Choose a continent, then step inside the object.",
    closeCta: "Explore World Heritage",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { id, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export function isLocale(value: string | undefined): value is Locale {
  return value === "id" || value === "en";
}
