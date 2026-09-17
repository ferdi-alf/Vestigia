/**
 * Registry — satu-satunya tempat UI boleh menanyakan "heritage apa yang ada".
 *
 * Sebuah heritage masuk koleksi aktif hanya kalau DUA-DUANYA ada:
 *   1. file GLB di /3d-object  (tercatat di asset-manifest, digenerate script)
 *   2. file metadata di src/data/heritage/  (ditulis tangan)
 *
 * Punya salah satu saja tidak cukup. GLB tanpa metadata tidak bisa ditampilkan
 * karena tidak ada yang bisa diceritakan; metadata tanpa GLB tidak bisa
 * ditampilkan karena inti pengalaman ini adalah objectnya. Keduanya gagal
 * dengan diam-diam di runtime dan berisik di terminal saat sync — bukan crash.
 */
import { ASSET_MANIFEST } from "./generated/asset-manifest";
import { HERITAGE_META } from "./heritage";
import { CONTINENT_ORDER } from "./continents";
import type { Continent, Heritage, Locale } from "./types";

/** Koleksi aktif, urut per benua lalu abjad. Inilah "yang benar-benar ada". */
export const HERITAGE: readonly Heritage[] = ASSET_MANIFEST.flatMap((asset) => {
  const meta = HERITAGE_META[asset.slug];
  if (!meta) return [];
  return [
    {
      ...meta,
      continent: asset.continent,
      modelPath: asset.modelPath,
      bytes: asset.bytes,
      /* Ikut dibawa, dan `undefined` kalau `sync-heritage` belum pernah melihat
         proxy-nya. Pemanggilnya yang memutuskan jatuh ke apa — §1, nol asumsi
         asset. */
      proxyPath: asset.proxyPath,
      proxyBytes: asset.proxyBytes,
    },
  ];
});

const BY_SLUG = new Map(HERITAGE.map((h) => [h.slug, h]));

export function getHeritage(slug: string): Heritage | undefined {
  return BY_SLUG.get(slug);
}

export function heritageByContinent(continent: Continent): Heritage[] {
  return HERITAGE.filter((h) => h.continent === continent);
}

/** Hanya benua yang punya isi. Benua kosong tidak dirender di mana pun. */
export const ACTIVE_CONTINENTS: readonly Continent[] = CONTINENT_ORDER.filter((c) =>
  HERITAGE.some((h) => h.continent === c),
);

export function continentCount(continent: Continent): number {
  return HERITAGE.reduce((n, h) => n + (h.continent === continent ? 1 : 0), 0);
}

/** True kalau belum ada satu pun heritage aktif — UI menampilkan empty state. */
export const IS_COLLECTION_EMPTY = HERITAGE.length === 0;

/** Semua slug, untuk generateStaticParams. */
export function allSlugs(): string[] {
  return HERITAGE.map((h) => h.slug);
}

/**
 * Pencarian sederhana atas nama, negara, peradaban dan kata kunci.
 * Cukup untuk skala koleksi ini; tidak perlu indeks.
 */
export function searchHeritage(query: string, locale: Locale): Heritage[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...HERITAGE];
  return HERITAGE.filter((h) => {
    const haystack = [
      h.name[locale],
      h.name.en,
      h.country[locale],
      h.civilization[locale],
      h.location[locale],
      ...(h.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * Warisan paling ringan di koleksi.
 *
 * Dipakai object hero, dan alasannya murni bobot: hero berada di atas lipatan,
 * jadi apa pun yang dimuat di sana bersaing dengan cat pertama. Pilihannya
 * diturunkan dari data, bukan ditulis tangan, supaya ia tetap ringan ketika
 * koleksinya berubah — dan tetap punya isi kalau warisan yang dulu dipilih
 * dihapus.
 */
export function lightestHeritage(): Heritage | undefined {
  return HERITAGE.reduce<Heritage | undefined>(
    (best, h) => (!best || h.bytes < best.bytes ? h : best),
    undefined,
  );
}

/**
 * Warisan yang diangkat di peragaan AI.
 *
 * Borobudur kalau ada — situs Buddha terbesar di dunia, dan situs tuan rumah
 * bagi penilai lomba ini. Kalau ia tidak ada di koleksi, yang pertama diambil;
 * tidak ada section yang boleh bergantung pada satu berkas tertentu.
 */
export function featuredHeritage(preferred = "borobudur"): Heritage | undefined {
  return getHeritage(preferred) ?? HERITAGE[0];
}

/**
 * Object yang tampil di hero.
 *
 * Sengaja berbeda dari yang tampil di panggung hidup. Hero mengambil yang
 * paling ringan karena ia di atas lipatan; panggung hidup di bawah lipatan dan
 * dimuat hanya saat didekati, jadi ia boleh memakai warisan unggulan meski
 * modelnya jauh lebih berat. Keduanya juga berpasangan dengan section AI, yang
 * mengangkat warisan unggulan yang sama — sehingga bagian bawah halaman terbaca
 * sebagai satu peragaan, bukan dua peragaan yang tidak berhubungan.
 */
export function heroHeritage(): Heritage | undefined {
  return lightestHeritage();
}
