// DIGENERATE OTOMATIS oleh scripts/sync-media.mjs — jangan diedit tangan.
// Mencerminkan isi public/images/landing/ dan public/videos/ pada saat sync terakhir.
// Jalankan `npm run sync:media` setelah menambah atau menghapus berkas.

export interface MediaFile {
  src: string;
  bytes: number;
}

export const MEDIA_MANIFEST: Readonly<Record<string, MediaFile>> = {
  "ai-backdrop.webp": { src: "/images/landing/ai-backdrop.webp", bytes: 43924 },
  "closing-scene.webp": { src: "/images/landing/closing-scene.webp", bytes: 19952 },
  "hero-dust.webp": { src: "/images/landing/hero-dust.webp", bytes: 51172 },
  "hero-mid.webp": { src: "/images/landing/hero-mid.webp", bytes: 5714 },
  "hero-near.webp": { src: "/images/landing/hero-near.webp", bytes: 4472 },
  "hero-sky.webp": { src: "/images/landing/hero-sky.webp", bytes: 10088 },
  "intro-texture.webp": { src: "/images/landing/intro-texture.webp", bytes: 110066 },
  "sky-light.png": { src: "/images/landing/sky-light.png", bytes: 982152 },
  "world-backdrop.webp": { src: "/images/landing/world-backdrop.webp", bytes: 7212 },
};

/* Klip video dan bingkai pendampingnya. Kosong bukan kesalahan: section yang
   memakainya turun ke komposisi CSS, sama seperti slot gambar yang kosong. */
export const VIDEO_MANIFEST: Readonly<Record<string, MediaFile>> = {
  "a-descent-01.webp": { src: "/videos/a-descent-01.webp", bytes: 35104 },
  "a-descent-02.webp": { src: "/videos/a-descent-02.webp", bytes: 69750 },
  "a-descent-03.webp": { src: "/videos/a-descent-03.webp", bytes: 84724 },
  "a-descent-poster.webp": { src: "/videos/a-descent-poster.webp", bytes: 35104 },
  "a-descent.mp4": { src: "/videos/a-descent.mp4", bytes: 8340366 },
  "erosion-relief-01.webp": { src: "/videos/erosion-relief-01.webp", bytes: 117674 },
  "erosion-relief-02.webp": { src: "/videos/erosion-relief-02.webp", bytes: 172654 },
  "erosion-relief-03.webp": { src: "/videos/erosion-relief-03.webp", bytes: 165470 },
  "erosion-relief-poster.webp": { src: "/videos/erosion-relief-poster.webp", bytes: 165470 },
  "erosion-relief.mp4": { src: "/videos/erosion-relief.mp4", bytes: 2717606 },
};

/* Gambar pendamping per warisan. Workspace merender bingkai kosong untuk yang
   belum ada, jadi menaruh berkas ke public/images/heritage/ sudah cukup. */
export const RELATED_MANIFEST: Readonly<Record<string, MediaFile>> = {
  /* belum ada gambar pendamping */
};
