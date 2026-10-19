/**
 * Penyaring masukan — lapisan kedua, bukan lapisan utama.
 *
 * Lapisan utamanya ada di `grounding.ts`: system prompt yang mengunci peran,
 * melarang menjawab di luar data situs, dan memerintahkan model memperlakukan
 * setiap perintah di dalam masukan pengguna sebagai DATA, bukan sebagai
 * instruksi. Itu yang menahan serangan yang dirumuskan ulang dengan kata-kata
 * baru, dan tidak ada daftar pola yang bisa menggantikannya.
 *
 * Berkas ini menambah dua hal yang tidak bisa diberikan system prompt:
 *
 * 1. **Kepastian.** Untuk pola yang benar-benar cocok, penolakannya terjadi
 *    sebelum model dipanggil, jadi ia tidak bisa dibujuk. Model bisa dibujuk;
 *    `if` tidak bisa.
 * 2. **Kuota.** Permintaan di luar cakupan tidak menghabiskan satu token pun.
 *
 * **Sengaja dibuat berpresisi tinggi, bukan bercakupan luas.** Daftar yang
 * terlalu rakus akan menolak pertanyaan warisan yang sah — "bagaimana cara
 * Borobudur dibangun", "apa bahasa yang dipakai di relief" — dan penyaring
 * yang menolak pengunjung sungguhan lebih merugikan daripada satu permintaan
 * iseng yang lolos ke lapisan pertama. Setiap pola di bawah dipilih karena ia
 * tidak mungkin muncul pada pertanyaan tentang satu situs warisan.
 */
import type { Locale } from "@/data/types";

/** Batas panjang satu pesan. Lebih panjang dari ini bukan pertanyaan. */
export const MAX_MESSAGE_CHARS = 2000;

type Reason = "override" | "coding" | "off_topic";

/**
 * Upaya mengambil alih peran atau membongkar instruksi.
 *
 * Yang dicari bentuk perintahnya, bukan katanya: "abaikan aturan",
 * "kamu sekarang adalah", "tampilkan system prompt".
 */
