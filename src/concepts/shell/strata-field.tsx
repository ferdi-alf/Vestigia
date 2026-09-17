"use client";

import { useEffect, useRef } from "react";
import { readTokens } from "@/lib/read-tokens";

/**
 * Latar hero — lapisan batu yang bergeser pelan.
 *
 * Membawa motif `strata` (§5): garis-garis mendatar yang beriak seperti
 * perlapisan sedimen yang terlipat, dengan setiap lapisan kelima berdiri lebih
 * tegas sebagai bidang perlapisan. Ia bukan animasi dekoratif — ia menyebut
 * premis halaman ini, bahwa yang dibaca adalah permukaan yang terbentuk
 * berlapis-lapis oleh waktu.
 *
 * ---
 *
 * **Asalnya `Waves` dari registry React Bits, dan yang diambil mekanismenya.**
 *
 * Yang dipertahankan: derau Perlin 2D yang ditulis tangan di sana, dan cara
 * sebuah kisi titik digeser olehnya lalu digambar sebagai polyline. Itu bagian
 * yang berharga dan itu yang ditiru.
 *
 * Yang dibuang, dan alasannya masing-masing:
 *
 * - **Seluruh sistem pegas kursor** — hampir separuh berkas aslinya. Hero ini
 *   sudah punya satu pemilik penunjuk, yaitu globe 3D di atasnya, dan §6
 *   menuntut satu pemilik per properti. Dua lapisan yang sama-sama bereaksi
 *   pada tetikus di bingkai yang sama adalah jenis bug yang tidak bisa
 *   ditelusuri.
 * - **Pendengar `touchmove` dengan `{ passive: false }`** — ia berhak
 *   membatalkan gulir, dan ini halaman yang SELURUHNYA digerakkan gulir.
 * - **Paletnya** — §5: tidak ada hex mentah di komponen.
 * - **`Waves.css`**, yang `::before`-nya memuat `var(-0.5rem)` dan `var(50%)` —
 *   keduanya bukan nama properti kustom yang sah, jadi selektor itu tidak
 *   pernah menggambar apa pun sejak awal.
 *
 * **Cahaya tetap datang dari kiri** (§5). Bukan lewat gradien buatan melainkan
 * lewat dua token: garisnya disapu dari `--color-line-strong` di tepi kiri ke
 * `--color-line` di tepi kanan, jadi lapisannya meredup menjauhi sumber cahaya
 * yang sama dengan yang menyinari panggung 3D di atasnya.
 */

/* ── Derau Perlin 2D ──────────────────────────────────────────────────
   Ditulis tangan, tanpa dependency — dan itu satu-satunya alasan komponen ini
   lolos saringan yang menolak Aurora, Threads, Orb, dan seluruh keluarga `ogl`:
   §7 mengizinkan satu konteks WebGL per halaman, dan hero sudah memakainya
   untuk globe. Kanvas 2D tidak menyentuh larangan itu sama sekali. */

const GRADIENTS = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [1, 0], [-1, 0],
  [0, 1], [0, -1], [0, 1], [0, -1],
] as const;

const SEEDS = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69,
  142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
  203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230,
  220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76,
  132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173,
  186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
  59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163,
  70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162,
  241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204,
  176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141,
  128, 195, 78, 66, 215, 61, 156, 180,
];

/**
 * Benih TETAP, bukan `Math.random()`.
 *
 * Aslinya mengacak benih saat komponen dirender, dan itu memanggil fungsi tak
 * murni di dalam render — `react-hooks/purity` menolaknya, dan penolakannya
 * benar: bentuk lapisan akan berubah tiap kali React kebetulan merender ulang.
 * Lapisan batu yang menata ulang dirinya sendiri bukan lapisan batu.
 */
const SEED = 1987;

function buildPermutation(seed: number) {
  const perm = new Uint8Array(512);
  const grad = new Array<readonly [number, number]>(512);
  for (let i = 0; i < 256; i += 1) {
    const value = (i & 1 ? SEEDS[i] ^ (seed & 255) : SEEDS[i] ^ ((seed >> 8) & 255)) & 255;
    perm[i] = perm[i + 256] = value;
    grad[i] = grad[i + 256] = GRADIENTS[value % 12];
  }
  return { perm, grad };
}

const { perm, grad } = buildPermutation(SEED);

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;
const dot = (g: readonly [number, number], x: number, y: number) => g[0] * x + g[1] * y;

