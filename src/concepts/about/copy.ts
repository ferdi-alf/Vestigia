import type { LocalizedText } from "@/data/types";

/**
 * Teks halaman Tentang.
 *
 * Mengikuti pola `A_COPY` dan saudara-saudaranya: dwibahasa wajib di kedua
 * sisi, sehingga terjemahan yang lupa ditulis gagal saat build alih-alih
 * dirender kosong.
 *
 * Empat kunci di bagian bawah — `mapKicker` sampai `mapSites` — adalah teks
 * yang sama yang dulu dipakai section Pintu Masuk di landing. Section itu
 * dihapus saat landing dipadatkan jadi tiga babak, dan pemilik project meminta
 * petanya kembali di sini. Teksnya ikut kembali bersamanya.
 *
 * ---
 *
 * **Yang TIDAK ditulis di sini: klaim.**
 *
 * Halaman ini menjelaskan cara kerja aplikasi, dan angka-angkanya dibaca dari
 * registry saat render — bukan diketik ke dalam kalimat. Sebuah halaman
 * "tentang" yang menyebut jumlah koleksi dalam teks statis adalah halaman yang
 * berbohong pada hari seseorang menambahkan warisan keenam belas.
 */
export const ABOUT_COPY = {
  kicker: { id: "Tentang project ini", en: "About this project" },
  title: {
    id: "Hanya yang benar-benar ada.",
    en: "Only what is actually there.",
  },
  lead: {
    id: "Vestigia adalah ruang baca warisan budaya dunia dalam tiga dimensi. Setiap situs di sini punya model 3D sungguhan dan metadata yang ditulis tangan — dan yang tidak punya keduanya tidak ditampilkan sama sekali.",
    en: "Vestigia is a reading room for world heritage in three dimensions. Every site here has a real 3D model and hand-written metadata — and anything lacking either is not shown at all.",
  },

  thesisKicker: { id: "Tesisnya", en: "The thesis" },
  thesisTitle: { id: "Menolak mengarang.", en: "Refusing to invent." },
  thesisBody: {
    id: "Sebuah aplikasi warisan budaya paling mudah dibuat mengesankan dengan cara mengarang: daftar situs yang panjang, deskripsi yang mengalir, jawaban yang selalu tersedia. Vestigia memilih kebalikannya. Koleksinya ditentukan oleh berkas yang benar-benar ada di disk, bukan oleh daftar yang ditulis tangan — menghapus satu model menghapus situsnya dari seluruh situs web tanpa satu baris kode pun berubah.",
    en: "A heritage application is easiest to make impressive by inventing: a long list of sites, flowing descriptions, an answer always ready. Vestigia chose the opposite. Its collection is decided by the files actually on disk, not by a hand-written list — deleting one model removes that site from the entire website without a single line of code changing.",
  },
  thesisAi: {
    id: "Pemandu AI-nya terikat pada aturan yang sama. Ia hanya menjawab dari data situs yang sedang dibuka, dan ketika sesuatu tidak ada di sana ia mengatakannya — bukan menambalnya dengan pengetahuan umum yang kedengarannya benar.",
    en: "The AI guide is bound by the same rule. It answers only from the data of the site being viewed, and when something is not there it says so — rather than patching the gap with general knowledge that merely sounds right.",
  },

  statSites: { id: "Situs", en: "Sites" },
  statContinents: { id: "Benua", en: "Continents" },
  statFormat: { id: "Format", en: "Format" },
  statFormatValue: { id: "Model 3D + data", en: "3D model + data" },

  craftKicker: { id: "Cara kerjanya", en: "How it works" },
  craftTitle: { id: "Satu berkas, satu warisan.", en: "One file, one heritage." },
  craftBody: {
    id: "Model 3D mentah berjumlah ratusan megabyte, jauh terlalu berat untuk dibuka di peramban. Sebuah pipeline memampatkannya, membuat versi kecil untuk globe, dan merender gambar daftar langsung dari geometrinya. Semua itu berjalan sebelum build, dan hasilnya dicatat manifest yang digenerate — tidak ada satu pun path asset yang ditulis di dalam kode.",
    en: "Raw 3D models run to hundreds of megabytes, far too heavy for a browser. A pipeline compresses them, builds tiny versions for the globe, and renders the list images straight from their geometry. All of it runs before the build, and the results are recorded in a generated manifest — not one asset path is written inside the code.",
  },

  mapKicker: { id: "Lima benua", en: "Five continents" },
  mapTitle: { id: "Mulai dari satu tempat.", en: "Begin with one place." },
  mapLead: {
    id: "Penanda di peta ini duduk pada rata-rata koordinat situs yang benar-benar ada di tiap benua — jadi ia menggambarkan koleksi ini, bukan dunia. Sentuh sebuah kartu dan garisnya menunjukkan letaknya.",
    en: "Each marker sits at the mean coordinate of the sites actually present on that continent — so it describes this collection, not the world. Touch a card and the line shows where it lies.",
  },
  mapSites: { id: "Situs", en: "Sites" },
} satisfies Record<string, LocalizedText>;
