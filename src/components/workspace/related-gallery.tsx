"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LocalizedText, Locale } from "@/data/types";

export interface RelatedSlot {
  /** nomor slot, 1..5 */
  n: number;
  /** path gambar, atau null kalau slotnya belum terisi */
  src: string | null;
}

const EMPTY: LocalizedText = { id: "Belum ada gambar", en: "No image yet" };
const OPEN: LocalizedText = { id: "Buka gambar", en: "Open image" };
const CLOSE: LocalizedText = { id: "Tutup", en: "Close" };
const PREV: LocalizedText = { id: "Gambar sebelumnya", en: "Previous image" };
const NEXT: LocalizedText = { id: "Gambar berikutnya", en: "Next image" };

/**
 * Lima bingkai pendamping, dan gambar besarnya.
 *
 * **Yang client cuma bagian ini.** `RelatedStrip` tetap server component dan
 * tetap yang membaca manifest; yang menyeberang ke peramban hanya lima path
 * yang sudah diselesaikan. Menaikkan seluruh komponennya jadi client akan
 * mengirim `RELATED_MANIFEST` — tujuh puluh lima entri untuk lima belas situs —
 * ke setiap pengunjung satu halaman warisan.
 *
 * ---
 *
 * **`<dialog>` NATIVE, pola yang sama dengan `study-dialog.tsx`.** Jebakan
 * fokus, Esc, top layer, dan `::backdrop` semuanya datang cuma-cuma dan
 * semuanya hal yang hampir selalu salah kalau ditulis tangan. Nol dependency:
 * tidak ada pustaka lightbox yang ditarik untuk sesuatu yang sudah ada di
 * peramban.
 *
 * `showModal()`, bukan atribut `open` — atribut itu membuka dialog NON-modal,
 * tanpa ketiganya.
 *
 * ---
 *
 * **Slot kosong tetap `<div>`, bukan tombol yang dimatikan.** Sebuah kontrol
 * yang tidak melakukan apa-apa tetap menahan fokus papan ketik dan tetap
 * diumumkan pembaca layar sebagai sesuatu yang bisa ditekan. Yang kosong di
 * sini bukan kontrol yang rusak melainkan tempat yang memang disediakan, dan ia
 * dirender sebagai itu.
 *
 * Panah kiri/kanan berpindah gambar, dan hanya di antara slot yang BENAR-BENAR
 * terisi — melompat ke bingkai kosong dari dalam dialog berarti dialog yang
 * menampilkan ketiadaan.
 */
