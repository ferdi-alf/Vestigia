"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useProgress } from "@react-three/drei";
import type { Heritage } from "@/data/types";
import { STILL_POSE, poseAt, type CameraPose } from "@/data/hero-beats";
import { HeritageModel, type ResolvedModel } from "./heritage-model";

/** Derajat per detik untuk putaran diam sebelum film berangkat. */
const SPIN_SPEED = 2.4;

/** Progres saat putaran diam sudah sepenuhnya diserahkan ke kamera film. */
const SPIN_HANDOVER = 0.25;

export interface HeroProgress {
  value: number;
}

/**
 * Menerbangkan kamera dari nilai progres yang ditulis timeline di luar kanvas.
 *
 * Kamera dipegang **hanya** oleh komponen ini. Tidak ada OrbitControls di
 * panggung hero, dan itu disengaja: dua sistem yang sama-sama menulis posisi
 * kamera akan saling menimpa tiap frame, dan yang terlihat adalah getaran yang
 * mustahil ditelusuri.
 */
function CameraRig({
  progress,
  resolved,
  spin,
}: {
  progress: React.RefObject<HeroProgress>;
  resolved: ResolvedModel | null;
  spin: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const spun = useRef(0);

  useFrame((_, delta) => {
    const t = progress.current?.value ?? 0;
    const pose: CameraPose = spin ? poseAt(t) : STILL_POSE;

    /* Putaran diam melambat sampai berhenti begitu film berangkat, dan nilainya
       tidak pernah di-reset. Mengembalikannya ke nol akan membuat object
       tersentak balik tepat saat penonton mulai menggulir. */
    if (spin) {
      const weight = Math.max(0, 1 - t / SPIN_HANDOVER);
      spun.current += delta * SPIN_SPEED * weight;
    }

    const radius = (resolved?.radius ?? 1.6) * 2 * pose.distance;
    const az = ((pose.azimuth + spun.current) * Math.PI) / 180;
    const el = (pose.elevation * Math.PI) / 180;

    camera.position.set(
      radius * Math.cos(el) * Math.sin(az),
      radius * Math.sin(el),
      radius * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(0, (resolved?.height ?? 1) * pose.targetY, 0);
  });

  return null;
}

function LoadingLine({ label }: { label: string }) {
  const { progress } = useProgress();
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 flex flex-col items-center gap-2">
      <div className="h-px w-32 overflow-hidden bg-line">
        <div
          className="h-full bg-gold transition-[width] duration-300"
          style={{ width: `${Math.round(progress)}%` }}
        />
      </div>
      <p className="text-[0.65rem] tracking-[0.18em] text-ink-dim uppercase" role="status" aria-live="polite">
        {label} {Math.round(progress)}%
      </p>
    </div>
  );
}

/**
 * Panggung hero.
 *
 * Lebih ringan daripada penampil di halaman warisan, dan sengaja: tanpa kontrol,
 * tanpa bayangan, tanpa penanda hotspot, dpr dibatasi lebih rendah. Tugasnya
 * satu — menjadi subjek film, bukan alat pemeriksa.
 *
 * `frameloop` mengikuti keadaan. Putaran diam memang menuntut frame terus
 * menerus, jadi selama hero terlihat nilainya "always"; begitu ia keluar layar
 * atau tab berpindah, "never" menghentikannya sepenuhnya. Saat gerak dikurangi
 * tidak ada yang bergerak sama sekali, jadi "demand" sudah cukup.
 */
export function HeroStage({
  heritage,
  progress,
  active,
  spin,
  loadingLabel,
}: {
  heritage: Heritage;
  progress: React.RefObject<HeroProgress>;
  active: boolean;
  spin: boolean;
  loadingLabel: string;
}) {
  const [resolved, setResolved] = useState<ResolvedModel | null>(null);
  const handleReady = useCallback((result: ResolvedModel) => setResolved(result), []);

  return (
    <div className="absolute inset-0" data-hero-canvas>
      <Canvas
        frameloop={active ? (spin ? "always" : "demand") : "never"}
        dpr={[1, 1.75]}
        camera={{ fov: 40, near: 0.05, far: 120, position: [0, 1, 5] }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Pantulan tanah dinaikkan dari cokelat gelap ke kapur, dan intensitas
            hemisfernya hampir dua kali lipat.

            Alasannya bukan selera. Object ini kini berdiri di atas kertas
            terang, dan kertas memantulkan cahaya kembali ke sisi bawahnya. Kalau
            nilai lama dipertahankan, sisi yang membelakangi matahari jatuh ke
            hitam pekat sementara latarnya nyaris putih — object berhenti terbaca
            sebagai batu dan mulai terbaca sebagai lubang di halaman. */}
        <hemisphereLight args={["#fff3e0", "#c9b79a", 0.75]} />
        {/* Matahari dari kiri-depan-atas, sama dengan seluruh gambar di situs
            ini. Itulah yang membuat render dan foto terbaca berada di tempat
            yang sama. Posisinya TIDAK PERNAH berubah — arah cahaya adalah
            bagian dari identitas, bukan parameter yang disetel per tema. Yang
            turun hanya intensitasnya, karena latar terang sudah menyumbang
            pantulan yang dulu harus datang dari lampu ini.

            Tanpa bayangan: satu shadow map di hero berarti biaya tiap frame
            selama putaran diam berjalan, untuk bayangan yang jatuh di tanah yang
            tidak pernah dirender. */}
        <directionalLight position={[3, 4.5, 2.5]} intensity={2.0} />
        <directionalLight position={[-3, 2, -2]} intensity={0.7} />

        <Suspense fallback={null}>
          <HeritageModel heritage={heritage} onReady={handleReady} />
        </Suspense>

        {/* Kontak dengan tanah. Tanpa ini object melayang di atas lanskap alih-alih
            berdiri di dalamnya, dan mata langsung menangkapnya sebagai tempelan.

            Dibuat di 3D, bukan sebagai gambar, karena satu alasan yang menentukan:
            kamera bergerak sepanjang film, dan bayangan yang diam sementara
            sudut pandangnya berubah justru lebih salah daripada tidak ada
            bayangan sama sekali.

            `frames={1}` membakarnya sekali. Object tidak pernah berpindah —
            yang berpindah kameranya — jadi bayangannya tidak perlu dihitung
            ulang tiap frame. Di-key pada model supaya ia dibakar ulang setelah
            geometrinya benar-benar ada. */}
        {resolved ? (
          <ContactShadows
            key={heritage.slug}
            frames={1}
            position={[0, 0.001, 0]}
            scale={resolved.radius * 6}
            blur={2.6}
            /* Bayang kontak disetel ulang untuk kertas. Nyaris hitam pada 0,55
               dulu nyaris tidak terlihat karena panggungnya sudah gelap; di atas
               kertas nilai yang sama jadi noda pekat, dan object terbaca seperti
               ditempel alih-alih berdiri. Yang dipakai sekarang cokelat bayang
               hangat pada opacity lebih rendah — cukup untuk mengikat object ke
               tanah, tidak cukup untuk jadi bentuk tersendiri. */
            opacity={0.34}
            far={resolved.height * 1.2}
            resolution={512}
            color="#4a3c28"
          />
        ) : null}

        {/* Intensitas environment naik sejalan dengan latar yang kini terang:
            permukaan menghadap atas harus memantulkan langit yang cerah, bukan
            langit malam. */}
        <Environment resolution={32} frames={1} environmentIntensity={0.7}>
          <Lightformer intensity={2.4} color="#fff1dc" position={[-2, 4, 2]} scale={[8, 8, 1]} />
          <Lightformer intensity={0.7} color="#8fa9c9" position={[4, 1, -2]} scale={[6, 6, 1]} />
        </Environment>

        <CameraRig progress={progress} resolved={resolved} spin={spin} />
      </Canvas>

      {resolved ? null : <LoadingLine label={loadingLabel} />}
    </div>
  );
}
