"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type { CreateTypes as ConfettiInstance } from "canvas-confetti";
import { useStillPreference } from "@/lib/motion/use-still-preference";

/**
 * Konfeti sekali tembak, untuk akhir kuis.
 *
 * Kodenya diberikan pemilik project; yang diubah tiga hal, dan ketiganya karena
 * aturan project ini.
 *
 * **`ConfettiButton` dibuang.** Ia mengimpor `Button` dari `@/components/ui/button`,
 * dan berkas itu mengekspor `buttonClass` — sebuah fungsi kelas, bukan komponen.
 * Project ini menulis tombolnya sendiri dan tidak memakai Radix (§3), jadi
 * varian tombol itu tidak punya tempat untuk mendarat. Yang dipakai cuma
 * kanvasnya.
 *
 * **Gerak dikurangi menghentikannya sama sekali.** Konfeti adalah gerak yang
 * berjalan sendiri tanpa pemicu berkelanjutan — persis yang dilarang §10. Pada
 * mode itu kanvasnya tidak pernah dipasang dan `confetti.create` tidak pernah
 * dipanggil; skornya tetap muncul utuh, karena yang dilepas presentasinya dan
 * bukan informasinya.
 *
 * **Warnanya dari token.** Bawaan `canvas-confetti` adalah pelangi jenuh milik
 * orang lain. Di sini ia emas, perunggu, dan bara — palet yang sama dengan
 * seluruh situs.
 *
 * `pointer-events-none` wajib: kanvas menutupi seluruh panel, dan tanpa itu ia
 * menelan klik pada tombol "ulangi kuis" tepat di bawahnya.
 */
export function Confetti({ colors }: { colors: string[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useStillPreference();

  useEffect(() => {
    const node = canvas.current;
    if (!node || still) return;

    const fire: ConfettiInstance = confetti.create(node, {
      resize: true,
      useWorker: true,
    });

    /* Dua semburan dari dua sudut bawah, bukan satu dari tengah. Satu semburan
       tengah jatuh lurus seperti air mancur; dua yang saling menyilang mengisi
       bingkai dan terbaca sebagai perayaan. */
    const common = { particleCount: 34, spread: 58, startVelocity: 32, ticks: 140, colors };
    void fire({ ...common, angle: 62, origin: { x: 0, y: 0.9 } });
    void fire({ ...common, angle: 118, origin: { x: 1, y: 0.9 } });

    return () => {
      fire.reset();
    };
  }, [colors, still]);

  if (still) return null;

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
    />
  );
}
