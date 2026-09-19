"use client";

import { useEffect, useState } from "react";
import { MOTION_QUERIES } from "./use-scroll-scene";

export type MotionTier = "full" | "compact" | "still";

/**
 * Tingkat gerak yang berlaku, sebagai nilai React.
 *
 * SAUDARA dari `gsap.matchMedia()` di `use-scroll-scene.ts` dan dari
 * `useStillPreference`, bukan pengganti keduanya — ketiganya menjawab
 * pertanyaan yang berbeda:
 *
 * - `matchMedia` GSAP memutuskan apakah ScrollTrigger **dipasang sama sekali**.
 * - `useStillPreference` mengembalikan satu boolean untuk komponen yang hanya
 *   perlu tahu "diam atau tidak" — panggung 3D dan `frameloop`-nya.
 * - Hook ini mengembalikan **ketiga tingkatnya**, karena ada komponen yang
 *   merender POHON YANG BERBEDA di tiap tingkat, bukan sekadar menyetel prop.
 *   Garis penunjuk di `preview.tsx` begitu: siku 90 derajat di layar lebar,
 *   penunjuk lurus di ponsel, dan garis yang diam saat gerak dikurangi. Boolean
 *   tidak cukup untuk memilih di antara tiga pohon.
 *
 * Ambang breakpoint-nya dibaca dari `MOTION_QUERIES`, bukan ditulis ulang di
 * sini. Satu tempat untuk ambang berarti tidak ada kemungkinan JS dan GSAP
 * berpindah tingkat pada lebar yang berbeda.
 *
 * Nilai awalnya `still`, dan itu disengaja: itu tingkat yang paling sedikit
 * memuat apa pun. Render pertama di server dan bingkai pertama di peramban
 * tidak pernah memasang lapisan gerak untuk perangkat yang ternyata tidak
 * akan memakainya.
 */
export function useMotionTier(): MotionTier {
  const [tier, setTier] = useState<MotionTier>("still");

  useEffect(() => {
    const queries = (Object.entries(MOTION_QUERIES) as [MotionTier, string][]).map(
      ([name, query]) => [name, window.matchMedia(query)] as const,
    );

    const sync = () => {
      /* `still` diperiksa lebih dulu: preferensi gerak mengalahkan lebar layar,
         selalu. Layar lebar yang meminta gerak dikurangi tetap `still`. */
      const match = queries.find(([name]) => name === "still")?.[1];
      if (match?.matches) {
        setTier("still");
        return;
      }
      setTier(queries.find(([name, q]) => name !== "still" && q.matches)?.[0] ?? "still");
    };

    sync();
    for (const [, query] of queries) query.addEventListener("change", sync);
    return () => {
      for (const [, query] of queries) query.removeEventListener("change", sync);
    };
  }, []);

  return tier;
}
