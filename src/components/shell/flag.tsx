import type { Locale } from "@/data/types";

/**
 * Bendera untuk tombol ganti bahasa.
 *
 * Digambar sebagai SVG sebaris, dan itu bukan pilihan gaya melainkan keharusan:
 * emoji bendera (🇮🇩, 🇬🇧) **tidak punya glyph di Windows**. Di sana ia jatuh ke
 * pasangan huruf indikator regional dan tampil sebagai "ID" dan "GB" — persis
 * teks yang seharusnya digantikan gambar. Font pihak ketiga bisa menambalnya,
 * tetapi itu berarti unduhan font hanya demi dua ikon 18 piksel.
 *
 * Keduanya sengaja kecil dan berbingkai rambut. Palet situs ini kapur dan emas;
 * merah dan biru bendera adalah satu-satunya warna di luar token yang
 * diizinkan masuk, jadi ia ditahan pada ukuran yang membuatnya terbaca sebagai
 * tanda kartografi — motif `coordinate-mark` — bukan sebagai stiker.
 *
 * Bendera Britania mewakili bahasa Inggris, bukan negara tertentu. Konvensi yang
 * lazim, dan satu-satunya alternatifnya adalah tidak memakai bendera sama sekali.
 */
export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden="true"
      focusable="false"
      /* Sudutnya dibulatkan lewat clip, bukan lewat `overflow`, supaya
         pembulatannya ikut terbawa ke mana pun ikon ini dipakai. */
      style={{ borderRadius: 2 }}
    >
      {locale === "id" ? <Indonesia /> : <Britain />}
      {/* Bingkai rambut. Tanpa ini, separuh putih bendera Indonesia melebur ke
          permukaan terang di belakangnya dan benderanya terbaca sebagai satu
          balok merah. */}
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="15"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
    </svg>
  );
}

function Indonesia() {
  return (
    <>
      <rect width="24" height="8" fill="#ce1126" />
      <rect y="8" width="24" height="8" fill="#fff" />
    </>
  );
}

/**
 * Union Jack, versi tersederhanakan.
 *
 * Lebarnya dihitung dari proporsi kanonik 60×30 lalu diskalakan ke tinggi 16:
 * salib miring putih 6→3,2 · salib miring merah 4→2,13 · salib tegak putih
 * 10→5,33 · salib tegak merah 6→3,2. Yang dilewati adalah counterchange pada
 * salib St Patrick — pada 18 piksel ia tidak pernah terlihat, dan menggambarnya
 * menambah empat path demi ketelitian yang tidak sampai ke mata.
 */
function Britain() {
  return (
    <>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#c8102e" strokeWidth="2.13" />
      <path d="M12,0 V16 M0,8 H24" stroke="#fff" strokeWidth="5.33" />
      <path d="M12,0 V16 M0,8 H24" stroke="#c8102e" strokeWidth="3.2" />
    </>
  );
}
