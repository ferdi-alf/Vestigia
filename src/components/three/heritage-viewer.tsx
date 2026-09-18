"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Spherical, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Heritage } from "@/data/types";
import { useI18n } from "@/lib/i18n/client";
import { useInView } from "@/lib/motion/use-in-view";
import { cn } from "@/lib/cn";

/* Panggung dimuat hanya di klien: WebGL tidak ada di server, dan menariknya
   ke bundle server hanya memperlambat render pertama tanpa menghasilkan
   satu piksel pun. */
const HeritageStage = dynamic(
  () => import("./heritage-stage").then((m) => m.HeritageStage),
  { ssr: false },
);

function ToolButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
        pressed
          ? "border-gold bg-gold/20 text-gold-dim"
          : "border-line bg-surface/80 text-ink-muted backdrop-blur-sm hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Penampil 3D.
 *
 * Dua gerbang yang terpisah, dan pemisahan itu yang penting:
 *
 * `defer` menentukan **kapan panggung dipasang**, sekali dan tidak pernah
 * dibatalkan. Di landing ia `true`, sehingga membuka halaman lalu berhenti di
 * hero tidak menarik satu byte GLB pun. Di halaman warisan ia `false`, karena
 * object itulah alasan orang membuka halamannya.
 *
 * `active` menentukan **apakah boleh menggambar sekarang**, dan ia naik-turun
 * sepanjang hidup komponen mengikuti posisi layar dan status tab. Panggung yang
 * sudah terpasang tidak pernah dilepas lagi — melepasnya berarti kehilangan
 * model yang sudah terurai dan sudut kamera yang sudah diatur pengguna, lalu
 * membayarnya lagi dari nol saat ia menggulir kembali.
 */
