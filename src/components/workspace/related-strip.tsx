import Image from "next/image";
import { RELATED_MANIFEST } from "@/data/generated/media-manifest";
import type { LocalizedText, Locale } from "@/data/types";

/** Lima bingkai, selalu. Jumlahnya tetap supaya barisnya tidak berubah bentuk
    setiap kali satu gambar ditambahkan. */
const SLOTS = [1, 2, 3, 4, 5] as const;

const LABEL: LocalizedText = { id: "Gambar terkait", en: "Related images" };
const EMPTY: LocalizedText = { id: "Belum ada gambar", en: "No image yet" };

/**
 * Lima gambar pendamping per warisan.
 *
 * **Berkasnya belum ada, dan halaman ini tetap utuh tanpanya** — aturan yang
 * sama yang mengatur GLB, gambar landing, dan video. Yang dirender untuk slot
 * kosong bukan kotak abu-abu yang menunggu, melainkan bingkai bernomor yang
 * jelas merupakan tempat yang disediakan: ia terbaca sebagai bagian dari
 * komposisi, bukan sebagai kerusakan.
 *
 * **Konvensi nama menggantikan konfigurasi.** Tidak ada slot yang
 * dideklarasikan di mana pun untuk gambar-gambar ini; `sync-media` memindai
 * `public/images/heritage/` dan mencocokkan `<slug>-01.webp` … `<slug>-05.webp`.
 * Konsekuensinya: menaruh lima berkas untuk warisan ke-16 sudah cukup, dan
 * tidak satu baris kode pun perlu disentuh. Itu aturan §2 project ini —
 * menambah isi tidak boleh mengubah arsitektur.
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
  const found = SLOTS.map((n) => {
    const stem = `${slug}-0${n}`;
    const file =
      RELATED_MANIFEST[`${stem}.webp`] ??
      RELATED_MANIFEST[`${stem}.avif`] ??
      RELATED_MANIFEST[`${stem}.jpg`] ??
      RELATED_MANIFEST[`${stem}.png`];
    return { n, file };
  });

  return (
    <section aria-labelledby="related-title" className="mt-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="related-title" className="text-[0.62rem] tracking-[0.16em] text-ink-dim uppercase">
          {LABEL[locale]}
        </h2>
        <p className="font-mono text-[0.62rem] tabular-nums text-ink-dim">
          {found.filter((f) => f.file).length} / {SLOTS.length}
        </p>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {found.map(({ n, file }) => (
          <li
            key={n}
            className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface"
          >
            {file ? (
              <Image
                src={file.src}
                /* Teks alternatif yang MENYEBUTKAN sesuatu: nama situs plus
                   nomor urut. Ia tidak mengklaim apa pun tentang isi gambarnya,
                   karena berkasnya belum ada saat baris ini ditulis dan
                   mengarang deskripsinya akan jadi klaim palsu. */
                alt={`${name} — ${n}`}
                fill
                sizes="(min-width:1024px) 18vw, (min-width:640px) 30vw, 45vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                <span className="font-mono text-[0.68rem] tabular-nums text-ink-dim">
                  {String(n).padStart(2, "0")}
                </span>
                <span className="text-[0.6rem] text-ink-dim/80">{EMPTY[locale]}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
