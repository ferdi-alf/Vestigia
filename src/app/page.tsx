import { HERITAGE, featuredHeritage } from "@/data/registry";
import { ConceptFrame } from "@/concepts/shell/concept-frame";
import { Dive } from "@/concepts/a/dive";
import { Relic } from "@/concepts/a/relic";
import { HandoffProvider } from "@/concepts/a/handoff";
import { World } from "@/concepts/a/world";
import { Preview } from "@/concepts/a/preview";
import { Invite } from "@/concepts/a/invite";

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
 * Halaman ini tetap utuh dengan nol GLB dan nol gambar.
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
    proxy: h.proxyPath,
  }));

  const marks = points.map((p) => ({
    slug: p.slug,
    lat: p.lat,
    lon: p.lon,
    continent: p.continent,
    proxy: p.proxy,
  }));


  return (
    <ConceptFrame concept="a" ctaHref={heritage ? `/heritage/${heritage.slug}` : undefined}>
      {/* Kelompok satu dan kelompok dua berbagi satu boolean: sudahkah bidang
          cahaya menutup. Kelompok dua yang mengumumkan, kelompok satu yang
          mendengarkan — dan tanpa itu halaman memegang dua konteks WebGL selama
          pengguna berhenti menggulir di titik serah terima. Lihat
          `handoff.tsx`. */}
      <HandoffProvider>
        {heritage ? <Dive heritage={heritage} marks={marks} /> : null}
        {heritage ? <Relic heritage={heritage} /> : null}
      </HandoffProvider>
      <World points={points} />
      {/* Pratinjau halaman warisan — tangkapan layar sungguhan di dalam bingkai
          peramban, dengan empat garis yang menunjuk isinya. Diletakkan tepat
          sebelum kartu undangan: ia memperlihatkan apa yang ditemukan di balik
          CTA itu, jadi ajakannya berdiri di atas sesuatu yang sudah dilihat. */}
      <Preview />
      {heritage ? <Invite heritage={heritage} /> : null}
    </ConceptFrame>
  );
}