export function HeritageViewer({
  heritage,
  defer = false,
  idleLabel,
  initialAutoRotate = false,
  initialHotspots = true,
  released = false,
  fill = false,
  aspect = "aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9]",
}: {
  heritage: Heritage;
  defer?: boolean;
  idleLabel?: string;
  /**
   * Apakah object sudah berputar sendiri sejak awal.
   *
   * Bawaannya mati, dan itu benar di halaman warisan: di sana pengunjung datang
   * untuk MEMERIKSA satu benda, dan benda yang berputar sendiri saat ia sedang
   * dibaca adalah benda yang melawan pembacanya.
   *
   * Di landing kebalikannya. Di sana object bukan yang sedang diperiksa
   * melainkan yang sedang DIPERKENALKAN, dan putaran pelan adalah cara
   * tercepat menyebut "ini tiga dimensi, bukan gambar". Putarannya tetap
   * berhenti sendiri saat kanvas keluar layar — `autoRotate && active` di
   * `HeritageStage` — jadi ini bukan gerak yang berjalan selamanya tanpa
   * pemicu.
   */
  initialAutoRotate?: boolean;
  /**
   * Apakah penanda hotspot sudah menyala sejak awal.
   *
   * Dimatikan di landing: di sana wadahnya sudah dikelilingi tiga kartu
   * keterangan dan garis yang menghubungkannya, dan menambah pin 3D di atas
   * object berarti dua sistem keterangan bersaing pada bingkai yang sama.
   */
  initialHotspots?: boolean;
  /**
   * Lepaskan panggungnya sama sekali, bukan cuma hentikan.
   *
   * Bawaannya `false`, dan di halaman warisan ia memang harus begitu: melepas
   * panggung di sana berarti membuang sudut kamera yang baru saja diatur
   * pengguna. Di landing sebaliknya — section di bawahnya memasang kanvasnya
   * sendiri, dan §7 menuntut satu konteks WebGL per halaman.
   *
   * Melepasnya murah: `useGLTF` meng-cache GLB yang sudah terurai secara global
   * dan cache itu bertahan melewati unmount, jadi memasang ulang tidak
   * mengunduh atau mengurai apa pun lagi.
   */
  released?: boolean;
  /**
   * Isi penuh tinggi wadah pemanggil, bukan kotak beraspek tetap.
   *
   * **Ini memperbaiki cacat yang terukur, bukan menambah pilihan gaya.**
   * Halaman warisan membungkus penampil ini dengan `h-[72svh]`, tetapi tinggi
   * itu tidak pernah sampai ke kanvas: pembungkus di bawahnya cuma `relative`,
   * dan tinggi sesungguhnya datang dari `aspect-[16/9]` di cangkangnya. Jadi
   * yang berlaku `lebar_kolom x 9/16` — kebetulan mirip 72svh pada satu ukuran
   * jendela saja. Di jendela yang lebih tinggi tersisa ruang mati di dalam
   * bingkai membulat; di jendela yang lebih pendek kotak aspeknya melewati
   * batas lalu dipotong.
   *
   * Dengan `fill`, tinggi mengalir dari wadah sampai ke kanvas dan kotak
   * aspeknya dilepas. Landing tidak memakainya: di sana penampil berdiri di
   * dalam aliran biasa dan memang harus punya tinggi sendiri.
   */
  fill?: boolean;
  /**
   * Kelas rasio yang dipakai saat TIDAK `fill`.
   *
   * Ada karena satu pemanggil punya kendala tinggi yang tidak dimiliki
   * pemanggil lain: komposisi "Yang Hilang" di landing dipaku ke satu layar,
   * dan di ponsel rasio 4:3 memakan tinggi yang dibutuhkan baris keterangan dan
   * jarak bebas navbar. Menyetel rasio bawaannya akan menyeret halaman konsep C
   * dan panggung landing lama ikut berubah demi kendala yang bukan milik mereka.
   *
   * Bawaannya tetap perilaku lama, jadi pemanggil yang tidak menyetelnya tidak
   * berubah sama sekali.
   */
  aspect?: string;
}) {
  const { locale, dict } = useI18n();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [viewRef, { active, entered }] = useInView<HTMLDivElement>({ rootMargin: "300px" });

  const mounted = (!defer || entered) && !released;

  const [showHotspots, setShowHotspots] = useState(initialHotspots);
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const reset = useCallback(() => controlsRef.current?.reset(), []);

  const zoom = useCallback((factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const offset = controls.object.position.clone().sub(controls.target).multiplyScalar(factor);
    const distance = offset.length();
    if (distance < controls.minDistance || distance > controls.maxDistance) return;
    controls.object.position.copy(controls.target).add(offset);
    controls.update();
  }, []);

  /* Orbit dihitung langsung dalam koordinat bola alih-alih memanggil metode
     internal OrbitControls. Metode itu tidak ada di permukaan tipe publiknya,
     dan bergantung padanya berarti papan ketik bisa patah diam-diam pada
     pembaruan three.js berikutnya. */
  const orbit = useCallback((deltaAzimuth: number, deltaPolar: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const offset = new Vector3().subVectors(controls.object.position, controls.target);
    const spherical = new Spherical().setFromVector3(offset);
    spherical.theta += deltaAzimuth;
    spherical.phi = Math.min(
      controls.maxPolarAngle,
      Math.max(controls.minPolarAngle, spherical.phi + deltaPolar),
    );
    controls.object.position.copy(controls.target).add(offset.setFromSpherical(spherical));
    controls.object.lookAt(controls.target);
    controls.update();
  }, []);

  /* Papan ketik menggerakkan kamera lewat kontrol yang sama dengan tetikus,
     jadi keduanya tidak pernah kehilangan sinkron. */
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const onKey = (event: KeyboardEvent) => {
      if (!controlsRef.current) return;
      switch (event.key) {
        case "ArrowLeft":
          orbit(-0.12, 0);
          break;
        case "ArrowRight":
          orbit(0.12, 0);
          break;
        case "ArrowUp":
          orbit(0, -0.08);
          break;
        case "ArrowDown":
          orbit(0, 0.08);
          break;
        case "+":
        case "=":
          zoom(0.85);
          break;
        case "-":
        case "_":
          zoom(1.18);
          break;
        case "Home":
          reset();
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    shell.addEventListener("keydown", onKey);
    return () => shell.removeEventListener("keydown", onKey);
  }, [orbit, reset, zoom]);

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen?.();
  }, []);

  return (
    <div ref={viewRef} className={cn("relative", fill && "h-full")}>
      <div
        ref={shellRef}
        tabIndex={0}
        role="application"
        aria-label={`${dict.viewer.label} — ${heritage.name[locale]}`}
        className={cn(
          "relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          fill ? "h-full" : aspect,
        )}
      >
      {mounted ? (
        <div className="fade-in h-full w-full">
          <HeritageStage
            heritage={heritage}
            locale={locale}
            loadingLabel={dict.viewer.loading}
            closeLabel={dict.common.close}
            showHotspots={showHotspots}
            bare={fill}
            autoRotate={autoRotate}
            active={active}
            onControlsReady={(instance) => {
              controlsRef.current = instance;
            }}
          />
        </div>
      ) : (
        /* Komposisi dasar permanen. Ia bukan bingkai kosong menunggu diisi:
           kalau WebGL tidak ada, dekoder gagal, atau skrip tidak pernah jalan,
           inilah yang tetap terlihat. */
        <div
          className={cn(
            "stage-backdrop flex h-full w-full items-center justify-center",
            !fill && "rounded-xl border border-line",
          )}
        >
          <p className="max-w-xs px-6 text-center text-xs leading-relaxed text-ink-dim">
            {idleLabel ?? dict.viewer.loading}
          </p>
        </div>
      )}

      {mounted ? (
      <div
        /* `z-30`, alasan yang sama dengan kartu keterangan hotspot: penanda
           `<Html>` memakai z-index sampai 20, dan `stage-backdrop` di bawahnya
           tidak membentuk stacking context sendiri — jadi tanpa ini sebuah
           penanda yang mendarat di pojok kanan atas akan menimpa tombolnya.
           Kontrol tidak boleh pernah kalah oleh isi panggung. */
        className="absolute right-3 top-3 z-30 flex flex-col gap-1.5"
      >
        <ToolButton label={dict.viewer.zoomIn} onClick={() => zoom(0.85)}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13 13l4 4M9 6.5v5M6.5 9h5" strokeLinecap="round" />
          </svg>
        </ToolButton>
        <ToolButton label={dict.viewer.zoomOut} onClick={() => zoom(1.18)}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13 13l4 4M6.5 9h5" strokeLinecap="round" />
          </svg>
        </ToolButton>
        <ToolButton label={dict.viewer.reset} onClick={reset}>
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 10a6 6 0 106-6 6 6 0 00-4.6 2.2M4 4v3h3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolButton>
        <ToolButton
          label={dict.viewer.toggleHotspots}
          onClick={() => setShowHotspots((v) => !v)}
          pressed={showHotspots}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="10" cy="8" r="2.5" />
            <path d="M10 2.5c3 0 5.5 2.4 5.5 5.5 0 4-5.5 9.5-5.5 9.5S4.5 12 4.5 8C4.5 4.9 7 2.5 10 2.5z" strokeLinejoin="round" />
          </svg>
        </ToolButton>
        <ToolButton
          label={dict.viewer.autoRotate}
          onClick={() => setAutoRotate((v) => !v)}
          pressed={autoRotate}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="10" cy="10" rx="7" ry="3" />
            <path d="M10 3v14" strokeLinecap="round" />
          </svg>
        </ToolButton>
        <ToolButton
          label={isFullscreen ? dict.viewer.exitFullscreen : dict.viewer.fullscreen}
          onClick={toggleFullscreen}
          pressed={isFullscreen}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolButton>
      </div>
      ) : null}

      {mounted ? (
        <p
          /* Kiri ATAS, bukan kiri bawah.

             Di kaki panggung ia berbagi sudut dengan kartu keterangan hotspot,
             yang membentang `inset-x-3 bottom-3` — jadi begitu sebuah penanda
             dibuka, petunjuk ini tertimbun di bawahnya. Petunjuk cara memakai
             adalah hal yang dibaca SEBELUM menyentuh apa pun; menaruhnya di
             tempat yang tertutup oleh hasil sentuhan pertama membuatnya hilang
             tepat pada saat ia masih dibutuhkan.

             Sudut kiri atas kosong: perkakas duduk di kanan atas. */
          className="pointer-events-none absolute top-3 left-3 max-w-[60%] text-[0.7rem] leading-relaxed text-ink-dim"
        >
          {dict.viewer.controls.orbit} · {dict.viewer.controls.zoom}
        </p>
      ) : null}
      </div>
    </div>
  );
}
