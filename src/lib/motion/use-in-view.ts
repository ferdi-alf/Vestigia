"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Satu gerbang untuk "boleh bergerak" dan "boleh merender".
 *
 * Dua sinyal digabung, karena satu saja tidak cukup. IntersectionObserver tahu
 * kanvas sudah keluar layar, tetapi tidak tahu tab-nya disembunyikan; document
 * visibility tahu tab tersembunyi, tetapi tidak tahu section-nya sudah lewat
 * sepuluh layar yang lalu. Animasi dan render loop yang berjalan pada salah
 * satu keadaan itu membakar baterai tanpa menghasilkan satu piksel pun yang
 * dilihat orang.
 *
 * `entered` berbeda dari `active` dan perbedaannya penting: `entered` sekali
 * benar tidak pernah kembali salah, jadi ia dipakai untuk hal-hal mahal yang
 * cukup dilakukan sekali — memasang kanvas WebGL, mulai mengunduh GLB.
 * `active` naik-turun mengikuti keadaan, jadi ia yang memutuskan apakah loop
 * render dan animasi boleh jalan sekarang.
 */
export interface InViewState {
  /** terlihat sekarang, tab aktif — render dan animasi boleh jalan */
  active: boolean;
  /** pernah terlihat — sekali benar, selamanya benar */
  entered: boolean;
}

export interface InViewOptions {
  /**
   * Seberapa jauh sebelum benar-benar masuk layar sudah dianggap masuk.
   * Nilai bawaannya longgar supaya pemuatan sempat mulai sebelum terlihat,
   * sehingga yang dilihat pengguna adalah isi, bukan proses memuat.
   */
  rootMargin?: string;
  threshold?: number;
}

export function useInView<T extends HTMLElement>(
  { rootMargin = "240px", threshold = 0 }: InViewOptions = {},
): [React.RefObject<T | null>, InViewState] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    /* Tanpa IntersectionObserver — peramban sangat lama — lebih baik section
       dianggap selalu terlihat daripada tidak pernah tampil sama sekali.
       Dijadwalkan ke bingkai berikutnya, bukan dipanggil di sini: menulis state
       secara sinkron di dalam effect memicu render berantai, dan nilai awalnya
       tidak bisa dihitung saat render karena server selalu menjawab "tidak ada
       IntersectionObserver" dan itu akan membuat hidrasi tidak cocok. */
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => {
        setVisible(true);
        setEntered(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setEntered(true);
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return [ref, { active: visible && pageVisible, entered }];
}
