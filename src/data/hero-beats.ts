/**
 * Satu sumber kebenaran untuk film hero: pose kamera dan susunan beat.
 *
 * Dipakai bersama `hero-stage.tsx` (yang menerbangkan kamera) dan
 * `hero-film.tsx` (yang menggerakkan teks dan lapisannya). Mengubah angka di
 * sini mengubah keduanya sekaligus — itu seluruh alasan berkas ini ada.
 *
 * Timeline dinormalkan ke durasi 1 lalu di-scrub, jadi setiap `at` di bawah
 * adalah posisi pada timeline itu, bukan detik.
 */

/**
 * Seberapa lama animasi mengejar posisi scroll, dalam detik.
 *
 * Bukan `true` (tanpa pelicin sama sekali): pada tetikus yang scroll-nya
 * bertingkat, setiap klik roda akan terbaca sebagai lompatan alih-alih gerakan.
 * Tidak juga besar seperti 0,8 — selisih itu terasa sebagai gerakan yang masih
 * berjalan beberapa ratus milidetik setelah jari berhenti, dan itu terbaca
 * sebagai lag, bukan sebagai halus.
 */
export const SCRUB = 0.3;

/**
 * Pose kamera, dalam koordinat bola mengelilingi model yang sudah dinormalkan.
 *
 * `distance` adalah pengali terhadap radius model, jadi angkanya tetap benar
 * untuk object mana pun — piramida yang lebar dan menara yang ramping sama-sama
 * terbingkai dengan benar tanpa disetel ulang.
 *
 * `targetY` adalah fraksi tinggi model untuk titik yang dipandang kamera.
 * Menaikkannya melewati 1 berarti kamera memandang ke atas puncak, dan itulah
 * yang membuat model jatuh keluar dari bawah bingkai di akhir film.
 */
export interface CameraPose {
  /** posisi pada timeline, 0..1 */
  at: number;
  /** derajat, 0 = depan, positif memutar ke kanan */
  azimuth: number;
  /** derajat di atas horizon */
  elevation: number;
  /** pengali radius model */
  distance: number;
  /** fraksi tinggi model */
  targetY: number;
}

/**
 * Enam pose, dan jarak antar keduanya yang menentukan rasanya.
 *
 * Bukan gerak lurus dari jauh ke dekat. Ia membuka lebar, mendorong masuk cepat,
 * **menahan** sebentar di dekat permukaan batu — itu bagian yang harus terbaca —
 * lalu terangkat melewati puncak sampai object turun keluar bingkai. Kamera
 * tidak pernah menembus geometri, jadi tidak ada frame yang isinya bagian dalam
 * mesh yang memang tidak pernah dimodelkan.
 */
export const CAMERA: readonly CameraPose[] = [
  { at: 0.0, azimuth: -32, elevation: 18, distance: 2.9, targetY: 0.45 },
  { at: 0.14, azimuth: -26, elevation: 17, distance: 2.7, targetY: 0.45 },
  { at: 0.34, azimuth: -8, elevation: 11, distance: 1.5, targetY: 0.52 },
  { at: 0.52, azimuth: 8, elevation: 5, distance: 0.9, targetY: 0.78 },
  { at: 0.72, azimuth: 20, elevation: 22, distance: 1.0, targetY: 1.25 },
  { at: 1.0, azimuth: 28, elevation: 32, distance: 1.25, targetY: 1.7 },
];

/**
 * Beat desktop. Sengaja tumpang tindih: kamera sudah mulai mendorong masuk
 * sebelum judul selesai mundur, karena potongan yang rapi antar beat justru
 * terbaca sebagai daftar langkah, bukan sebagai satu gerakan.
 */
export const BEAT = {
  orbit: { at: 0.0, dur: 0.18 },
  recede: { at: 0.12, dur: 0.16 },
  approach: { at: 0.22, dur: 0.26 },
  enter: { at: 0.44, dur: 0.22 },
  dissolve: { at: 0.62, dur: 0.22 },
  land: { at: 0.8, dur: 0.2 },
} as const;

/**
 * Peta beat mobile, **berbeda urutannya** — bukan sekadar lebih pendek.
 *
 * Di layar sempit judul menutupi object hampir seluruhnya. Menggerakkan kamera
 * lebih dulu berarti menggerakkan sesuatu di balik teks yang menutupinya, dan
 * penonton hanya melihat teks yang diam. Jadi judul pergi lebih dulu, baru
 * kameranya berangkat.
 */
export const BEAT_MOBILE = {
  recede: { at: 0.0, dur: 0.18 },
  orbit: { at: 0.1, dur: 0.14 },
  approach: { at: 0.18, dur: 0.3 },
  enter: { at: 0.46, dur: 0.22 },
  dissolve: { at: 0.66, dur: 0.2 },
  land: { at: 0.84, dur: 0.16 },
} as const;

/**
 * Pose yang dipakai saat gerak dikurangi.
 *
 * Bukan pose pertama. Yang dipilih adalah bingkai yang paling banyak
 * menjelaskan — cukup dekat untuk memperlihatkan bahwa ini object nyata dengan
 * permukaan, cukup jauh untuk memperlihatkan bentuk keseluruhannya.
 */
export const STILL_POSE: CameraPose = CAMERA[2];

/** Interpolasi linear antar pose pada progres 0..1. */
export function poseAt(progress: number): CameraPose {
  const t = Math.min(1, Math.max(0, progress));
  let a = CAMERA[0];
  let b = CAMERA[CAMERA.length - 1];

  for (let i = 0; i < CAMERA.length - 1; i += 1) {
    if (t >= CAMERA[i].at && t <= CAMERA[i + 1].at) {
      a = CAMERA[i];
      b = CAMERA[i + 1];
      break;
    }
  }

  const span = b.at - a.at;
  const k = span <= 0 ? 0 : (t - a.at) / span;
  /* Smoothstep, bukan linear. Pada sambungan antar pose, kecepatan linear
     berubah mendadak dan mata membacanya sebagai patahan kecil — persis enam
     kali sepanjang film. */
  const e = k * k * (3 - 2 * k);

  return {
    at: t,
    azimuth: a.azimuth + (b.azimuth - a.azimuth) * e,
    elevation: a.elevation + (b.elevation - a.elevation) * e,
    distance: a.distance + (b.distance - a.distance) * e,
    targetY: a.targetY + (b.targetY - a.targetY) * e,
  };
}
