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

  /* ── Dunia ────────────────────────────────────────────────────────────
     Section ini menggantikan Penjelajah, Pemandu, Pintu Masuk, dan Penutup
     sekaligus. Yang dulu butuh empat section — peta, tanya jawab, lima pintu,
     dan ajakan penutup — di sini jadi satu benda yang bisa diputar dan
     diklik. */
  worldKicker: { id: "Yang tersisa", en: "What remains" },
  worldTitle: {
    id: "Lima benua, lima belas yang bertahan.",
    en: "Five continents, fifteen that endured.",
  },
  worldLead: {
    id: "Setiap object di bola ini berdiri pada koordinat aslinya, dan setiap satunya punya model 3D yang bisa dibuka. Pilih satu benua untuk memutar dunia ke sana.",
    en: "Every object on this sphere stands at its real coordinates, and each one has a 3D model you can open. Choose a continent to turn the world toward it.",
  },
  worldAll: { id: "Semua benua", en: "All continents" },
  worldSites: { id: "situs", en: "sites" },

  /* ── Kartu undangan ──────────────────────────────────────────────────── */
  inviteTitle: { id: "Mulai dari satu tempat.", en: "Begin with one place." },
  inviteLead: {
    id: "Satu situs, satu model yang bisa diputar, dan satu pemandu yang berhenti ketika datanya habis.",
    en: "One site, one model you can turn, and one guide that stops when the data runs out.",
  },
  inviteCta: { id: "Jelajahi Warisan Dunia", en: "Explore World Heritage" },
} satisfies Record<string, LocalizedText>;
