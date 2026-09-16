"use client";

import { useEffect, useId, useRef } from "react";
import type { RefObject } from "react";
import { EASE, gsap } from "@/lib/motion/use-scroll-scene";
import { cn } from "@/lib/cn";

/**
 * Beam — garis antara dua hal, dengan cahaya yang berjalan di atasnya.
 *
 * Mekanismenya dari `AnimatedBeam` (Magic UI): ukur dua simpul terhadap satu
 * container, bangun satu bezier kuadratik yang dilengkungkan `curvature`,
 * tumpuk path statis redup di bawah path ber-stroke gradien, lalu geser
 * koordinat gradiennya sehingga cahaya menyapu sepanjang garis.
 *
 * EMPAT HAL DIUBAH, dan masing-masing menjawab aturan project yang berbeda.
 *
 * **Chrome-nya dibuang.** Aslinya membungkus tiap ujung dengan lingkaran
 * `bg-white` + `border-2` + `shadow-[0_0_20px_…]`. Itu persis kartu melayang
 * yang dilarang §4 anti design slop. Yang diambil hanya garisnya; ujungnya
 * adalah elemen yang memang sudah ada di halaman.
 *
 * **Digerakkan GSAP, bukan `motion/react`.** `motion` memang sudah terpasang,
 * jadi ini bukan soal dependency. Alasannya §6: satu pemilik per properti
 * animasi. GSAP sudah memegang seluruh gerak di situs ini.
 *
 * **Cahayanya menyapu SEKALI, lalu pergi.** Aslinya `repeat: Infinity`. Aturan
 * anti design slop melarang gerak yang berjalan sendiri tanpa pemicu pengguna,
 * dan preseden untuk ini sudah ada di `gold-sweep`: satu pita menyapu sekali,
 * bukan kilau yang berdenyut selamanya. Di konsep C tiap pemilihan penanda
 * memicu sapuan baru — jadi cahayanya selalu merupakan jawaban atas tindakan.
 *
 * **Warnanya dari token.** `#ffaa40`/`#9c40ff` diganti `--color-gold` dan
 * `--color-line-strong`. `currentColor` dipakai supaya satu komponen bisa
 * melayani tiga palet tanpa tahu apa-apa tentang ketiganya.
 *
 * ---
 *
 * Ujung ditunjuk lewat atribut `data-beam="<id>"`, bukan lewat array ref.
 * Lima belas penanda peta berarti lima belas ref yang harus dirakit dan
 * disinkronkan; atribut membuat jumlahnya tidak jadi masalah, dan itu idiom
 * yang sama dengan `data-reveal` dan `data-layer` di seluruh project ini.
 *
 * **Batas yang wajib dipegang:** kedua ujung harus hidup di ruang koordinat
 * yang sama dengan container dan tidak boleh berada di dalam elemen yang
 * di-`transform` — posisi diukur sekali lalu di-cache, jadi lapisan yang
 * bergerak akan membuat garisnya tertinggal.
 */

