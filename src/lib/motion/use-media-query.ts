"use client";

import { useEffect, useState } from "react";

/**
 * Satu media query sebagai nilai React.
 *
 * Saudara keempat dari `gsap.matchMedia()`, `useStillPreference`, dan
 * `useMotionTier` — dan ia ada karena ketiganya menjawab pertanyaan yang
 * berbeda dari pertanyaan ini.
 *
 * `useMotionTier` memakai ambang GERAK (768px), yang dipilih untuk memutuskan
 * seberapa berat koreografi boleh jadi. Ada keputusan lain yang mengikuti
 * ambang TATA LETAK (`lg:`, 1024px) atau bahkan ambang TINGGI layar, dan
 * memaksanya memakai ambang gerak menghasilkan cacat yang halus: di antara 768
 * dan 1024 piksel, section "Yang Hilang" menggambar garis bersiku ke kartu
 * keterangan yang pada lebar itu masih `display: none`. Kotak yang tidak
 * dirender mengembalikan rect nol, jadi ketiga garisnya berangkat dari sudut
 * kiri atas panggung. Ambang yang salah bukan soal selera.
 *
 * Nilai awalnya `false`, sengaja: itu cabang yang paling sedikit menuntut, dan
 * render pertama di server tidak pernah berpura-pura tahu ukuran layar yang
 * belum ada.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return matches;
}
