"use client";

import { useEffect, useRef } from "react";
import { AiPanel, type AiPanelSites } from "@/concepts/shell/ai-panel";
import { useI18n } from "@/lib/i18n/client";

/**
 * Pemandu dan kuis di dalam dialog — bukan di dalam kolom.
 *
 * Alasannya soal ruang, dan ia bisa diukur: panel kanan workspace ini 330px.
 * Percakapan yang mengalir, pertanyaan kuis dengan empat pilihan, dan pemilih
 * dua situs untuk dibandingkan tidak akan pernah muat di sana tanpa berubah
 * jadi kolom sempit yang harus digulir terus-menerus. Dialog memberi ketiganya
 * lebar penuh SAAT dibutuhkan, lalu mengembalikan seluruh layar kepada object
 * 3D saat tidak.
 *
 * ---
 *
 * **`<dialog>` NATIVE, bukan div dengan overlay.** Yang didapat cuma-cuma dan
 * yang kalau ditulis tangan hampir selalu salah:
 *
 * - **Jebakan fokus.** Tab tidak bisa keluar dari dialog selagi ia terbuka.
 * - **Esc menutup**, tanpa satu baris listener pun.
 * - **Lapisan atas (`top layer`).** Ia dirender di atas SEGALANYA, tidak peduli
 *   `z-index` atau stacking context apa pun di bawahnya — dan halaman ini punya
 *   navbar `fixed` serta kanvas WebGL, dua hal yang paling sering menembus
 *   overlay buatan sendiri.
 * - **`::backdrop`** sebagai elemen sungguhan yang bisa diberi gaya.
 * - **`inert`** otomatis pada sisa halaman, jadi pembaca layar tidak
 *   menelusuri kartu di belakang dialog yang sedang terbuka.
 *
 * Nol dependency. `@base-ui/react` ada di package.json dan belum dipakai satu
 * kali pun; menariknya masuk untuk satu dialog berarti membayar bundle untuk
 * hal yang sudah ada di peramban.
 *
 * ---
 *
 * **Isinya `AiPanel` apa adanya** — komponen yang sudah ditulis lengkap tetapi
 * belum pernah dipasang di halaman mana pun. Konsekuensinya bukan kosmetik:
 * `POST /api/ai/compare` selama ini NOL UI di seluruh aplikasi sejak `/compare`
 * dihapus, dan `ComparePanel` jadi kode mati. Dialog ini yang mengembalikan
 * keduanya. Tidak ada satu pun model yang dipanggil sampai ada yang benar-benar
 * menekan sesuatu di dalamnya.
 */
export function StudyDialog({
  open,
  onClose,
  title,
  sites,
  initialTab,
}: {
  open: boolean;
  onClose: () => void;
  /** Nama situs, diteruskan terpisah: `AiPanelSites` sengaja hanya memuat
      slug dan fitur kunci, dan memperlebarnya demi satu judul berarti setiap
      pemanggil panel itu ikut membayar. */
  title: string;
  sites: AiPanelSites;
  initialTab?: "guide" | "quiz" | "compare";
}) {
  const { dict } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  /* `open` sebagai prop React tidak boleh dipasang langsung ke atribut
     `open` elemen: atribut itu membuka dialog NON-modal — tanpa jebakan
     fokus, tanpa top layer, tanpa backdrop. Hanya `showModal()` yang
     memberi ketiganya, jadi keadaannya disinkronkan lewat efek. */
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      /* `close` menembak untuk Esc DAN untuk `close()` yang dipanggil sendiri,
         jadi satu handler menutup kedua jalur dan keadaan React tidak pernah
         berbeda pendapat dengan keadaan DOM. */
      onClose={onClose}
      /* Klik pada backdrop mendarat di elemen dialog itu sendiri, bukan pada
         anaknya — itu cara membedakan "klik di luar" tanpa listener global. */
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="study-dialog-title"
      className="m-auto w-[min(56rem,92vw)] rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/45 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
        <h2 id="study-dialog-title" className="font-display text-xl leading-none text-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.nav.closeMenu}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Tingginya dibatasi supaya percakapan panjang bergulir DI DALAM dialog
          alih-alih mendorong dialognya melewati tepi layar. */}
      <div className="max-h-[70svh] overflow-y-auto p-5">
        <AiPanel sites={sites} variant="plain" initialTab={initialTab} />
      </div>
    </dialog>
  );
}
