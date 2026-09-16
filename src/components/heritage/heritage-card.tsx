"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import type { Heritage } from "@/data/types";

/**
 * Bagian dari Heritage yang benar-benar dipakai kartu ini.
 *
 * Dipersempit supaya landing bisa mengirim proyeksi ramping ke peramban alih-alih
 * lima belas record penuh dengan hotspot, lini masa, dan daftar sumbernya. Berkat
 * pengetikan struktural, `Heritage` utuh tetap memenuhi bentuk ini, jadi pemanggil
 * lama tidak berubah sama sekali.
 */
export type HeritageCardData = Pick<
  Heritage,
  | "slug"
  | "name"
  | "location"
  | "country"
  | "description"
  | "period"
  | "civilization"
  | "continent"
  | "modelPath"
>;
import { CONTINENT_INFO } from "@/data/continents";
import { withKTX2 } from "@/lib/three/ktx2";
import { useI18n } from "@/lib/i18n/client";

/* Alias di lingkup modul: ini metode statis, bukan hook, dan memanggilnya
   sebagai `useGLTF.preload` di dalam handler membingungkan aturan lint. */
const preloadModel = useGLTF.preload;

/**
 * Kartu heritage di daftar koleksi.
 *
 * Hover atau focus memulai unduhan GLB-nya. Saat klik terjadi, model sudah
 * terunduh dan terparse, jadi halaman 3D tidak membuka dengan kanvas kosong.
 * Biayanya nol kalau user tidak jadi mengklik — browser hanya menyimpan file
 * yang mungkin memang akan dipakai.
 */
export function HeritageCard({
  heritage,
  /**
   * Tingkat judul kartu. Di halaman koleksi kartu adalah isi utamanya, jadi h2.
   * Di landing ia bersarang di bawah judul section, jadi h3 — urutan heading
   * adalah peta yang dipakai pembaca layar untuk melompat, dan lima belas h2
   * berturut-turut di tengah halaman membuat peta itu bohong.
   */
  headingLevel = "h2",
}: {
  heritage: HeritageCardData;
  headingLevel?: "h2" | "h3";
}) {
  const { locale } = useI18n();
  const Heading = headingLevel;
  const accent = CONTINENT_INFO[heritage.continent].hue;
  const card = useRef<HTMLAnchorElement>(null);

  const warm = () => {
    /* Argumennya HARUS sama persis dengan yang dipakai `useGLTF` di
       heritage-model.tsx. `useLoader` menyimpan hasilnya berdasarkan path, dan
       preload yang dikonfigurasi berbeda akan mengisi cache itu dengan model
       yang teksturnya gagal — lalu halaman aslinya memakai entri rusak itu. */
    preloadModel(heritage.modelPath, "/draco/gltf/", true, withKTX2);
  };

  /**
   * Cahaya menyapu, mengikuti kedekatan pointer ke tepi kiri.
   *
   * Ditulis langsung ke custom property lewat ref. Versi reactbits-nya memanggil
   * `setState` pada setiap `mousemove`, yang berarti satu render React per
   * piksel gerakan tetikus; aturan anti design slop project ini melarang pola
   * itu, dan alasannya sama di sini seperti di handler scroll.
   *
   * `1 - x * 0.7` berarti: paling kuat di tepi kiri, tidak pernah benar-benar
   * padam di tepi kanan. Kartu yang gelap total di satu sisi terbaca rusak,
   * bukan teduh.
   */
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
      href={`/heritage/${heritage.slug}`}
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      onPointerMove={rake}
      onPointerLeave={unrake}
      onBlur={unrake}
      className="panel raking-card group flex h-full flex-col justify-between gap-6 p-6 transition-colors hover:border-line-strong"
    >
      <div>
        {/* carved-edge. Memanjang lewat `scaleX`, bukan lewat `width` —
            menganimasikan properti layout memaksa peramban menghitung ulang
            tata letak tiap frame, dan aturan anti design slop melarangnya. */}
        <span
          aria-hidden="true"
          className="block h-px w-10 origin-left transition-transform duration-500 group-hover:scale-x-[1.6]"
          style={{ backgroundColor: `oklch(0.48 0.12 ${accent})` }}
        />
        <Heading className="mt-5 font-display text-2xl leading-tight text-ink">
          {heritage.name[locale]}
        </Heading>
        <p className="mt-1 text-sm text-ink-dim">
          {heritage.location[locale]}, {heritage.country[locale]}
        </p>
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-muted">
          {heritage.description[locale]}
        </p>
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-dim">
        <div className="flex gap-1.5">
          <dt className="sr-only">Period</dt>
          <dd>{heritage.period[locale]}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="sr-only">Civilisation</dt>
          <dd>{heritage.civilization[locale]}</dd>
        </div>
      </dl>
    </Link>
  );
}
