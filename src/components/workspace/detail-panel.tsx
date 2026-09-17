"use client";

import { useState } from "react";
import type { Heritage } from "@/data/types";
import type { AiPanelSites } from "@/concepts/shell/ai-panel";
import { CONTINENT_INFO } from "@/data/continents";
import { useI18n } from "@/lib/i18n/client";
import { StudyDialog } from "./study-dialog";

/**
 * Panel kanan — ringkasan yang dibaca, dan tiga pintu ke yang dijawab.
 *
 * Pembagiannya sederhana dan disengaja: **apa yang sudah diketahui** dirender
 * di sini sebagai teks diam, **apa yang harus ditanyakan** hidup di balik
 * tombol. Panel 330px sanggup membawa ringkasan, koordinat, fitur kunci, dan
 * sumber; ia tidak akan pernah sanggup membawa percakapan yang mengalir.
 *
 * Seluruh isinya dibaca dari berkas data warisan — `significance`,
 * `keyFeatures`, `sources`, `coordinates`. Tidak satu kalimat pun ditulis di
 * berkas ini tentang situs mana pun.
 *
 * **Tiga tombol, satu dialog.** Masing-masing membuka dialog pada tabnya
 * sendiri, karena tombol "Kuis" yang membuka Pemandu adalah tombol yang
 * berbohong. Dialognya sendiri dipasang sekali; ia tidak dirender ulang per
 * tombol.
 */
export function DetailPanel({ heritage, all }: { heritage: Heritage; all: AiPanelSites["all"] }) {
  const { locale, dict } = useI18n();
  const [tab, setTab] = useState<"guide" | "quiz" | "compare" | null>(null);

  const [lat, lon] = heritage.coordinates;
  const coordinate = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}  ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`;
  const continent = CONTINENT_INFO[heritage.continent];

  const sites: AiPanelSites = {
    featured: { slug: heritage.slug, keyFeatures: heritage.keyFeatures },
    all,
  };

  const doors: { id: "guide" | "quiz" | "compare"; label: string }[] = [
    { id: "guide", label: dict.ai.guide },
    { id: "quiz", label: dict.ai.quiz },
    /* Bandingkan butuh dua situs. Dengan satu atau nol, pintunya tidak
       ditampilkan sama sekali — lebih jujur daripada tombol yang membuka
       pemilih yang tidak bisa dipakai. */
    ...(all.length >= 2 ? [{ id: "compare" as const, label: dict.ai.compare }] : []),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <p className="kicker">{continent.name[locale]}</p>
        <h1 className="mt-2 font-display text-3xl leading-[1.08] text-ink">
          {heritage.name[locale]}
        </h1>
        <p className="mt-2 text-xs text-ink-dim">
          {heritage.location[locale]}, {heritage.country[locale]}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-4">
          <Row label={dict.heritage.period} value={heritage.period[locale]} />
          <Row label={dict.heritage.civilization} value={heritage.civilization[locale]} />
          <Row label={dict.heritage.coordinates} value={coordinate} mono />
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-ink-muted">
          {heritage.description[locale]}
        </p>
        <p className="mt-4 border-l border-gold-dim pl-4 text-sm leading-relaxed text-ink-soft">
          {heritage.significance[locale]}
        </p>

        {heritage.keyFeatures.length > 0 ? (
          <>
            <p className="mt-7 text-[0.62rem] tracking-[0.16em] text-ink-dim uppercase">
              {dict.heritage.keyFeatures}
            </p>
            <ul className="mt-3 space-y-3">
              {heritage.keyFeatures.map((feature) => (
                <li key={feature.title[locale]}>
                  <p className="font-display text-base leading-tight text-ink">
                    {feature.title[locale]}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    {feature.body[locale]}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {heritage.sources.length > 0 ? (
          <>
            <p className="mt-7 text-[0.62rem] tracking-[0.16em] text-ink-dim uppercase">
              {dict.heritage.sources}
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {heritage.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs text-ink-muted underline-offset-4 transition-colors hover:text-gold-dim hover:underline"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {/* Pintu ke yang dijawab. Ditambatkan di bawah dan tidak ikut bergulir
          bersama ringkasan — kalau ia ikut hanyut, pengunjung yang membaca
          sampai bawah kehilangan satu-satunya jalan ke bagian AI. */}
      <div className="shrink-0 border-t border-line px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          {doors.map((door, index) => (
            <button
              key={door.id}
              type="button"
              onClick={() => setTab(door.id)}
              className={`flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                index === 0
                  ? "border-transparent bg-gold text-on-gold hover:bg-gold-soft"
                  : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
              } ${doors.length === 3 && index === 2 ? "col-span-2" : ""}`}
            >
              {door.label}
            </button>
          ))}
        </div>
      </div>

      <StudyDialog
        open={tab !== null}
        onClose={() => setTab(null)}
        title={heritage.name[locale]}
        sites={sites}
        tab={tab}
      />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[0.58rem] tracking-[0.16em] text-ink-dim uppercase">{label}</dt>
      <dd className={`mt-1 text-xs leading-tight text-ink-soft ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
