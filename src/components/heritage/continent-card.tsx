"use client";

import Link from "next/link";
import { useRef } from "react";

/**
 * Kartu benua di `/explore`.
 *
 * Dipisah menjadi komponen klien sendiri karena satu alasan: cahaya menyapu
 * membutuhkan handler pointer, dan `explore/page.tsx` adalah Server Component
 * yang membaca registry. Memindahkan seluruh halaman ke klien hanya demi efek
 * hover berarti mengirim registry ke peramban — yang persis dihindari halaman
 * itu dengan mengirim proyeksi ramping saja.
 *
 * Perlakuannya sengaja sama persis dengan `HeritageCard`: satu bentuk kartu di
 * seluruh situs, bukan satu bentuk per halaman.
 */
export function ContinentCard({
  href,
  hue,
  name,
  tagline,
  count,
}: {
  href: string;
  hue: number;
  name: string;
  tagline: string;
  count: string;
}) {
  const card = useRef<HTMLAnchorElement>(null);

  /* Ditulis ke custom property lewat ref, bukan lewat setState — satu render
     React per piksel gerakan tetikus adalah pola yang dilarang aturan anti
     design slop. Lihat `.raking-card` di globals.css untuk mekanismenya. */
  const rake = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const el = card.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    el.style.setProperty("--lit", String(1 - x * 0.7));
  };

  const unrake = () => card.current?.style.setProperty("--lit", "0");

  return (
    <Link
      ref={card}
      href={href}
      onPointerMove={rake}
      onPointerLeave={unrake}
      onBlur={unrake}
      className="panel raking-card group flex h-full flex-col justify-between gap-6 p-6 transition-colors hover:border-line-strong"
    >
      <div>
        {/* carved-edge. Memanjang lewat `scaleX`, bukan `width`: properti layout
            yang dianimasikan memaksa perhitungan tata letak ulang tiap frame. */}
        <span
          aria-hidden="true"
          className="block h-px w-10 origin-left transition-transform duration-500 group-hover:scale-x-[1.6]"
          style={{ backgroundColor: `oklch(0.48 0.12 ${hue})` }}
        />
        <h2 className="mt-5 font-display text-3xl text-ink">{name}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{tagline}</p>
      </div>
      <p className="text-xs tracking-wide text-ink-dim">{count}</p>
    </Link>
  );
}
