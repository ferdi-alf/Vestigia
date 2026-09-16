import type { LocalizedText } from "@/data/types";

/**
 * Teks konsep A.
 *
 * Disimpan di sini, bukan di `src/lib/i18n/dictionaries.ts`, supaya kamus
 * bersama tidak terkontaminasi tiga draf yang dua di antaranya akan dibuang.
 * Begitu satu konsep dipilih, teksnya pindah ke kamus dan berkas ini hilang.
 *
 * Keduanya wajib terisi. Itu bukan kesopanan — `LocalizedText` menuntutnya,
 * jadi kunci yang lupa diterjemahkan gagal saat build alih-alih muncul sebagai
 * teks kosong di layar.
 */
export const A_COPY = {
  heroKicker: {
    id: "Lima benua · lima belas situs",
    en: "Five continents · fifteen sites",
  },
  heroTitle: {
    id: "Setiap titik di sini pernah dibangun seseorang.",
    en: "Every point here was built by someone.",
  },
  heroLead: {
    id: "Lima belas warisan dunia, berdiri sebagai object tiga dimensi yang sungguhan. Gulir untuk turun ke salah satunya.",
    en: "Fifteen world heritage sites, standing as genuine three-dimensional objects. Scroll to descend into one of them.",
  },
  scrollHint: { id: "Gulir untuk turun", en: "Scroll to descend" },

  /* Chip kepadatan di hero. Ketiganya membawa satu fakta yang dibaca dari
     koleksi — jumlah situs dan jumlah benua dihitung dari registry, bukan
     ditulis tangan di sini. Label saja yang tinggal di berkas ini. */
  chipSites: { id: "Situs", en: "Sites" },
  chipContinents: { id: "Benua", en: "Continents" },
  chipFormat: { id: "Format", en: "Format" },
  chipFormatValue: { id: "Model 3D + data", en: "3D model + data" },

  /* Kalimat jembatan. Ia menggambarkan apa yang BENAR-BENAR sedang terjadi di
     layar — mendekat memang menghilangkan yang lain dari pandangan — jadi ia
     tidak mengklaim apa pun tentang laju kerusakan warisan, yang memang tidak
     bisa dipertanggungjawabkan tanpa sumber. */
  bridgeLine: {
    id: "Mendekati satu berarti kehilangan yang lain dari pandangan.",
    en: "To come close to one is to lose sight of the others.",
  },

  lossKicker: { id: "Yang hilang", en: "What is lost" },
  lossTitle: {
    id: "Sebuah situs tidak hilang sekaligus.",
    en: "A site does not disappear all at once.",
  },
  lossBody: {
    id: "Ia hilang sedikit demi sedikit — satu relief terkikis, satu atap runtuh, satu lapisan warna memudar sampai polanya tidak lagi terbaca. Tidak ada satu hari pun yang bisa ditunjuk sebagai hari kehilangannya.",
    en: "It goes a little at a time — one relief scoured away, one roof fallen in, one layer of colour faded until the pattern no longer reads. There is never a single day you can point to as the day it was lost.",
  },
  lossClose: {
    id: "Yang paling sering hilang lebih dulu bukan batunya, melainkan alasannya.",
    en: "What usually goes first is not the stone but the reason.",
  },
  coordinateLabel: { id: "Koordinat", en: "Coordinates" },

  explorerKicker: { id: "Penjelajah", en: "The explorer" },
  explorerTitle: {
    id: "Dan lima belas titik itu masih menyala.",
    en: "And those fifteen points are still lit.",
  },
  explorerLead: {
    id: "Setiap titik adalah warisan yang benar-benar ada di koleksi ini, lengkap dengan model 3D dan datanya. Tidak ada titik yang menandai sesuatu yang belum siap.",
    en: "Every point is a site that genuinely exists in this collection, with both a 3D model and its data. No point marks something that is not ready.",
  },

  /* ── Pemandu Budaya ────────────────────────────────────────────────── */
  guideKicker: { id: "Pemandu budaya", en: "Cultural guide" },
  guideTitle: {
    id: "Tanyakan, lalu periksa jawabannya.",
    en: "Ask it, then check the answer.",
  },
  guideLead: {
    id: "Pemandu ini menjawab hanya dari berkas data situsnya sendiri, dan mengatakan tidak tahu ketika datanya habis. Pertanyaan di luar cakupan sengaja tidak dijawab — itu yang membedakan menjawab dari mengarang.",
    en: "This guide answers only from the site's own data file, and says it does not know when the data runs out. Questions outside its scope are deliberately left unanswered — that is what separates answering from inventing.",
  },

  /* ── Pintu Masuk ─────────────────────────────────────────────────────── */
  gatewayKicker: { id: "Pintu masuk", en: "Ways in" },
  gatewayTitle: { id: "Mulai dari satu tempat.", en: "Begin with one place." },
  gatewayLead: {
    id: "Lima benua, dan di setiap kartu tertulis berapa warisan yang benar-benar ada di dalamnya. Arahkan pointer ke salah satunya untuk melihat letaknya di peta.",
    en: "Five continents, and each card states how many sites genuinely sit inside it. Point at one to see where it falls on the map.",
  },
  gatewaySites: { id: "situs", en: "sites" },

  closeTitle: { id: "Mulai dari satu tempat.", en: "Begin with one place." },
  closeLead: {
    id: "Pilih satu benua, lalu masuk ke dalam objectnya.",
    en: "Choose a continent, then step inside the object.",
  },
  closeCta: { id: "Jelajahi Warisan Dunia", en: "Explore World Heritage" },
} satisfies Record<string, LocalizedText>;