function perlin2(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const X = xi & 255;
  const Y = yi & 255;

  const n00 = dot(grad[X + perm[Y]], xf, yf);
  const n01 = dot(grad[X + perm[Y + 1]], xf, yf - 1);
  const n10 = dot(grad[X + 1 + perm[Y]], xf - 1, yf);
  const n11 = dot(grad[X + 1 + perm[Y + 1]], xf - 1, yf - 1);

  const u = fade(xf);
  return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(yf));
}

/* ── Bentuk lapisannya ──────────────────────────────────────────────── */

/** Jarak titik di sepanjang satu lapisan. Rapat cukup untuk lengkung halus. */
const GAP_X = 20;
/** Jarak antar lapisan. */
const GAP_Y = 26;
/** Simpangan mendatar dan tegak. Tegak lebih besar: sedimen terlipat naik-turun. */
const AMP_X = 12;
const AMP_Y = 20;
/** Kecepatan hanyut. Sangat pelan — ini latar, bukan subjek. */
const SPEED_X = 0.011;
const SPEED_Y = 0.007;
/** Tiap lapisan ke-N berdiri lebih tegas, seperti bidang perlapisan. */
const BEDDING = 5;
const ALPHA_BEDDING = 0.3;
const ALPHA_PLAIN = 0.11;
/** §8: `dpr` dibatasi. Latar tidak berhak menuntut piksel sebanyak subjeknya. */
const MAX_DPR = 2;

export function StrataField({ active, still }: { active: boolean; still: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /**
   * Jam yang menumpuk, bukan stempel waktu `requestAnimationFrame`.
   *
   * Ia hidup di luar effect supaya lapisan MELANJUTKAN dari posisi terakhirnya
   * saat section masuk layar lagi, bukan menyentak balik ke bingkai nol — §7.
   */
  const clock = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tokens = readTokens(host, { near: "--color-line-strong", far: "--color-line" });

    let width = 0;
    let height = 0;
    let rows: { x: number; y: number }[][] = [];
    let raf = 0;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));

      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      /* Cahaya dari kiri, dibangun dari dua token dan bukan dari alfa yang
         dihitung tangan — tidak ada hex mentah yang perlu diurai di sini. */
      const sweep = ctx.createLinearGradient(0, 0, width, 0);
      sweep.addColorStop(0, tokens.near);
      sweep.addColorStop(1, tokens.far);
      ctx.strokeStyle = sweep;
      ctx.lineWidth = 1;

      /* Kisinya melebar satu langkah ke segala arah supaya ujung lapisan tidak
         pernah terlihat menggantung di dalam bingkai saat ia bergeser. */
      rows = [];
      for (let y = -GAP_Y; y <= height + GAP_Y; y += GAP_Y) {
        const row: { x: number; y: number }[] = [];
        for (let x = -GAP_X; x <= width + GAP_X; x += GAP_X) row.push({ x, y });
        rows.push(row);
      }
    };

    /**
     * Dua `stroke()` per bingkai, bukan satu per lapisan.
     *
     * Alfa hanya bisa disetel per path, jadi lapisan dikelompokkan menurut
     * alfanya lebih dulu dan seluruh kelompok digambar sekali. Tiap titik tetap
     * dihitung persis sekali.
     */
    const pass = (bedding: boolean, alpha: number, time: number) => {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let r = 0; r < rows.length; r += 1) {
        if ((r % BEDDING === 0) !== bedding) continue;
        const row = rows[r];
        for (let i = 0; i < row.length; i += 1) {
          const p = row[i];
          const turn =
            perlin2((p.x + time * SPEED_X) * 0.0022, (p.y + time * SPEED_Y) * 0.0016) * 12;
          const x = p.x + Math.cos(turn) * AMP_X;
          const y = p.y + Math.sin(turn) * AMP_Y;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      pass(true, ALPHA_BEDDING, time);
      pass(false, ALPHA_PLAIN, time);
      ctx.globalAlpha = 1;
    };

    measure();
    draw(clock.current);

    const observer = new ResizeObserver(() => {
      measure();
      draw(clock.current);
    });
    observer.observe(host);

    /* Gerak dikurangi: satu bingkai, lalu diam. Bukan loop yang dipasang lalu
       dimatikan — tidak ada `requestAnimationFrame` yang pernah dijadwalkan.
       Bingkai yang tertinggal adalah medan lapisan yang utuh dan terbaca, bukan
       kanvas kosong (§10). */
    if (still || !active) {
      return () => observer.disconnect();
    }

    let previous = 0;
    const tick = (stamp: number) => {
      if (previous > 0) clock.current += stamp - previous;
      previous = stamp;
      draw(clock.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [active, still]);

  return (
    <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
