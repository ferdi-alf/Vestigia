"use client";

import { Html } from "@react-three/drei";
import type * as THREE from "three";
import type { Heritage, Locale } from "@/data/types";
import { cn } from "@/lib/cn";

/**
 * Penanda arsitektural, digambar sebagai elemen HTML yang ditambatkan ke
 * titik dunia.
 *
 * HTML dan bukan sprite: teks tetap tajam pada setiap zoom, bisa difokus dari
 * papan ketik, dan terbaca oleh pembaca layar — tiga hal yang hilang begitu
 * label dirender ke dalam kanvas.
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
            <div className="relative">
              <button
                type="button"
                onClick={() => onSelect(active ? null : hotspot.id)}
                aria-expanded={active}
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

              {active ? (
                <div
                  role="tooltip"
                  className="absolute left-1/2 top-8 w-60 -translate-x-1/2 rounded-lg border border-line-strong bg-overlay/95 p-3 text-left shadow-xl backdrop-blur-sm"
                >
                  <p className="font-display text-base leading-tight text-ink">
                    {hotspot.title[locale]}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                    {hotspot.detail[locale]}
                  </p>
                </div>
              ) : null}
            </div>
          </Html>
        );
      })}
    </>
  );
}
