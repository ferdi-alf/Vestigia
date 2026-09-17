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
 * `pointer-events-none` wajib: kanvas menutupi seluruh layar, dan tanpa itu ia
 * menelan klik pada tombol "ulangi kuis" di bawahnya.
 *
 * ---
 *
 * **`fixed`, BUKAN `absolute` — dan kanvasnya tetap tinggal di dalam dialog.**
 *
 * Versi pertama memakai `absolute inset-0` di dalam panel kuis, jadi konfetinya
 * terkurung di dalam kotak dialog: dua semburan yang seharusnya datang dari
 * sudut bawah JENDELA malah datang dari sudut bawah sebuah kartu selebar 56rem.
 *
 * `fixed` memperbaikinya tanpa memindahkan komponennya keluar, dan itu
 * disengaja. Dialog ini dibuka dengan `showModal()`, artinya ia hidup di TOP
 * LAYER — di atas seluruh isi halaman, berapa pun `z-index` yang dipakai.
 * Kanvas yang dipindah ke luar dialog justru akan tertimbun DI BAWAH dialognya
 * sendiri. Dibiarkan di dalam, ia ikut naik ke top layer; dan karena `fixed`
 * mengukur terhadap viewport, ia membentang penuh satu jendela.
 *
 * Syaratnya satu: tidak boleh ada leluhur yang membawa `transform`, `filter`,
 * atau `will-change` — ketiganya membuat elemen jadi containing block bagi
 * keturunan `fixed` dan mengurung kanvasnya kembali. Sudah diperiksa di
 * `study-dialog.tsx`: tidak ada satu pun.
 */
export function Confetti({ colors }: { colors: string[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useStillPreference();

  useEffect(() => {
    const node = canvas.current;
    if (!node || still) return;

    /* **`resize` DIMATIKAN, ukurannya diurus sendiri.**

       Dengan `resize: true`, buffer gambar kanvas ini terukur 0x0 — dua kali,
       pada jendela 1499x711 dengan CSS kanvas yang sudah benar 1499,2x711,2.
       Konsekuensinya semburannya berjalan dan partikelnya dihitung, tetapi
       tidak satu piksel pun mendarat. Menyetel `width`/`height` sendiri
       SEBELUM `create` tidak menolongnya: opsi itu menyetel ulang ukurannya
       dari pengukurannya sendiri, dan hasilnya tetap 0x0.

       Yang belum terjawab adalah kenapa pengukuran pustakanya membaca nol
       padahal kanvasnya `fixed inset-0`; itu tidak dikejar, karena jawabannya
       tidak mengubah perbaikannya. Urusan ukuran diambil alih seluruhnya:
       buffer disetel dari `innerWidth`/`innerHeight` yang tidak bergantung
       pada tata letak sama sekali, dan satu pendengar `resize` menjaganya tetap
       benar. Terukur sesudahnya: buffer 1499x711, dan konfetinya jatuh melewati
       tepi dialog ke kedua sudut bawah jendela. */
    const size = () => {
      node.width = window.innerWidth;
      node.height = window.innerHeight;
    };
    size();
    window.addEventListener("resize", size);

    const fire: ConfettiInstance = confetti.create(node, { useWorker: true });

    /* Dua semburan dari dua sudut bawah JENDELA, bukan satu dari tengah. Satu
       semburan tengah jatuh lurus seperti air mancur; dua yang saling
       menyilang mengisi layar dan terbaca sebagai perayaan.

       `origin` dalam pecahan viewport, dan sejak kanvasnya `fixed` seukuran
       jendela, x 0 dan x 1 benar-benar berarti sudut kiri dan kanan layar.

       **Angkanya dinaikkan supaya ASALNYA terbaca, bukan supaya lebih ramai.**
       Versi sebelumnya menyala dan partikelnya mendarat — terukur, buffernya
       benar dan kertasnya jatuh di seluruh lebar jendela — tetapi dilaporkan
       tidak datang dari kedua sudut bawah. Sebabnya bentuk semburannya:
       `y: 0,9` berangkat sepuluh persen di atas kaki layar, lebar kipas 62
       derajat menyebarkannya hampir mendatar, dan 48 partikel dengan kecepatan
       46 sudah kehilangan bentuk kipas sebelum mata sempat menangkap dari mana
       ia berangkat. Yang terlihat tinggal kertas yang jatuh entah dari mana.

       Sekarang keduanya berangkat dari sudut yang PERSIS — `y: 1` — dengan
       kipas yang lebih sempit, kecepatan yang lebih tinggi, dan sudut yang
       lebih tegak, sehingga dua berkas naik menyilang dari kedua sudut sebelum
       melengkung turun. Yang berubah keterbacaan asalnya. */
    const common = { particleCount: 72, spread: 52, startVelocity: 62, ticks: 220, colors };

    /* Ditunda satu bingkai supaya tata letak benar-benar selesai sebelum
       partikel pertama dihitung. */
    const frame = requestAnimationFrame(() => {
      void fire({ ...common, angle: 56, origin: { x: 0, y: 1 } });
      void fire({ ...common, angle: 124, origin: { x: 1, y: 1 } });
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", size);
      fire.reset();
    };
  }, [colors, still]);

  if (still) return null;

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] h-screen w-screen"
    />
  );
}
