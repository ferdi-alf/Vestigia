import { RELATED_MANIFEST } from "@/data/generated/media-manifest";
import { RelatedGallery, type RelatedSlot } from "./related-gallery";
import type { LocalizedText, Locale } from "@/data/types";

/** Lima bingkai, selalu. Jumlahnya tetap supaya barisnya tidak berubah bentuk
    setiap kali satu gambar ditambahkan. */
const SLOTS = [1, 2, 3, 4, 5] as const;

const LABEL: LocalizedText = { id: "Gambar terkait", en: "Related images" };

/**
 * Lima gambar pendamping per warisan.
 *
 * **Konvensi nama menggantikan konfigurasi.** Tidak ada slot yang
 * dideklarasikan di mana pun untuk gambar-gambar ini; `sync-media` memindai
 * `public/images/heritage/` dan mencocokkan `<slug>-01.webp` … `<slug>-05.webp`.
 * Konsekuensinya: menaruh lima berkas untuk warisan ke-16 sudah cukup, dan
 * tidak satu baris kode pun perlu disentuh. Itu aturan §2 project ini —
 * menambah isi tidak boleh mengubah arsitektur.
 *
 * `scripts/import-heritage-images.mjs` yang mengisi folder itu dari drop zone
 * pemilik project, dan slot yang kosong tetap bukan kesalahan: halaman ini
 * pernah berdiri utuh dengan kelimanya kosong, dan masih akan begitu untuk
 * warisan yang gambarnya belum ada.
 *
 * ---
 *
 * **Komponen ini tetap berjalan di SERVER.** Yang butuh keadaan hanya dialog
 * gambarnya, dan itu tinggal di `RelatedGallery`. Menaikkan berkas ini jadi
 * client component akan mengirim `RELATED_MANIFEST` — tujuh puluh lima entri —
 * ke setiap pengunjung, demi lima path yang sudah bisa diselesaikan di sini.
 *
 * Format yang dicari `.webp`; `sync-media` juga menerima `.avif`, `.jpg`, dan
 * `.png` kalau berkasnya kebetulan berbentuk lain.
 */
export function RelatedStrip({
  slug,
  name,
  locale,
}: {
  slug: string;
  name: string;
  locale: Locale;
}) {
  const slots: RelatedSlot[] = SLOTS.map((n) => {
    const stem = `${slug}-0${n}`;
    const file =
      RELATED_MANIFEST[`${stem}.webp`] ??
      RELATED_MANIFEST[`${stem}.avif`] ??
      RELATED_MANIFEST[`${stem}.jpg`] ??
      RELATED_MANIFEST[`${stem}.png`];
    return { n, src: file?.src ?? null };
  });

  return (
    <section aria-labelledby="related-title" className="mt-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="related-title" className="text-[0.62rem] tracking-[0.16em] text-ink-dim uppercase">
          {LABEL[locale]}
        </h2>
        <p className="font-mono text-[0.62rem] tabular-nums text-ink-dim">
          {slots.filter((slot) => slot.src).length} / {SLOTS.length}
        </p>
      </div>

      <RelatedGallery slots={slots} name={name} locale={locale} />
    </section>
  );
}
