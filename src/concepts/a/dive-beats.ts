/**
 * Mesin keadaan pembuka konsep A — satu sumber kebenaran.
 *
 * Dipakai bersama oleh panggung 3D (yang memiliki kamera dan globe) dan
 * koreografi DOM (yang memiliki teks). Keduanya bertemu hanya lewat satu kotak
 * yang berisi dua angka.
 *
 * ---
 *
 * **VIDEO DIBUANG SELURUHNYA.** Versi sebelumnya membuka dengan klip ter-scrub
 * 7,95 MB, menutupnya dengan dua panel kertas, lalu menyerahkan bingkai ke
 * globe. Pemilik project memotongnya: pembuka kini teks dan globe saja, dan
 * seluruh halaman jadi animasi tanpa satu byte video pun.
 *
 * Yang ikut hilang bersamanya dan memang tidak punya pekerjaan lagi: tirai
 * (tidak ada yang perlu disapu bersih), kerai keterbacaan (teks berdiri di atas
 * kertas sejak bingkai pertama), `videoTimeAt`, `videoOpacityAt`, dan seluruh
 * gagasan "dua medium, satu angka". Tinggal satu medium.
 *
 * ---
 *
 * **EMPAT KEADAAN, DAN SATU YANG BUKAN KEADAAN.**
 *
 *   masuk      berbasis WAKTU, saat mount — teks naik, globe memudar masuk
 *   0,00–0,10  arrive   globe utuh di kanan, penanda menyala barat ke timur
 *   0,10–0,55  turn     globe berputar seiring scroll · teks hero mundur
 *   0,55–0,85  close    globe mendekat sambil terus berputar · jembatan dibaca
 *   0,85–1,00  hand     globe naik keluar bingkai · 14 penanda padam, satu tinggal
 *
 * Animasi masuk sengaja TIDAK jadi keadaan. Ia satu-satunya gerak di section ini
 * yang tidak dipegang scroll, dan mencampurnya ke dalam progres akan membuat
 * bingkai pertama bergantung pada posisi gulir — padahal ia harus terjadi justru
 * ketika belum ada yang digulir.
 */

/**
 * Seberapa lama animasi mengejar posisi scroll, dalam detik.
 *
 * Angka yang kecil membuat progres mengejar jari nyaris seketika, dan tiap
 * sentakan roda diteruskan mentah ke rotasi globe. Pada 0,7 progresnya
 * tertinggal lebih lama dan mendarat lebih lembut.
 */
export const SCRUB = 0.7;

/** Empat keadaan, batasnya tidak tumpang tindih. */
export const STATE = {
  /** globe utuh di kanan, penanda menyala berurutan, teks terbaca */
  arrive: { from: 0.0, to: 0.1 },
  /** globe berputar seiring scroll, teks hero mundur ke atas */
  turn: { from: 0.1, to: 0.55 },
  /** globe mendekat — ini "zoom"-nya — sementara kalimat jembatan dibaca */
  close: { from: 0.55, to: 0.85 },
  /** globe naik keluar bingkai dan menyerahkan satu penanda ke section berikutnya */
  hand: { from: 0.85, to: 1.0 },
} as const;

export type StateName = keyof typeof STATE;

/**
 * Ketinggian kamera, pengali radius globe.
 *
 * 4,8 pada pembuka adalah jawaban atas "jangan terlalu besar", dan angkanya
 * diukur di peramban bukan ditebak: pada 4,0 bola mengisi 72% tinggi viewport
 * dan tepi kirinya menabrak baris kedua judul. Pada 4,8 ia sekitar 54% — masih
 * jelas subjek, tetapi kolom teks di kiri punya ruangnya sendiri.
 *
 * Turun ke 2,4 sepanjang `close`. Itu yang dibaca sebagai zoom — dan ia
 * mendekat, bukan menjauh, karena benda yang membesar terbaca sebagai pengunjung
 * yang terus bergerak sementara benda yang mengecil terbaca sebagai benda yang
 * ditinggalkan.
 */
