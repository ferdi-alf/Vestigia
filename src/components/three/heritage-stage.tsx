"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useProgress } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Heritage, Locale } from "@/data/types";
import { HeritageModel, type ResolvedModel } from "./heritage-model";
import { HotspotMarkers } from "./hotspot-markers";

/** Sudut pandang bawaan kalau situs tidak menyetel presetnya sendiri. */
const DEFAULT_CAMERA = { azimuth: -35, elevation: 22, distance: 1, targetY: 0.4 };

function toPosition(azimuth: number, elevation: number, radius: number) {
  const az = (azimuth * Math.PI) / 180;
  const el = (elevation * Math.PI) / 180;
  return [
    radius * Math.cos(el) * Math.sin(az),
    radius * Math.sin(el),
    radius * Math.cos(el) * Math.cos(az),
  ] as const;
}

/**
 * Menggambar satu bingkai ketika panggung kembali aktif.
 *
 * `frameloop="never"` berarti benar-benar tidak ada yang digambar — termasuk
 * bingkai pertama setelah kembali terlihat. Tanpa dorongan ini kanvas akan
 * memperlihatkan isi buffer yang basi sampai pengguna kebetulan menyentuhnya.
 */
function ResumeOnActive({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}

function LoadingVeil({ label }: { label: string }) {
  const { progress } = useProgress();
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="h-px w-40 overflow-hidden bg-line">
        <div
          className="h-full bg-gold transition-[width] duration-300"
          style={{ width: `${Math.round(progress)}%` }}
        />
      </div>
      <p className="text-xs tracking-wide text-ink-dim" role="status" aria-live="polite">
        {label} {Math.round(progress)}%
      </p>
    </div>
  );
}

/**
 * Panggung 3D.
 *
 * `frameloop="demand"` adalah keputusan yang paling menentukan di sini.
 * Mengorbit menggerakkan kamera, bukan geometri, jadi tidak ada alasan
 * menggambar ulang enam puluh kali per detik saat tidak ada yang berubah.
 * Efeknya paling terasa di laptop dan ponsel: kipas tidak menyala dan baterai
 * tidak terkuras hanya karena satu tab terbuka di halaman ini.
 */
export function HeritageStage({
  heritage,
  locale,
  loadingLabel,
  showHotspots,
  autoRotate,
  active,
  onControlsReady,
}: {
  heritage: Heritage;
  locale: Locale;
  loadingLabel: string;
  showHotspots: boolean;
  autoRotate: boolean;
  /** false ketika kanvas keluar layar atau tab disembunyikan */
  active: boolean;
  onControlsReady?: (controls: OrbitControlsImpl | null) => void;
}) {
  const [resolved, setResolved] = useState<ResolvedModel | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const preset = heritage.camera ?? DEFAULT_CAMERA;
  const radius = (resolved?.radius ?? 1.6) * 2.4 * preset.distance;
  const position = toPosition(preset.azimuth, preset.elevation, radius);
  const targetY = (resolved?.height ?? 1) * preset.targetY;

  const handleReady = useCallback((result: ResolvedModel) => setResolved(result), []);

  return (
    <div className="stage-backdrop relative h-full w-full overflow-hidden rounded-xl border border-line">
      <Canvas
        /* "demand" sudah berarti tidak menggambar tanpa perubahan, tetapi
           "never" lebih tegas: saat panggung keluar layar atau tab berpindah,
           tidak ada satu pun jalan yang tersisa untuk memicu gambar ulang —
           termasuk dari damping kontrol yang masih mengendap. */
        frameloop={active ? "demand" : "never"}
        shadows
        dpr={[1, 2]}
        camera={{ fov: 38, near: 0.05, far: 100, position: [...position] }}
        gl={{ antialias: true, alpha: true }}
        // Kanvas transparan: latar dilukis di CSS supaya tidak ikut kena tone
        // mapping dan tetap sewarna dengan UI di sekitarnya.
        style={{ background: "transparent" }}
      >
        {/* Matahari keras di atas ambient lembut: bentuk terbaca lewat bayangan
            alih-alih tercuci rata. Satu directional light saja yang berbayang —
            dua sudah menggandakan biaya shadow map tanpa manfaat yang terlihat. */}
        {/* Pantulan tanah jadi kapur dan intensitasnya dinaikkan — object kini
            berdiri di atas kertas terang, dan kertas memantulkan cahaya kembali
            ke sisi bawahnya. Tanpa ini sisi bayangnya jatuh ke hitam pekat di
            depan latar nyaris putih, dan batu berhenti terbaca sebagai batu. */}
        <hemisphereLight args={["#fff3e0", "#c9b79a", 0.7]} />
        <directionalLight
          position={[3, 4.5, 2.5]}
          intensity={2.0}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-2.5}
          shadow-camera-right={2.5}
          shadow-camera-top={2.5}
          shadow-camera-bottom={-2.5}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.7} />

        <ResumeOnActive active={active} />

        <Suspense fallback={null}>
          <HeritageModel heritage={heritage} onReady={handleReady} />
        </Suspense>

        {/* Environment dirakit dari lightformer, bukan diunduh sebagai HDR.
            Preset drei mengambil berkas beberapa megabyte dari CDN pihak ketiga —
            satu titik gagal di luar kendali kita, untuk sesuatu yang di sini
            hanya perlu memberi pantulan langit hangat dan pantulan tanah. */}
        <Environment resolution={64} frames={1} environmentIntensity={0.65}>
          <Lightformer intensity={2.2} color="#fff1dc" position={[0, 5, -2]} scale={[10, 10, 1]} />
          {/* Satu-satunya warna dingin yang diizinkan arah seni, dan hanya
              sebagai isian tepi. Dipertahankan apa adanya. */}
          <Lightformer intensity={0.8} color="#8fa9c9" position={[-5, 2, 2]} scale={[8, 8, 1]} />
          {/* Bidang pantul tanah. Dulu cokelat gelap karena panggungnya lantai
              batu dalam bayang; sekarang kapur, karena yang ada di bawah object
              adalah kertas terang. */}
          <Lightformer intensity={0.7} color="#cbbba0" position={[0, -4, 0]} scale={[12, 12, 1]} rotation={[Math.PI / 2, 0, 0]} />
        </Environment>

        {resolved ? (
          <HotspotMarkers
            heritage={heritage}
            anchors={resolved.anchors}
            locale={locale}
            activeId={activeHotspot}
            onSelect={setActiveHotspot}
            visible={showHotspots}
          />
        ) : null}

        <OrbitControls
          ref={(instance) => {
            controlsRef.current = instance;
            onControlsReady?.(instance);
          }}
          makeDefault
          target={[0, targetY, 0]}
          enablePan
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate && active}
          autoRotateSpeed={0.6}
          minDistance={radius * 0.35}
          maxDistance={radius * 2.5}
          // Di bawah horizon hanya terlihat bagian bawah model yang tidak
          // pernah dimodelkan; di atas 85° kamera terkunci pada kutub.
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>

      {resolved ? null : <LoadingVeil label={loadingLabel} />}
    </div>
  );
}
