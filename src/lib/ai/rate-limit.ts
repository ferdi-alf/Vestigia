/**
 * Pembatas laju sederhana, per alamat IP, di memori proses.
 *
 * Cukup untuk skala aplikasi ini. Tujuannya bukan menahan serangan, melainkan
 * mencegah satu tab yang macet dalam perulangan menghabiskan kuota API dalam
 * hitungan menit — kegagalan yang paling mungkin terjadi dan paling merugikan
 * saat penilaian berlangsung.
 *
 * Keadaan hilang saat proses dimulai ulang, dan tidak dibagi antar instance.
 * Kedua batasan itu dapat diterima di sini; kalau nanti tidak lagi, penggantinya
 * adalah penyimpanan bersama, bukan versi yang lebih rumit dari berkas ini.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
/** Batas jumlah IP yang dilacak, supaya peta tidak tumbuh tanpa batas. */
const MAX_TRACKED = 5_000;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= MAX_REQUESTS) {
    const oldest = recent[0];
    return { allowed: false, retryAfter: Math.ceil((oldest + WINDOW_MS - now) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > MAX_TRACKED) {
    for (const [k, times] of hits) {
      if (times.every((t) => t <= cutoff)) hits.delete(k);
      if (hits.size <= MAX_TRACKED) break;
    }
  }

  return { allowed: true, retryAfter: 0 };
}

/** Alamat pemanggil sebaik yang bisa diketahui di belakang proksi hosting. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
