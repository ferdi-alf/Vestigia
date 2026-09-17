"use client";

import { useEffect } from "react";
import { Html } from "@react-three/drei";
import type * as THREE from "three";
import type { Heritage, Locale } from "@/data/types";
import { cn } from "@/lib/cn";

/** Satu keterangan hidup pada satu waktu, jadi satu id sudah cukup. */
export const DETAIL_ID = "hotspot-detail";

/**
 * Penanda arsitektural, digambar sebagai elemen HTML yang ditambatkan ke
 * titik dunia.
 *
 * HTML dan bukan sprite: teks tetap tajam pada setiap zoom, bisa difokus dari
 * papan ketik, dan terbaca oleh pembaca layar — tiga hal yang hilang begitu
 * label dirender ke dalam kanvas.
 *
 * ---
 *
 * **KETERANGANNYA TIDAK LAGI TINGGAL DI SINI, dan itu perbaikan atas dua
 * kerusakan yang datang dari satu sebab.**
 *
 * Dulu kartu keterangan hidup di dalam `<Html>` yang sama, `absolute top-8`
 * di bawah penandanya. Akibatnya:
 *
 *   1. **Ia menutupi.** Kotak selebar 240px mengambang tepat di atas bagian
 *      object yang baru saja diminta untuk dilihat.
 *   2. **Ia tertutup.** `occlude="blending"` berlaku untuk SELURUH isi
 *      `<Html>`, bukan cuma tombolnya — jadi teksnya ikut dicampur dengan
 *      geometri di depannya dan terbaca buram atau hilang sebagian.
 *
 * Keduanya perilaku yang BENAR untuk penanda yang menempel di permukaan batu,
 * dan keduanya perilaku yang SALAH untuk teks yang harus dibaca. Karena itu
 * keduanya sekarang benda yang terpisah: penanda bernomor tetap di sini dengan
 * occlusion-nya, keterangannya pindah ke `HotspotDetail` di lapisan overlay
 * panggung — di luar ruang 3D, tidak pernah di-occlude, tidak pernah menimpa
 * subjeknya.
 */
export function HotspotMarkers({
  heritage,
  anchors,
  locale,
  activeId,
  onSelect,
  visible,
}: {
  heritage: Heritage;
  anchors: Map<string, THREE.Vector3>;
  locale: Locale;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <>
      {heritage.hotspots.map((hotspot, index) => {
        const position = anchors.get(hotspot.id);
        if (!position) return null;
        const active = activeId === hotspot.id;

        return (
          <Html
            key={hotspot.id}
            position={position}
            center
            // Penanda di sisi jauh model tersembunyi di balik geometri,
            // seperti yang diharapkan dari benda yang menempel padanya.
            occlude="blending"
            zIndexRange={[20, 0]}
          >
            <button
              type="button"
              onClick={() => onSelect(active ? null : hotspot.id)}
              aria-expanded={active}
              aria-controls={DETAIL_ID}
              aria-label={hotspot.title[locale]}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[0.65rem] font-medium transition-colors",
                active
                  ? "border-gold bg-gold text-on-gold"
                  : "border-gold/60 bg-void/90 text-gold-dim backdrop-blur-sm hover:border-gold hover:bg-gold hover:text-on-gold",
              )}
            >
              {index + 1}
            </button>
          </Html>
        );
      })}
    </>
  );
}

/**
 * Keterangan hotspot, di lapisan overlay panggung — BUKAN di dalam ruang 3D.
 *
 * Ditambatkan ke tepi bawah wadah alih-alih ke titik dunia penandanya. Itu
 * membuatnya tidak pernah menimpa bagian object yang sedang ditunjuk, dan
 * lebarnya bisa mengikuti wadah alih-alih dipatok pada satu angka piksel yang
 * kebetulan pas di satu ukuran layar.
 *
 * Nomornya diulang di kartu supaya hubungan ke penandanya tetap terbaca tanpa
 * garis penghubung — dan tanpa garis penghubung berarti tidak ada satu pun
 * elemen yang harus diukur ulang tiap kali kamera bergerak.
 */
export function HotspotDetail({
  heritage,
  locale,
  activeId,
  onClose,
  closeLabel,
}: {
  heritage: Heritage;
  locale: Locale;
  activeId: string | null;
  onClose: () => void;
  closeLabel: string;
}) {
  const index = heritage.hotspots.findIndex((h) => h.id === activeId);
  const hotspot = index >= 0 ? heritage.hotspots[index] : null;

  /* Escape menutup, di mana pun fokus berada. Panggung 3D menangkap papan ketik
     untuk mengorbit, jadi menuntut fokus ada di kartu ini akan membuat Escape
     terasa tidak berfungsi pada separuh keadaan. */
  useEffect(() => {
    if (!hotspot) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotspot, onClose]);

  if (!hotspot) return null;

  return (
    <div
      id={DETAIL_ID}
      className="fade-in pointer-events-auto absolute inset-x-3 bottom-3 z-10 max-w-md rounded-xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur-sm sm:inset-x-4 sm:bottom-4"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-gold bg-gold text-[0.65rem] font-medium text-on-gold"
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight text-ink">{hotspot.title[locale]}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            {hotspot.detail[locale]}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="-mt-1 -mr-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-ink"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
