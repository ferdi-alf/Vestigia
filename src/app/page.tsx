import { HERITAGE, featuredHeritage } from "@/data/registry";
import { ConceptFrame } from "@/concepts/shell/concept-frame";
import { Dive } from "@/concepts/a/dive";
import { Relic } from "@/concepts/a/relic";
import { Explorer } from "@/concepts/a/explorer";
import { Guide } from "@/concepts/a/guide";
import { Gateway } from "@/concepts/a/gateway";
import { Closing } from "@/concepts/a/closing";

/**
 * Landing — konsep A.
 *
 * Server component. Registry dibaca SATU kali, lalu tiap section menerima
 * proyeksi yang sudah jadi — sehingga tidak ada dua tempat yang bisa berbeda
 * pendapat tentang apa yang ada di koleksi, dan peramban tidak pernah menerima
 * record lengkap untuk section yang hanya butuh nama dan koordinat.
 *
 * **Irama halamannya disengaja:**
 *
 *     Dive         adegan · panggung sinematik, tiga medium, satu progres
 *     Penjelajah   informasi · peta dan daftar, dunia menyala kembali
 *     Pemandu      bukti · AI yang menjawab hanya dari data, dan berhenti
 *     Pintu Masuk  tindakan · lima pintu dan garis yang menunjukkan letaknya
 *     Penutup      adegan · dunia mundur jadi satu cakram
 *
 * Satu adegan, dua blok yang bisa diperiksa, satu tindakan, satu adegan
 * penutup. Kepadatan ditaruh SETELAH klimaks, bukan di dalamnya — itu yang
 * membuat penyelaman tetap lega sementara halamannya tidak kosong.
 *
 * **Keempat anchor navbar kini punya tujuan yang nyata**: `#peta` di
 * Penjelajah, `#pemandu` di Pemandu, `#tujuan` di Pintu Masuk, `#tentang` di
 * Penutup. Sebelumnya keempatnya menunjuk ke ketiadaan.
 *
 * Halaman ini tetap utuh dengan nol GLB, nol gambar, dan nol video.
 */
export default function HomePage() {
  const heritage = featuredHeritage();

  const points = HERITAGE.map((h) => ({
    slug: h.slug,
    name: h.name,
    country: h.country,
    continent: h.continent,
    lat: h.coordinates[0],
    lon: h.coordinates[1],
  }));

  const marks = points.map((p) => ({
    slug: p.slug,
    lat: p.lat,
    lon: p.lon,
    continent: p.continent,
  }));

  /* Proyeksi sempit untuk Bandingkan: peramban tidak pernah menerima lima
     belas record lengkap hanya supaya sebuah pemilih punya daftar nama. */
  const all = HERITAGE.map((h) => ({ slug: h.slug, name: h.name, country: h.country }));

  return (
    <ConceptFrame concept="a">
      {heritage ? <Dive heritage={heritage} marks={marks} /> : null}
      {heritage ? <Relic heritage={heritage} /> : null}
      <Explorer points={points} />
      {heritage ? <Guide heritage={heritage} all={all} /> : null}
      <Gateway points={points} />
      <Closing points={points} />
    </ConceptFrame>
  );
}