export const ALTITUDE: readonly { at: number; value: number }[] = [
  { at: 0.0, value: 4.8 },
  { at: STATE.turn.to, value: 4.3 },
  { at: STATE.close.to, value: 2.4 },
  { at: 1.0, value: 2.3 },
];

/**
 * Titik pandang: di atas Laut Arab.
 *
 * Satu-satunya titik dari mana Afrika, Eropa, dan Asia Selatan terbaca
 * sekaligus — sehingga bingkai pertama menyebut "dunia", bukan "sebuah bola".
 */
export const VIEWPOINT = { lat: 16, lon: 52 } as const;

/**
 * Seberapa jauh globe berputar sepanjang SELURUH gulir, derajat.
 *
 * Berbasis progres, bukan waktu. Putaran berbasis waktu tidak bisa ditelusuri
 * balik: menggulir ke atas akan memutarnya maju terus, dan §6 menuntut progres
 * scroll yang dapat dibalik persis. Ini juga permintaan harfiah pemilik project —
 * "berputar seiring scroll".
 */
export const TOTAL_TURN = 165;

/** Seberapa tinggi globe naik keluar bingkai selama `hand`, satuan radius. */
export const HAND_RISE = 1.9;

/**
 * Keburaman globe pada progres 1.
 *
 * BUKAN nol, dan itu perbaikan atas keluhan yang spesifik. Panggung lengket
 * selalu punya satu tinggi layar terakhir tempat ia meluncur keluar setelah
 * progres mencapai 1 — itu struktural, bukan bisa dihapus. Kalau globe sudah
 * memudar habis di tempat sebelum itu, yang meluncur keluar adalah kertas
 * kosong, dan itulah "gap layar putih kosong yang harus di-scroll cukup banyak".
 *
 * Dengan nilai ini kepergiannya yang sebenarnya adalah panggung yang meluncur
 * naik, bukan pudar di tempat. Ruang matinya berubah jadi serah-terima.
 */
export const HAND_FADE_TO = 0.35;

/** 0 sebelum keadaan mulai, 1 setelah selesai. Linear di dalamnya. */
export function stateProgress(progress: number, name: StateName): number {
  const { from, to } = STATE[name];
  if (to <= from) return progress >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - from) / (to - from)));
}

/** Smoothstep di tiap sambungan — kecepatan linear berubah mendadak dan mata membacanya sebagai patahan. */
export function altitudeAt(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  if (t <= ALTITUDE[0].at) return ALTITUDE[0].value;

  let a = ALTITUDE[0];
  let b = ALTITUDE[ALTITUDE.length - 1];

  for (let i = 0; i < ALTITUDE.length - 1; i += 1) {
    if (t >= ALTITUDE[i].at && t <= ALTITUDE[i + 1].at) {
      a = ALTITUDE[i];
      b = ALTITUDE[i + 1];
      break;
    }
  }

  const span = b.at - a.at;
  const k = span <= 0 ? 0 : (t - a.at) / span;
  const e = k * k * (3 - 2 * k);
  return a.value + (b.value - a.value) * e;
}

/* ── Kenapa tidak ada peta keadaan kedua untuk ponsel ───────────────────
   Perjalanan yang lebih pendek di ponsel datang dari TINGGI SECTION-nya, bukan
   dari batas keadaan yang digeser. Satu peta berarti tidak ada kemungkinan dua
   pembaca berbeda pendapat tentang di mana sebuah beat dimulai. */

/**
 * Pose diam saat gerak dikurangi.
 *
 * Tepat setelah `arrive` selesai: globe sudah utuh di kanan pada ukuran
 * bacanya, kelima belas penanda sudah menyala, teks hero masih penuh, dan tidak
 * ada satu pun lapisan yang tertangkap di tengah perpindahan. Bingkai yang
 * paling menjelaskan — §10.
 */
export const STILL_PROGRESS = 0.12;