export interface BeamLink {
  /** `data-beam` simpul asal */
  from: string;
  /** `data-beam` simpul tujuan */
  to: string;
  /**
   * Bentuk jalurnya.
   *
   * `arc`   — satu bezier kuadratik, dilengkungkan `curvature`. Perilaku lama,
   *           dan tetap bawaannya supaya tidak ada pemanggil yang berubah.
   * `elbow` — dua ruas tegak lurus yang bertemu pada sudut 90 derajat. Untuk
   *           keterangan yang duduk di SUDUT sebuah wadah: busur dari sudut ke
   *           tepi terbaca sebagai garis yang tergelincir, sementara siku
   *           terbaca sebagai jalur yang memang diarahkan ke sana.
   */
  shape?: "arc" | "elbow";
  /**
   * Ruas mana yang berangkat lebih dulu, hanya untuk `shape: "elbow"`.
   *
   * `vertical-first` keluar dari sisi ATAS/BAWAH simpul asal, berbelok sekali,
   * lalu masuk sisi KIRI/KANAN simpul tujuan. Arah belokannya tidak perlu
   * disetel: ia jatuh sendiri dari posisi kedua kotak, sehingga kartu di atas
   * menghasilkan L terbalik dan kartu di bawah menghasilkan L biasa tanpa satu
   * pun cabang khusus.
   */
  elbow?: "vertical-first" | "horizontal-first";
  /**
   * Di mana garis mendarat pada sisi simpul tujuan, 0..1 sepanjang sisi itu.
   * Hanya untuk `shape: "elbow"`; bawaannya 0,5 — tepat di tengah sisi.
   *
   * Ada karena satu masalah konkret yang muncul begitu DUA kartu duduk di sisi
   * yang sama: keduanya mendarat di titik tengah yang sama, ruas mendatarnya
   * saling menimpa, dan yang terlihat bukan dua hubungan melainkan satu garis
   * bercabang. Memberi tiap garis titik pendaratannya sendiri memisahkannya —
   * dan sekaligus memberi ruas tegaknya panjang yang cukup untuk sikunya
   * terbaca.
   */
  toEdgeAt?: number;
  /** lengkung busur dalam piksel; negatif membusur ke atas. Diabaikan oleh `elbow` */
  curvature?: number;
  /** balik arah sapuan cahaya */
  reverse?: boolean;
  /** tunda sapuan, detik — dipakai untuk stagger beberapa beam sekaligus */
  delay?: number;
  /* Renggang dari tepi, piksel. Nama dan perilakunya sengaja sama dengan
     `AnimatedBeam` Magic UI supaya pola yang sudah dikenal tetap berlaku di
     sini. Dipakai saat sebuah ujung perlu menjauh sedikit dari elemennya —
     misalnya supaya garis tidak menyentuh cincin fokus. */
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

/**
 * Titik keluar garis pada TEPI sebuah kotak, bukan pada pusatnya.
 *
 * Ini aturan yang paling menentukan bentuk seluruh komponen ini, dan ia datang
 * dari keluhan yang spesifik: garis yang berangkat dari tengah sebuah kartu
 * harus menembus isinya sendiri sebelum keluar — melintasi judul, melintasi
 * paragraf — dan hasilnya terbaca sebagai coretan, bukan sebagai hubungan.
 *
 * Yang dihitung: tembakkan sinar dari pusat kotak menuju titik tujuan, lalu
 * cari di sisi mana ia memotong kotaknya. Skalanya `min(halfW/|dx|, halfH/|dy|)`
 * — sisi yang lebih dulu tertembus yang menang. Hasilnya garis selalu berangkat
 * dari sisi yang MENGHADAP tujuannya.
 */
function edgeToward(
  box: { cx: number; cy: number; halfW: number; halfH: number },
  tx: number,
  ty: number,
  pad: number,
): [x: number, y: number] {
  const dx = tx - box.cx;
  const dy = ty - box.cy;
  if (dx === 0 && dy === 0) return [box.cx, box.cy];

  /* `Infinity` saat salah satu komponen nol adalah jawaban yang BENAR di sini,
     bukan kasus tepi yang perlu dijaga: sinar yang tegak lurus tidak pernah
     memotong sisi yang sejajar dengannya, jadi `min` memilih sisi yang lain. */
  const t = Math.min(box.halfW / Math.abs(dx), box.halfH / Math.abs(dy));
  const len = Math.hypot(dx, dy);
  return [box.cx + dx * t + (dx / len) * pad, box.cy + dy * t + (dy / len) * pad];
}

/**
 * Titik keluar pada SISI TERTENTU sebuah kotak, bukan pada sisi yang menghadap.
 *
 * Pasangan `edgeToward` untuk jalur bersiku. Di sana sisi yang dipakai adalah
 * hasil perhitungan — sinar ditembakkan lalu dicari sisi mana yang tertembus.
 * Di sini sisinya sudah ditentukan lebih dulu oleh arah ruas pertama, dan
 * itulah yang membuat sudutnya benar-benar 90 derajat: ruas tegak harus
 * berangkat dari sisi mendatar, dan ruas mendatar harus mendarat di sisi tegak.
 * Membiarkan sinar memilih akan menghasilkan ruas yang berangkat miring dari
 * sudut kotak, dan sikunya hilang.
 */
function edgeOnSide(
  box: { cx: number; cy: number; halfW: number; halfH: number },
  side: "top" | "bottom" | "left" | "right",
  pad: number,
): [x: number, y: number] {
  if (side === "top") return [box.cx, box.cy - box.halfH - pad];
  if (side === "bottom") return [box.cx, box.cy + box.halfH + pad];
  if (side === "left") return [box.cx - box.halfW - pad, box.cy];
  return [box.cx + box.halfW + pad, box.cy];
}

/** Lebih dari ini, garisnya berhenti jadi informasi dan mulai jadi sarang laba-laba. */
const MAX_BEAMS = 5;

/** Jarak garis dari tepi elemen, piksel. Nol membuatnya menempel dan terbaca
    sebagai bagian dari border; terlalu jauh dan hubungannya jadi kabur. */
const EDGE_GAP = 4;

/** Lebar pita cahaya sebagai fraksi panjang garis. */
const BAND = 0.32;

export function BeamField({
  container,
  links,
  variant = "beam",
  active = true,
  className,
}: {
  container: RefObject<HTMLElement | null>;
  links: BeamLink[];
  /**
   * `beam`   — garis + cahaya yang menyapu sekali. Untuk hubungan yang baru
   *            saja terjadi: penanda yang dipilih, sumber yang dirujuk.
   * `leader` — garis survei kering yang menggambar dirinya lalu tinggal, tanpa
   *            cahaya. Geometri yang sama, bahan yang berbeda. Untuk anotasi
   *            yang memang harus diam supaya bisa dibaca.
   */
  variant?: "beam" | "leader";
  /** gerbang terlihat — beam tidak pernah menganimasi saat di luar layar */
  active?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[:]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const shown = links.slice(0, MAX_BEAMS);

  /* `shown` adalah array baru di setiap render. Kalau ia masuk daftar
     dependency, efek pengukuran akan berjalan setiap kali induknya dirender —
     termasuk saat yang berubah tidak ada hubungannya dengan garis. Ref
     memegang nilai terbarunya, dan `signature` di bawah yang memutuskan
     kapan pengukuran benar-benar perlu diulang.

     Penugasannya ada di dalam efek, bukan di badan render. Menulis ref saat
     render adalah hal yang ditolak React Compiler, dan urutannya tetap benar
     tanpa itu: efek dijalankan menurut urutan deklarasi, jadi efek ini selalu
     selesai sebelum efek pengukuran di bawahnya membacanya. */
  const latest = useRef(shown);
  useEffect(() => {
    latest.current = shown;
  });

  /* Kunci isi, bukan identitas array. Tanpa ini, induk yang membangun ulang
     array literal tiap render akan memicu pengukuran ulang tiap render. */
  const signature = shown
    .map((l) => `${l.from}>${l.to}:${l.shape ?? "arc"}:${l.elbow ?? ""}:${l.toEdgeAt ?? 0.5}:${l.curvature ?? 0}:${l.reverse ? 1 : 0}:${l.delay ?? 0}:${l.startXOffset ?? 0},${l.startYOffset ?? 0},${l.endXOffset ?? 0},${l.endYOffset ?? 0}`)
    .join("|");

  useEffect(() => {
    const host = container.current;
    const svg = svgRef.current;
    const beams = latest.current;
    if (!host || !svg || beams.length === 0) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tweens: gsap.core.Tween[] = [];

    /**
     * Ukur dan gambar ulang seluruh garis.
     *
     * Ini SATU-SATUNYA tempat `getBoundingClientRect` dipanggil, dan ia tidak
     * pernah dipanggil dari handler scroll atau dari loop frame — hanya saat
     * ukuran berubah atau saat daftar tautannya berubah. Membacanya tiap frame
     * akan memaksa tata letak dihitung ulang, dan dengan lima garis sekaligus
     * itu terasa langsung di ponsel.
     */
    const measure = () => {
      const box = host.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);

      beams.forEach((link, index) => {
        const a = host.querySelector<HTMLElement>(`[data-beam="${CSS.escape(link.from)}"]`);
        const b = host.querySelector<HTMLElement>(`[data-beam="${CSS.escape(link.to)}"]`);
        const base = svg.querySelector<SVGPathElement>(`[data-base="${index}"]`);
        const lit = svg.querySelector<SVGPathElement>(`[data-lit="${index}"]`);
        const grad = svg.querySelector<SVGLinearGradientElement>(`#${uid}-g${index}`);
        if (!a || !b || !base) return;

        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();

        const A = {
          cx: ra.left - box.left + ra.width / 2 + (link.startXOffset ?? 0),
          cy: ra.top - box.top + ra.height / 2 + (link.startYOffset ?? 0),
          halfW: ra.width / 2,
          halfH: ra.height / 2,
        };
        const B = {
          cx: rb.left - box.left + rb.width / 2 + (link.endXOffset ?? 0),
          cy: rb.top - box.top + rb.height / 2 + (link.endYOffset ?? 0),
          halfW: rb.width / 2,
          halfH: rb.height / 2,
        };

        let sx: number;
        let sy: number;
        let ex: number;
        let ey: number;
        let d: string;

        if (link.shape === "elbow") {
          /* Sisi keberangkatan dan kedatangan jatuh dari posisi relatif kedua
             kotak, bukan dari setelan. Kartu di ATAS wadah berangkat dari sisi
             bawahnya dan turun; kartu di BAWAH berangkat dari sisi atasnya dan
             naik. Itu yang membuat satu nilai `vertical-first` menghasilkan L
             terbalik di atas dan L biasa di bawah tanpa cabang tambahan. */
          const at = Math.min(1, Math.max(0, link.toEdgeAt ?? 0.5));

          if ((link.elbow ?? "vertical-first") === "vertical-first") {
            [sx, sy] = edgeOnSide(A, B.cy > A.cy ? "bottom" : "top", EDGE_GAP);
            /* Sisi tujuannya dari posisi relatif; titik pendaratan di sepanjang
               sisi itu dari `toEdgeAt`, supaya dua kartu di sisi yang sama tidak
               mendarat di titik yang sama. */
            ex = A.cx > B.cx ? B.cx + B.halfW + EDGE_GAP : B.cx - B.halfW - EDGE_GAP;
            ey = B.cy - B.halfH + B.halfH * 2 * at;
            /* Sudutnya tegak lurus secara konstruksi: ruas pertama berbagi `x`
               dengan titik awal, ruas kedua berbagi `y` dengan titik akhir. */
            d = `M ${sx},${sy} L ${sx},${ey} L ${ex},${ey}`;
          } else {
            [sx, sy] = edgeOnSide(A, B.cx > A.cx ? "right" : "left", EDGE_GAP);
            ex = B.cx - B.halfW + B.halfW * 2 * at;
            ey = A.cy > B.cy ? B.cy + B.halfH + EDGE_GAP : B.cy - B.halfH - EDGE_GAP;
            d = `M ${sx},${sy} L ${ex},${sy} L ${ex},${ey}`;
          }
        } else {
          /* Kedua ujung dipotong ke TEPI kotaknya, menghadap satu sama lain.
             Tanpa ini garisnya berangkat dari tengah dan menembus isi elemennya
             sendiri — lihat catatan di `edgeToward`. */
          [sx, sy] = edgeToward(A, B.cx, B.cy, EDGE_GAP);
          [ex, ey] = edgeToward(B, A.cx, A.cy, EDGE_GAP);

          const curve = link.curvature ?? 0;
          d = `M ${sx},${sy} Q ${(sx + ex) / 2},${(sy + ey) / 2 - curve} ${ex},${ey}`;
        }

        base.setAttribute("d", d);
        lit?.setAttribute("d", d);

        const animate = active && !still;

        if (variant === "leader") {
          /* Garis kering: ia menggambar dirinya lewat `stroke-dashoffset` lalu
             tinggal di sana. Panjang sesungguhnya harus diukur dari path,
             bukan ditebak dari jarak lurus — bezier selalu lebih panjang
             daripada tali busurnya. */
          const length = base.getTotalLength();
          base.style.strokeDasharray = `${length}`;
          if (!animate) {
            base.style.strokeDashoffset = "0";
          } else {
            tweens.push(
              gsap.fromTo(
                base,
                { strokeDashoffset: length },
                {
                  strokeDashoffset: 0,
                  duration: 0.9,
                  delay: link.delay ?? 0,
                  ease: EASE.enter,
                },
              ),
            );
          }
          return;
        }

        if (!grad || !animate) return;

        /* Cahaya berjalan dengan menggeser koordinat gradien sepanjang vektor
           asal→tujuan, dalam ruang pengguna. Bukan `objectBoundingBox`: kotak
           pembatas garis yang nyaris tegak lurus lebarnya mendekati nol, dan
           gradien mendatar di dalamnya akan runtuh jadi satu garis keras. */
        const proxy = { t: -BAND };
        const lerp = (t: number) => [sx + (ex - sx) * t, sy + (ey - sy) * t] as const;

        tweens.push(
          gsap.to(proxy, {
            t: 1 + BAND,
            duration: 1.5,
            delay: link.delay ?? 0,
            ease: EASE.scrub,
            onUpdate: () => {
              const t = link.reverse ? 1 - proxy.t : proxy.t;
              const [x1, y1] = lerp(t - BAND);
              const [x2, y2] = lerp(t + BAND);
              grad.setAttribute("x1", String(x1));
              grad.setAttribute("y1", String(y1));
              grad.setAttribute("x2", String(x2));
              grad.setAttribute("y2", String(y2));
            },
          }),
        );
      });
    };

    measure();

    /* Hanya ukuran container yang memicu pengukuran ulang. `ResizeObserver`
       menembak sekali saat dipasang, jadi pengukuran pertama di atas memang
       berlebihan — tetapi tanpanya ada satu frame di mana `d` masih kosong dan
       garisnya berkedip masuk. */
    const observer = new ResizeObserver(() => {
      for (const t of tweens) t.kill();
      tweens.length = 0;
      measure();
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      for (const t of tweens) t.kill();
    };
  }, [container, signature, uid, variant, active]);

  if (shown.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      /* Garisnya gambar. Hubungan yang diceritakannya WAJIB juga ada sebagai
         teks di DOM pemanggil — pengguna pembaca layar tidak boleh kehilangan
         informasinya hanya karena ia disampaikan lewat bentuk. */
      aria-hidden="true"
      fill="none"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    >
      <defs>
        {shown.map((_, index) => (
          <linearGradient
            key={index}
            id={`${uid}-g${index}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2="0"
          >
            <stop stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {shown.map((_, index) => (
        <g key={index}>
          {/* Garis dasar. Ia yang membawa informasinya, dan ia tidak pernah
              hilang — cahaya di atasnya hanya penekanan. Itu sebabnya mode
              gerak-dikurangi cukup menghentikan cahayanya tanpa kehilangan
              apa pun yang berarti. */}
          <path
            data-base={index}
            className="stroke-line-strong"
            strokeWidth={variant === "leader" ? 1 : 1.25}
            strokeOpacity={variant === "leader" ? 0.85 : 0.38}
            strokeLinecap="round"
            /* Wajib sejak `shape: "elbow"` ada. Tanpa ini sudut 90 derajatnya
               dipotong siku tajam yang menonjol setengah lebar garis di luar
               jalurnya — kecil, tapi terbaca sebagai cacat pada garis yang
               justru tugasnya terlihat presisi. */
            strokeLinejoin="round"
          />
          {variant === "beam" ? (
            <path
              data-lit={index}
              stroke={`url(#${uid}-g${index})`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}