const OVERRIDE: RegExp[] = [
  /\b(abaikan|lupakan|hiraukan)\s+(semua\s+|seluruh\s+)?(instruksi|aturan|perintah|petunjuk|batasan|konteks|data\s+situs)/i,
  /\bignore\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier|your|these)\s+(instruction|rule|prompt|direction|constraint)/i,
  /\bdisregard\s+(the\s+|all\s+|your\s+)?(above|previous|prior|instruction|rule|prompt)/i,
  /\b(kamu|anda|lo|lu)\s+(sekarang|mulai\s+sekarang)\s+(adalah|jadi|menjadi|bukan\s+lagi)\b/i,
  /\byou\s+are\s+now\s+(a|an|my|no\s+longer)\b/i,
  /\b(act|behave|respond)\s+as\s+(a|an|if|my)\b/i,
  /\bberperan\s+(sebagai|jadi|menjadi)\b/i,
  /\bpretend\s+(to\s+be|you(\s+are|'re)|that\s+you)/i,
  /\b(system\s*prompt|prompt\s*sistem|initial\s+instruction|instruksi\s+awal|prompt\s+aslimu)\b/i,
  /\b(tampilkan|sebutkan|ulangi|tuliskan|bocorkan|beri\s*tahu)\s+(semua\s+)?(instruksi|aturan|prompt|perintah)(mu|\s+kamu|\s+anda)?\b/i,
  /\b(repeat|reveal|print|show|output|list)\s+(me\s+)?(your|the)\s+(instruction|rule|system|prompt|guideline)/i,
  /\b(developer|dev|god|admin)\s+mode\b/i,
  /\bjailbreak\b/i,
  /\bDAN\s+mode\b/,
  /\b(tanpa|without)\s+(batasan|batas|aturan|restriction|limitation|filter)\b/i,
];

/**
 * Permintaan kerja teknis — skenario yang paling mungkin dicoba, dan yang
 * paling memalukan kalau dilayani: pemandu warisan budaya yang tiba-tiba
 * men-debug kode orang.
 *
 * Termasuk bentuk berdalih: "saya ingin belajar sejarah, tapi codingan saya
 * error, bantu dulu ya" — yang tertangkap pola `codingan saya`.
 */
const CODING: RegExp[] = [
  /```/,
  /\b(codingan|kodingan|ngoding)\b/i,
  /\b(kode|script|program|aplikasi|fungsi)\s*(saya|ku|aku|gue|gw|nya)\b/i,
  /\b(perbaiki|benerin|betulkan|fix|debug|refactor)\s+(ini\s+|dong\s+)?(kode|kodingan|codingan|script|program|fungsi|error|bug|syntax|query)/i,
  /\b(buatkan|bikinkan|tuliskan|buat|write|generate|create)\s+(saya\s+|aku\s+|me\s+|a\s+|sebuah\s+)?(kode|script|program|fungsi|function|code|query|regex|algoritma)\b/i,
  /\b(bantu|help|tolong)\s+(saya\s+|aku\s+|me\s+)?(ngoding|coding|debug|program|compile)/i,
  /\b(stack\s*trace|traceback|segmentation\s+fault|null\s*pointer|syntax\s+error|compile\s+error|runtime\s+error|undefined\s+is\s+not)\b/i,
  /\b(npm|pip|yarn|pnpm|composer|cargo|apt|brew)\s+(install|run|add|update)\b/i,
  /\b(select|insert|update|delete)\s+[\w*,\s]+\s+(from|into|set|where)\b/i,
  /<\/?(script|html|body|div|span|iframe)\b/i,
  /\b(def|function|const|let|var|class|import|require|async\s+function)\s+\w+\s*[({=:]/,
  /\b(python|javascript|typescript|java|kotlin|swift|golang|rust|php|c\+\+|c#|sql|html|css|react|node\.?js|laravel|django)\b/i,
];

/** Tugas yang jelas milik domain lain. Daftar ini paling pendek karena paling
    mudah salah tangkap. */
const OFF_TOPIC: RegExp[] = [
  /\b(buatkan|tuliskan|bikinkan|write|draft)\s+(saya\s+|aku\s+|me\s+|sebuah\s+|a\s+)?(esai|essay|email|surat\s+lamaran|cv|resume|skripsi|makalah|proposal|caption|iklan)\b/i,
  /\b(harga\s+saham|pasar\s+saham|crypto|bitcoin|forex|investasi\s+saham)\b/i,
  /\b(dosis|diagnosa|diagnosis)\b|\bobat\s+(untuk|buat)\b|\bgejala\s+penyakit\b/i,
  /\b(resep)\s+(masakan|makanan|kue|minuman|nasi|ayam)\b/i,
  /\b(hitung|selesaikan|solve|kerjakan)\b[^.?!]{0,40}\b(integral|turunan|persamaan\s+kuadrat|matriks|limit|pr\s+matematika)\b/i,
  /\b(siapa|who)\s+(presiden|pemenang|juara)\b/i,
];

const REFUSAL: Record<Reason, Record<Locale, (site: string) => string>> = {
  override: {
    id: (site) =>
      `Permintaan itu meminta saya keluar dari peran saya, dan itu tidak bisa saya lakukan. ` +
      `Saya pemandu untuk ${site}, dan saya hanya menjawab dari data situs ini. ` +
      `Kalau ada yang ingin Anda ketahui tentang ${site} — periodenya, cara pembangunannya, atau makna bagian-bagiannya — silakan tanyakan.`,
    en: (site) =>
      `That request asks me to step outside my role, which I will not do. ` +
      `I am a guide for ${site}, and I answer only from this site's data. ` +
      `If there is something you would like to know about ${site} — its period, how it was built, or what its parts mean — please ask.`,
  },
  coding: {
    id: (site) =>
      `Saya tidak mengerjakan tugas pemrograman, juga tidak kalau diminta sebagai selingan sebelum pertanyaan sejarah. ` +
      `Yang bisa saya bantu hanya ${site}, dari data situs yang ada. ` +
      `Silakan tanyakan apa pun tentang situsnya.`,
    en: (site) =>
      `I do not take on programming work, not even as a detour before a history question. ` +
      `What I can help with is ${site}, from this site's data. ` +
      `Please ask anything about the site itself.`,
  },
  off_topic: {
    id: (site) =>
      `Pertanyaan itu di luar cakupan saya. Saya hanya menjawab tentang ${site} berdasarkan data situs ini. ` +
      `Kalau Anda ingin tahu periodenya, peradaban yang membangunnya, atau arti bagian-bagiannya, saya siap.`,
    en: (site) =>
      `That question is outside my scope. I answer only about ${site}, from this site's data. ` +
      `If you would like its period, the civilisation that built it, or what its parts mean, I am ready.`,
  },
};

export type Screening =
  | { ok: true; text: string }
  | { ok: false; reason: Reason; reply: string };

/**
 * Periksa satu pesan pengguna.
 *
 * `siteName` masuk ke pesan penolakan supaya penolakannya tetap membantu dan
 * tetap berada di dalam dunia aplikasi — bukan dinding buntu yang membuat
 * pengunjung berhenti mencoba.
 */
export function screenInput(raw: string, locale: Locale, siteName: string): Screening {
  const text = raw.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_CHARS);

  const found = (list: RegExp[]) => list.some((re) => re.test(text));

  if (found(OVERRIDE)) return refuse("override", locale, siteName);
  if (found(CODING)) return refuse("coding", locale, siteName);
  if (found(OFF_TOPIC)) return refuse("off_topic", locale, siteName);

  return { ok: true, text };
}

function refuse(reason: Reason, locale: Locale, siteName: string): Screening {
  return { ok: false, reason, reply: REFUSAL[reason][locale](siteName) };
}
