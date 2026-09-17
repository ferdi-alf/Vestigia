"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Satu boolean yang dimiliki bersama KELOMPOK SATU dan KELOMPOK DUA: sudahkah
 * bidang cahaya menutup penuh.
 *
 *     kelompok satu   hero + globe yang di-zoom          `dive.tsx`
 *     kelompok dua    bidang cahaya + "Yang Hilang"      `relic.tsx`
 *                     dan sisa isi index sesudahnya
 *
 * ---
 *
 * **Kenapa ia butuh konteks, dan kenapa ambang gulir tidak cukup.**
 *
 * Kedua kelompok memegang kanvas WebGL-nya sendiri — globe di kelompok satu,
 * penampil warisan di kelompok dua — dan §7 memberi jatah SATU konteks per
 * halaman. Selama serah terimanya digerakkan gulir, keduanya bisa dijaga tidak
 * pernah hidup bersamaan hanya dengan dua ambang gulir yang berbeda.
 *
 * Sejak perakitan jadi berbasis WAKTU, itu runtuh. Pengguna berhenti menggulir
 * tepat di titik picu — itu memang yang diminta terjadi — lalu cahaya menutup
 * dan komposisi dirakit tanpa satu piksel gulir tambahan. Ambang gulir
 * berikutnya tidak pernah terlewati, jadi globe tidak pernah dilepas, dan
 * halaman berakhir memegang dua konteks selama pengguna diam di sana. Terukur:
 * dua.
 *
 * Yang tahu kapan bidangnya benar-benar tertutup hanyalah timeline yang
 * menutupnya, dan timeline itu hidup di kelompok dua. Jadi kelompok dua yang
 * mengumumkan, kelompok satu yang mendengarkan.
 *
 * **DUA ARAH, dan dulu tidak.**
 *
 * Versi pertama sengaja satu arah: tidak ada `unseal()`, dengan alasan bahwa
 * menggulir balik sudah dikembalikan `onEnterBack` milik kelompok satu sendiri.
 * Alasan itu salah, dan salahnya terbukti dipakai — `onEnterBack` hanya
 * membatalkan `passed`, sementara `sealed` tetap true selamanya. Globe tidak
 * pernah dipasang kembali, jadi menggulir ke atas mendarat di hero yang kosong:
 * tanpa bola, tanpa penembusan, tanpa satu pun dari adegan yang baru saja
 * dilewati.
 *
 * Sekarang keadaannya bisa dibatalkan, dan yang membatalkannya tetap SATU
 * pihak: timeline serah terima di kelompok dua, dijalankan mundur. Ia yang
 * menyegel saat playhead-nya melewati satu titik ke depan, dan ia juga yang
 * membuka saat playhead yang sama melewatinya ke belakang. Tidak ada pihak
 * kedua yang boleh memanggil keduanya.
 */
interface Handoff {
  /** true setelah bidang cahaya menutup penuh. */
  sealed: boolean;
  /**
   * Setel keadaan segel.
   *
   * Satu fungsi dengan argumen, bukan sepasang `seal()`/`unseal()`: yang
   * memanggilnya adalah satu penanda di dalam satu timeline, dan penanda itu
   * punya dua arah. Sepasang fungsi akan mengundang pemanggil kedua yang hanya
   * tahu salah satu arahnya.
   */
  setSealed: (next: boolean) => void;
}

const HandoffContext = createContext<Handoff>({ sealed: false, setSealed: () => {} });

export function HandoffProvider({ children }: { children: React.ReactNode }) {
  const [sealed, setSealedState] = useState(false);
  const setSealed = useCallback((next: boolean) => setSealedState(next), []);
  const value = useMemo(() => ({ sealed, setSealed }), [sealed, setSealed]);

  return <HandoffContext.Provider value={value}>{children}</HandoffContext.Provider>;
}

export function useHandoff(): Handoff {
  return useContext(HandoffContext);
}
