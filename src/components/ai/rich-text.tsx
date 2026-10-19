import { Fragment, type ReactNode } from "react";

/**
 * Perender keluaran AI.
 *
 * Model menulis Markdown apakah diminta atau tidak — `**tebal**`, judul, daftar
 * berpoin, dan kadang tabel utuh. Sebelum ini keluarannya ditaruh begitu saja di
 * dalam satu `<p className="whitespace-pre-wrap">`, jadi yang terbaca pengunjung
 * adalah bintang dua, garis pipa, dan `<br>` mentah. Perbandingan dua situs
 * adalah kasus terburuknya: ia hampir selalu keluar sebagai tabel.
 *
 * Nol dependency, dan itu keputusan sadar: subset yang benar-benar dipakai model
 * kecil dan sudah diketahui, sementara menarik perender Markdown penuh berarti
 * satu paket baru plus sanitizer HTML untuk sesuatu yang tidak pernah butuh HTML.
 *
 * Dua sifat yang wajib dipegang, karena teksnya datang sambil distream:
 *
 * 1. **Tidak pernah melempar.** Ia dipanggil ulang pada setiap potongan, jadi
 *    sebagian besar masukan yang dilihatnya adalah Markdown yang belum selesai —
 *    tabel tanpa baris pemisah, penanda tebal yang belum ditutup.
 * 2. **Turun kelas dengan tenang.** Apa pun yang tidak dikenali tetap tampil
 *    sebagai paragraf biasa, bukan hilang.
 */

/* `<br>` dipakai model di dalam sel tabel; di luar itu HTML tidak pernah
   ditafsirkan — teksnya masuk sebagai teks, tidak pernah sebagai markup. */
const BR = /<br\s*\/?>/gi;

/** Penanda sebaris: `**tebal**`, `*miring*`, `` `kode` ``. */
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;

function inline(raw: string, keyPrefix: string): ReactNode[] {
  return raw
    .split(BR)
    .flatMap((line, lineIndex) => {
      const parts = line.split(INLINE).filter(Boolean);
      const nodes = parts.map((part, i) => {
        const key = `${keyPrefix}-${lineIndex}-${i}`;
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={key} className="font-medium text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={key} className="rounded bg-raised px-1 py-0.5 text-[0.85em] text-ink">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return (
            <em key={key} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }
        return <Fragment key={key}>{part}</Fragment>;
      });

      /* Baris kedua dan seterusnya dari satu <br> tetap satu blok, dipisah jeda. */
      return lineIndex === 0
        ? nodes
        : [<br key={`${keyPrefix}-br-${lineIndex}`} />, ...nodes];
    });
}

/** Satu baris tabel menjadi sel-selnya, tanpa pipa pembuka dan penutup. */
function cells(row: string): string[] {
  return row
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

const SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const isRow = (line: string) => line.includes("|");

export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];

  let paragraph: string[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const key = `p-${blocks.length}`;
    blocks.push(
      <p key={key} className="leading-relaxed text-ink-soft">
        {inline(paragraph.join(" "), key)}
      </p>,
    );
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    const key = `ul-${blocks.length}`;
    const items = bullets;
    blocks.push(
      <ul key={key} className="space-y-1.5 pl-4 leading-relaxed text-ink-soft">
        {items.map((item, i) => (
          <li key={`${key}-${i}`} className="list-disc marker:text-gold-dim">
            {inline(item, `${key}-${i}`)}
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  const flushOrdered = () => {
    if (!ordered.length) return;
    const key = `ol-${blocks.length}`;
    const items = ordered;
    blocks.push(
      <ol key={key} className="space-y-1.5 pl-5 leading-relaxed text-ink-soft">
        {items.map((item, i) => (
          <li key={`${key}-${i}`} className="list-decimal marker:text-ink-dim">
            {inline(item, `${key}-${i}`)}
          </li>
        ))}
      </ol>,
    );
    ordered = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushBullets();
    flushOrdered();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    /* Tabel: butuh baris judul DAN baris pemisah. Selama pemisahnya belum
       sampai — dan saat distream ia memang belum — baris ini diperlakukan
       sebagai paragraf biasa, bukan tabel yang setengah jadi. */
    if (isRow(trimmed) && i + 1 < lines.length && SEPARATOR.test(lines[i + 1])) {
      flushAll();
      const head = cells(trimmed);
      const body: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isRow(lines[j]) && lines[j].trim()) {
        body.push(cells(lines[j]));
        j++;
      }
      i = j - 1;

      const key = `table-${blocks.length}`;
      blocks.push(
        <div key={key} className="-mx-1 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line-strong">
                {head.map((c, ci) => (
                  <th key={`${key}-h-${ci}`} className="px-2 py-2 align-top font-medium text-ink">
                    {inline(c, `${key}-h-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={`${key}-r-${ri}`} className="border-b border-line last:border-0">
                  {row.map((c, ci) => (
                    <td
                      key={`${key}-r-${ri}-${ci}`}
                      className="px-2 py-2 align-top leading-relaxed text-ink-soft"
                    >
                      {inline(c, `${key}-r-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushAll();
      const key = `h-${blocks.length}`;
      blocks.push(
        <p
          key={key}
          className="pt-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-gold-dim"
        >
          {inline(heading[2], key)}
        </p>,
      );
      continue;
    }

    /* Garis pemisah yatim — tabel tanpa judul, atau sisa pemformatan. Dibuang
       diam-diam supaya tidak muncul sebagai deretan tanda hubung. */
    if (SEPARATOR.test(trimmed) || /^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushAll();
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      flushOrdered();
      bullets.push(bullet[1]);
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (numbered) {
      flushParagraph();
      flushBullets();
      ordered.push(numbered[1]);
      continue;
    }

    flushBullets();
    flushOrdered();
    paragraph.push(trimmed);
  }

  flushAll();

  return <div className="space-y-3.5">{blocks}</div>;
}
