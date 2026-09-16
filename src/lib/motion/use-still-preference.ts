"use client";

import { useEffect, useState } from "react";

/**
 * Apakah pengguna meminta gerak dikurangi.
 *
 * Dilacak hidup, bukan dibaca sekali saat mount: preferensinya bisa berubah
 * selagi halaman terbuka, dan §10 menuntut perubahan itu direspons. Pengguna
 * yang menyalakan "kurangi gerak" di tengah kunjungan tidak boleh harus memuat
 * ulang halaman untuk mendapatkannya.
 *
 * Ini SAUDARA dari `gsap.matchMedia()` di `use-scroll-scene.ts`, bukan
 * penggantinya, dan keduanya dibutuhkan karena menjawab pertanyaan yang
 * berbeda. matchMedia GSAP memutuskan apakah ScrollTrigger dipasang sama
 * sekali; hook ini memutuskan apa yang dikirim React sebagai prop — putaran
 * diam panggung 3D, dan `frameloop` kanvasnya. Media query CSS tidak bisa
 * melakukan keduanya: ia tidak bisa menghentikan loop render WebGL.
 */
export function useStillPreference(): boolean {
  const [still, setStill] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return still;
}
