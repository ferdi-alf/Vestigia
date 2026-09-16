/**
 * TEMPLATE metadata heritage — salin file ini saat menambah situs baru.
 *
 *   cp src/data/heritage/_template.ts src/data/heritage/borobudur.ts
 *
 * Lalu: ganti setiap nilai, samakan `slug` dengan nama file GLB di
 * /3d-object, dan daftarkan di src/data/heritage/index.ts.
 *
 * File ini diawali "_" sehingga dilewati script sync dan tidak pernah
 * dianggap sebagai situs. Ia tetap ikut type-check, jadi kalau kontrak data
 * berubah, template ini ikut gagal build — itu memang tujuannya.
 */
import type { HeritageMeta } from "../types";

export const template: HeritageMeta = {
  // Wajib identik dengan nama file GLB tanpa ekstensi.
  slug: "template",

  name: { id: "Nama Situs", en: "Site Name" },
  country: { id: "Negara", en: "Country" },
  location: { id: "Kota, Provinsi", en: "City, Region" },

  // [lintang, bujur] — dipakai peta persebaran.
  coordinates: [0, 0],

  period: { id: "abad ke-9", en: "9th century" },
  civilization: { id: "Peradaban", en: "Civilisation" },
  category: "temple",

  description: {
    id: "Dua sampai tiga kalimat: apa bangunan ini, di mana, dan apa yang langsung terlihat.",
    en: "Two or three sentences: what this is, where it stands, and what strikes you first.",
  },

  significance: {
    id: "Kenapa situs ini penting — bukan pengulangan deskripsi, melainkan apa yang membuatnya berarti bagi orang di luar tempatnya.",
    en: "Why the site matters — not a restatement of the description, but what makes it meaningful beyond its own place.",
  },

  keyFeatures: [
    {
      title: { id: "Fitur pertama", en: "First feature" },
      body: {
        id: "Apa fitur ini, bagaimana ia dibangun, dan untuk apa ia dipakai.",
        en: "What the feature is, how it was built, and what it was for.",
      },
    },
  ],

  /* 3–5 hotspot sudah cukup. Lebih dari itu, pin saling menumpuk di layar
     kecil dan tidak ada yang terbaca. `anchor` hanya mengarahkan; `surface`
     yang menentukan pin mendarat di mana. */
  hotspots: [
    {
      id: "fitur-utama",
      title: { id: "Judul penanda", en: "Marker title" },
      summary: { id: "Satu baris saat hover.", en: "One line on hover." },
      detail: {
        id: "Penjelasan penuh saat penanda dibuka. Dua sampai empat kalimat.",
        en: "The full explanation when the marker opens. Two to four sentences.",
      },
      // x dan z: fraksi melintasi footprint. y: fraksi tinggi. Semua 0..1.
      anchor: [0.5, 0.8, 0.5],
      surface: "top",
    },
  ],

  timeline: [
    { year: "c. 800", event: { id: "Peristiwa.", en: "What happened." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Batu andesit", en: "Andesite stone" } },
  ],

  /* Sumber nyata. Dipakai di halaman situs DAN disuntikkan ke konteks AI —
     jadi jangan pernah isi dengan URL yang tidak diverifikasi. */
  sources: [
    { title: "UNESCO World Heritage Centre", url: "https://whc.unesco.org/" },
  ],

  keywords: ["template"],
};