export function RelatedGallery({
  slots,
  name,
  locale,
}: {
  slots: RelatedSlot[];
  name: string;
  locale: Locale;
}) {
  const [active, setActive] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  /* Bingkai yang membuka dialog, supaya fokus bisa pulang ke tempat asalnya.
     Tanpa ini papan ketik mendarat kembali di awal dokumen setiap kali sebuah
     gambar ditutup. */
  const triggers = useRef<Record<number, HTMLButtonElement | null>>({});
  const opener = useRef<number | null>(null);

  const filled = slots.filter((slot) => slot.src !== null);
  const current = active === null ? null : (slots.find((slot) => slot.n === active) ?? null);

  const open = useCallback((n: number) => {
    opener.current = n;
    setActive(n);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setActive((previous) => {
        if (previous === null || filled.length === 0) return previous;
        const index = filled.findIndex((slot) => slot.n === previous);
        if (index < 0) return previous;
        const next = (index + delta + filled.length) % filled.length;
        return filled[next].n;
      });
    },
    [filled],
  );

  /* Keadaan React dan keadaan DOM disinkronkan di satu tempat. Membuka dialog
     dari dua jalur yang berbeda adalah cara paling cepat membuat keduanya
     berbeda pendapat.

     **Fokus dipulangkan DI SINI, sesudah `close()`, dan urutannya menentukan.**
     Percobaan pertama memindahkan fokus di dalam handler penutup — sebelum
     dialognya benar-benar tertutup — dan terukur tidak berhasil: menutup
     `<dialog>` modal mengembalikan fokus sendiri ke elemen yang memegangnya
     sebelum `showModal()`, jadi peramban menimpa apa pun yang ditulis lebih
     dulu. Sesudah `close()`, tidak ada lagi yang menimpanya. */
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;

    if (active !== null && !node.open) node.showModal();
    if (active !== null) return;

    if (node.open) node.close();

    const back = opener.current;
    opener.current = null;
    if (back !== null) triggers.current[back]?.focus();
  }, [active]);

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step]);

  /* Cuma melepas keadaannya; penutupan DOM dan pemulangan fokus milik efek di
     atas. Dua tempat yang sama-sama menutup adalah dua tempat yang bisa
     berbeda pendapat tentang apakah ia sudah tertutup. */
  const dismiss = useCallback(() => setActive(null), []);

  return (
    <>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map(({ n, src }) => (
          <li key={n} className="relative aspect-[4/3]">
            {src ? (
              <button
                type="button"
                ref={(node) => {
                  triggers.current[n] = node;
                }}
                onClick={() => open(n)}
                aria-label={`${OPEN[locale]} — ${name} ${n}`}
                className="group relative block h-full w-full cursor-zoom-in overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Image
                  src={src}
                  /* Teks alternatif yang MENYEBUTKAN sesuatu tanpa mengklaim
                     apa pun: nama situs plus nomor urut. Mendeskripsikan isinya
                     berarti mengarang — berkasnya foto yang tidak pernah dilihat
                     siapa pun yang menulis baris ini. */
                  alt={`${name} — ${n}`}
                  fill
                  sizes="(min-width:1024px) 18vw, (min-width:640px) 30vw, 45vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-line bg-surface">
                <span className="font-mono text-[0.68rem] tabular-nums text-ink-dim">
                  {String(n).padStart(2, "0")}
                </span>
                <span className="text-[0.6rem] text-ink-dim/80">{EMPTY[locale]}</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        /* `close` menembak untuk Esc DAN untuk `close()` yang dipanggil sendiri,
           jadi satu handler menutup kedua jalur. */
        onClose={dismiss}
        /* Klik pada backdrop mendarat di elemen dialog itu sendiri, bukan pada
           anaknya — itu cara membedakan "klik di luar" tanpa listener global. */
        onClick={(event) => {
          if (event.target === dialogRef.current) dismiss();
        }}
        aria-label={`${name} — ${active ?? ""}`}
        className="m-auto w-[min(72rem,94vw)] rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
          <p className="min-w-0 truncate font-display text-lg leading-none text-ink">{name}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="mr-1 font-mono text-[0.68rem] tabular-nums text-ink-dim">
              {String(active ?? 0).padStart(2, "0")} / {String(slots.length).padStart(2, "0")}
            </span>
            <Arrow label={PREV[locale]} onClick={() => step(-1)} disabled={filled.length < 2} back />
            <Arrow label={NEXT[locale]} onClick={() => step(1)} disabled={filled.length < 2} />
            <button
              type="button"
              onClick={dismiss}
              aria-label={CLOSE[locale]}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Panggung beraspek TETAP dengan `object-contain`.

            Kelima gambar tidak seragam bentuknya — ada yang lanskap lebar, ada
            yang tegak. Membiarkan kotaknya mengikuti tiap gambar membuat
            dialognya melompat-lompat ukuran setiap kali panah ditekan; panggung
            tetap membuat yang berpindah cuma gambarnya. */}
        {current?.src ? (
          <div className="relative h-[68svh] w-full bg-void/40">
            <Image
              src={current.src}
              alt={`${name} — ${current.n}`}
              fill
              sizes="(min-width:1024px) 72rem, 94vw"
              className="object-contain"
              priority
            />
          </div>
        ) : null}
      </dialog>
    </>
  );
}

function Arrow({
  label,
  onClick,
  disabled,
  back = false,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  back?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" aria-hidden="true">
        <path
          d={back ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
