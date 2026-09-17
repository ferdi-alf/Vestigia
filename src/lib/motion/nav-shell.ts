"use client";

import { EASE, gsap } from "./use-scroll-scene";

/**
 * Satu-satunya penulis `transform` navbar landing.
 *
 * ---
 *
 * **Kenapa berkas ini ada.**
 *
 * Navbar dipegang dua sistem yang tidak saling kenal: film penyelaman
 * mengangkatnya pergi di awal, dan rangkaian serah terima mengembalikannya saat
 * "Yang Hilang" dibuka. Keduanya sempat menulis `transform` yang sama, dan §6
 * melarang itu dengan alasan yang terbukti terukur di peramban.
 *
 * Gejalanya: menggulir balik dari bawah halaman ke hero meninggalkan navbar
 * TERSEMBUNYI. Sebabnya perlombaan waktu, bukan logika. Film ter-scrub, jadi ia
 * berhenti menulis begitu gulir berhenti; rangkaian serah terima berbasis
 * waktu, jadi ia masih menulis satu setengah detik sesudahnya. Pengguna sampai
 * di hero, film menulis "terlihat" pada bingkai terakhirnya, lalu pembongkaran
 * selesai dan menulis "tersembunyi" di atasnya.
 *
 * **Menggantinya dengan sepasang perintah "sembunyikan"/"tampilkan" TIDAK
 * cukup, dan itu sudah dicoba lalu diukur.** Perintah punya urutan, dan urutan
 * kedatangannya justru yang salah: pembongkaran mengirim "sembunyikan" pada
 * detik ketiga, sesudah film mengirim "tampilkan" pada detik kedua. Navbar
 * tetap tersembunyi di hero, dengan sebab yang berbeda.
 *
 * ---
 *
 * **Yang benar: navbar adalah FUNGSI dari dua keadaan, bukan hasil dari dua
 * perintah.**
 *
 *     diving   penyelaman sudah lewat titik teks hero mundur
 *     opened   kelompok dua sudah terbuka di atasnya
 *
 *     tersembunyi  <=>  diving DAN BUKAN opened
 *
 * Tiap sistem cuma melaporkan keadaannya sendiri, kapan pun ia berubah, dan
 * hasilnya dihitung ulang dari KEDUANYA. Urutan kedatangan berhenti jadi
 * masalah karena hasilnya tidak lagi bergantung pada urutan — pesan yang datang
 * terlambat tetap menghasilkan jawaban yang sama dengan pesan yang datang tepat
 * waktu.
 *
 * `overwrite: "auto"` menutup sisanya: tween baru membunuh tween lama pada
 * target dan properti yang sama sebelum ia mulai, jadi tidak pernah ada dua
 * gerak menuju dua tujuan berbeda pada satu elemen.
 *
 * ---
 *
 * **Keadaannya di level modul, dan itu memang tempatnya.** Ada tepat SATU
 * navbar per halaman; menaruhnya di React berarti membangun konteks yang
 * melintasi `ConceptFrame`, `HandoffProvider`, dan dua section hanya untuk
 * menyimpan dua boolean yang tidak pernah dirender.
 *
 * Konsekuensinya keduanya bertahan melewati pergantian route, jadi tiap adegan
 * WAJIB menyemai keadaannya saat dipasang — lihat `seedNav`. Simpulnya sendiri
 * dicari saat dipanggil, bukan disimpan: navbar dirender ulang tiap route
 * berganti, dan ref modul akan menunjuk simpul yang sudah dilepas.
 */

/** Sejauh mana navbar terangkat, persen tingginya sendiri. */
const LIFT = -160;

let diving = false;
let opened = false;

function apply(duration: number) {
  if (typeof document === "undefined") return;

  const node = document.querySelector<HTMLElement>("[data-nav-shell]");
  if (!node) return;

  const hidden = diving && !opened;
  gsap.to(node, {
    yPercent: hidden ? LIFT : 0,
    autoAlpha: hidden ? 0 : 1,
    duration,
    ease: EASE.enter,
    overwrite: "auto",
  });
}

/** Penyelaman sudah lewat titik teks hero mundur. */
export function setNavDiving(value: boolean, duration = 0.55) {
  diving = value;
  apply(duration);
}

/** Kelompok dua sudah terbuka di atas penyelaman. */
export function setNavOpened(value: boolean, duration = 0.55) {
  opened = value;
  apply(duration);
}

/**
 * Semai keadaan saat sebuah adegan dipasang, tanpa menganimasikan apa pun.
 *
 * Wajib dipanggil karena keadaan di atas hidup di level modul dan karena itu
 * bertahan melewati pergantian route. Tanpa ini, kembali ke landing dari
 * halaman warisan mewarisi dua boolean dari kunjungan sebelumnya, dan navbar
 * bisa berangkat dari jawaban yang sudah basi.
 *
 * Durasinya nol: ini menyetel titik berangkat, bukan gerak.
 */
export function seedNav({ diving: d, opened: o }: { diving?: boolean; opened?: boolean }) {
  if (d !== undefined) diving = d;
  if (o !== undefined) opened = o;
  apply(0);
}
