import type { Continent, LocalizedText } from "./types";
import { CONTINENTS } from "./types";

export interface ContinentInfo {
  slug: Continent;
  name: LocalizedText;
  /** satu kalimat yang memberi karakter benua, dipakai di kartu /explore */
  tagline: LocalizedText;
  /** hue OKLCH untuk aksen wayfinding per benua */
  hue: number;
}

/**
 * Metadata benua. Statis dan lengkap lima-limanya — ini bukan daftar
 * "apa yang tersedia", hanya kamus. Benua mana yang benar-benar tampil
 * ditentukan registry berdasarkan GLB yang ada.
 */
export const CONTINENT_INFO: Record<Continent, ContinentInfo> = {
  asia: {
    slug: "asia",
    name: { id: "Asia", en: "Asia" },
    tagline: {
      id: "Tempat candi, kuil, dan tembok panjang menandai peradaban tertua yang masih hidup.",
      en: "Where temples, shrines and long walls mark the oldest civilisations still living.",
    },
    hue: 35,
  },
  africa: {
    slug: "africa",
    name: { id: "Afrika", en: "Africa" },
    tagline: {
      id: "Batu yang bertahan lima ribu tahun di tepi gurun dan lembah sungai.",
      en: "Stone that has held five thousand years at the desert edge and the river valleys.",
    },
    hue: 55,
  },
  europe: {
    slug: "europe",
    name: { id: "Eropa", en: "Europe" },
    tagline: {
      id: "Reruntuhan dan katedral yang menyusun ulang gagasan tentang kota dan warga.",
      en: "Ruins and cathedrals that rebuilt the idea of the city and the citizen.",
    },
    hue: 220,
  },
  americas: {
    slug: "americas",
    name: { id: "Amerika", en: "Americas" },
    tagline: {
      id: "Kota di punggung gunung dan piramida di tengah hutan, dibangun tanpa roda.",
      en: "Cities on mountain ridges and pyramids in the forest, built without the wheel.",
    },
    hue: 145,
  },
  oceania: {
    slug: "oceania",
    name: { id: "Oseania", en: "Oceania" },
    tagline: {
      id: "Pulau-pulau terpencil yang meninggalkan pahatan raksasa menghadap laut.",
      en: "Remote islands that left colossal carvings facing the sea.",
    },
    hue: 195,
  },
};

/** Urutan tampil yang tetap, supaya navigasi tidak berpindah-pindah. */
export const CONTINENT_ORDER = CONTINENTS;

export function isContinent(value: string): value is Continent {
  return (CONTINENTS as readonly string[]).includes(value);
}
