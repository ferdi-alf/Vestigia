/**
 * Pembatas laju untuk keempat route AI — per perangkat, di memori proses.
 *
 * Tujuannya bukan menahan serangan bersenjata, melainkan dua hal yang
 * benar-benar mungkin terjadi: satu tab yang macet dalam perulangan
 * menghabiskan kuota API dalam hitungan menit, dan satu pengunjung yang
 * penasaran memakai kuota yang seharusnya cukup untuk seluruh ruangan saat
 * penilaian berlangsung.
 *
 * **Dua ember, dan itu yang membuat batasnya tidak bisa dilewati dengan
 * menghapus cookie.** Identitas perangkat tinggal di cookie, jadi ia bisa
 * dibuang kapan saja — maka alamat IP dipakai sebagai ember kedua dengan
 * ambang yang lebih tinggi. Perangkat yang membuang cookie-nya mendapat ember
 * perangkat yang baru, tetapi tetap memakai ember IP yang sama. Satu jaringan
 * bersama tetap bisa dipakai beberapa orang; satu orang tidak bisa menyamar
 * jadi dua puluh.
 *
 * Keadaan hilang saat proses dimulai ulang dan tidak dibagi antar instance.
 * Kedua batasan itu dapat diterima di sini; kalau nanti tidak lagi,
 * penggantinya adalah penyimpanan bersama, bukan versi yang lebih rumit dari
 * berkas ini.
 */
const WINDOW_MS = 60_000;

/** Permintaan per menit untuk satu perangkat. Permintaan pemilik project. */
const DEVICE_MAX = 5;

/**
 * Ambang per alamat IP, dan ia sengaja TIDAK sama dengan `DEVICE_MAX`.
 *
 * Kalau keduanya sama, satu kampus atau satu kafe di belakang satu NAT akan
 * saling menghabiskan kuota dan aplikasinya tampak rusak. Tiga kali ambang
 * perangkat memberi ruang untuk beberapa pengunjung yang sah, sementara tetap
 * menutup penyalahgunaan dengan menghapus cookie berulang kali.
 */
const IP_MAX = 15;

/** Batas jumlah kunci yang dilacak, supaya peta tidak tumbuh tanpa batas. */
const MAX_TRACKED = 5_000;

const COOKIE = "vestigia_did";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const DEVICE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const hits = new Map<string, number[]>();

function take(key: string, max: number, now: number): { allowed: boolean; retryAfter: number } {
  const cutoff = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= max) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 1000)) };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true, retryAfter: 0 };
}

function sweep(now: number) {
  if (hits.size <= MAX_TRACKED) return;
  const cutoff = now - WINDOW_MS;
  for (const [k, times] of hits) {
    if (times.every((t) => t <= cutoff)) hits.delete(k);
    if (hits.size <= MAX_TRACKED) break;
  }
}

/** Alamat pemanggil sebaik yang bisa diketahui di belakang proksi hosting. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function readDeviceId(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name !== COOKIE) continue;
    const value = rest.join("=").trim();
    return DEVICE_ID.test(value) ? value : null;
  }
  return null;
}

function isSecure(request: Request): boolean {
  if (request.headers.get("x-forwarded-proto") === "https") return true;
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export interface Guard {
  allowed: boolean;
  /** detik sampai permintaan berikutnya diizinkan; 0 kalau diizinkan */
  retryAfter: number;
  /** ember mana yang penuh — dipakai untuk pesan yang jujur, bukan untuk UI */
  scope: "device" | "ip" | null;
  /** header yang WAJIB diteruskan ke respons: menanam identitas perangkat */
  headers: Record<string, string>;
}

/**
 * Satu pintu untuk keempat route.
 *
 * Cookie identitas ditanam `HttpOnly`, jadi JavaScript halaman tidak bisa
 * membacanya maupun menukarnya — ia bukan penanda analitik dan tidak dipakai
 * untuk apa pun selain menghitung permintaan. `Secure` hanya dipasang di atas
 * HTTPS; memasangnya di `localhost` membuat peramban menolak menyimpannya dan
 * setiap permintaan akan terlihat sebagai perangkat baru.
 */
export function guardRequest(request: Request): Guard {
  const now = Date.now();

  const existing = readDeviceId(request);
  const deviceId = existing ?? crypto.randomUUID();

  const headers: Record<string, string> = {};
  if (!existing) {
    const attrs = [
      `${COOKIE}=${deviceId}`,
      "Path=/",
      `Max-Age=${COOKIE_MAX_AGE}`,
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (isSecure(request)) attrs.push("Secure");
    headers["set-cookie"] = attrs.join("; ");
  }

  const ip = take(`ip:${clientIp(request)}`, IP_MAX, now);
  if (!ip.allowed) {
    sweep(now);
    return { allowed: false, retryAfter: ip.retryAfter, scope: "ip", headers };
  }

  const device = take(`did:${deviceId}`, DEVICE_MAX, now);
  sweep(now);

  return {
    allowed: device.allowed,
    retryAfter: device.retryAfter,
    scope: device.allowed ? null : "device",
    headers,
  };
}

/** Respons 429 yang seragam untuk keempat route. */
export function rateLimited(guard: Guard, locale: "id" | "en" = "id"): Response {
  return Response.json(
    {
      error: "rate_limited",
      retryAfter: guard.retryAfter,
      message:
        locale === "id"
          ? `Terlalu banyak permintaan. Batasnya ${DEVICE_MAX} per menit per perangkat — coba lagi dalam ${guard.retryAfter} detik.`
          : `Too many requests. The limit is ${DEVICE_MAX} per minute per device — try again in ${guard.retryAfter} seconds.`,
    },
    {
      status: 429,
      headers: {
        ...guard.headers,
        "retry-after": String(guard.retryAfter),
        "cache-control": "no-store",
      },
    },
  );
}

export { DEVICE_MAX, IP_MAX };
