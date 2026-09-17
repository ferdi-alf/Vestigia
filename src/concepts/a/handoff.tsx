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
 * **Sengaja satu arah.** Tidak ada `unseal()`. Menggulir balik mengembalikan
 * globe lewat jalur yang sudah ada — `onLeaveBack` pada pemicu milik kelompok
 * satu sendiri — dan menambahkan jalur kedua untuk membatalkannya hanya akan
 * membuat dua sistem memperebutkan satu keadaan.
 */
interface Handoff {
  /** true setelah bidang cahaya menutup penuh. */
  sealed: boolean;
  /** Dipanggil timeline perakitan kelompok dua, tepat setelah panelnya bertemu. */
  seal: () => void;
}

const HandoffContext = createContext<Handoff>({ sealed: false, seal: () => {} });

export function HandoffProvider({ children }: { children: React.ReactNode }) {
  const [sealed, setSealed] = useState(false);
  const seal = useCallback(() => setSealed(true), []);
  const value = useMemo(() => ({ sealed, seal }), [sealed, seal]);

  return <HandoffContext.Provider value={value}>{children}</HandoffContext.Provider>;
}

export function useHandoff(): Handoff {
  return useContext(HandoffContext);
}
