"use client";

import { FloatingNav, type NavVariant } from "./floating-nav";

/**
 * Pembungkus satu konsep.
 *
 * Ia melakukan tiga hal dan tidak lebih: memasang `data-concept` yang menukar
 * seluruh palet, melukis dasar halaman, dan memasang navbar.
 *
 * Dasar halaman WAJIB dilukis di sini. `body` memakai `bg-paper` milik situs
 * utama, dan route konsep hidup di dalam body itu — tanpa ground sendiri,
 * kertas situs utama akan terlihat di belakang palet konsep di mana pun
 * konten lebih pendek daripada layar.
 *
 * **Pemilih konsep mengambang sudah dihapus dari sini.** Ia dulu duduk di
 * pojok kanan bawah sebagai kontrol perkakas yang jelas terpisah dari desain.
 * Masalahnya justru itu: ia menumpang DI ATAS desain yang sedang dinilai, dan
 * ikut terlihat di setiap tangkapan layar. Navigasi antar konsep tidak hilang
 * bersamanya — `/concepts` masih ada sebagai halaman pemilih dengan tabel
 * perbandingan tujuh baris, dan di sana ia memang pada tempatnya.
 */
export function ConceptFrame({
  concept,
  ctaHref,
  children,
}: {
  concept: NavVariant;
  /** tujuan tombol ajakan navbar; diteruskan apa adanya ke `FloatingNav` */
  ctaHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-concept={concept} className="concept-ground relative isolate">
      <FloatingNav variant={concept} ctaHref={ctaHref} />
      {children}
    </div>
  );
}
