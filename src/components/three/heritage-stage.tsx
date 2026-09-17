"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useProgress } from "@react-three/drei";
import type * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Heritage, Locale } from "@/data/types";
import { cn } from "@/lib/cn";
import { EASE, gsap } from "@/lib/motion/use-scroll-scene";
import { HeritageModel, type ResolvedModel } from "./heritage-model";
import { HotspotDetail, HotspotMarkers } from "./hotspot-markers";

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
/**
 * Satu putaran penuh — bukan sepertiga.
 *
 * Yang lama berputar 111 derajat lalu berhenti, dan sudut sembarang seperti itu
 * terbaca sebagai object yang BERAYUN lalu ditahan. Satu putaran utuh mendarat
 * pada bearing-nya sendiri: sudut akhirnya sama dengan sudut awalnya, jadi yang
 * terlihat sebuah benda yang diputar lalu melambat sampai diam, bukan sebuah
 * benda yang diseret ke posisi.
 */
const TURN = Math.PI * 2;

/** Skala awal. Object tumbuh dari tapaknya sendiri — grupnya beralas di y=0
    setelah normalisasi, jadi menskalakan grup tidak pernah mengangkatnya. */
const SETTLE_SCALE = 0.9;

/** Ketinggian awal, pengali tinggi model. Kecil dengan sengaja: yang dicari
    rasa mendarat, bukan benda yang jatuh. */
const SETTLE_LIFT = 0.05;

/**
 * Object mendarat masuk saat dibuka, sekali.
 *
 * Digantung pada satu-satunya sambungan yang tepat: `resolved` berbalik
 * `null -> ResolvedModel` PERSIS SEKALI, ketika model selesai dimuat dan
 * dinormalkan. Sebelum itu tidak ada yang bisa diputar; sesudah itu tidak
 * pernah terjadi lagi sampai panggungnya di-mount ulang — dan berpindah situs
 * memang me-mount ulang, karena tiap warisan adalah route-nya sendiri.
 *
 * ---
 *
 * **TIGA PROPERTI, SATU DESELERASI.** Versi pertama cuma memutar, dan yang
 * dikeluhkan pemilik project bukan putarannya melainkan KEMUNCULANNYA: tirai
 * pemuatan hilang dan object berdiri utuh pada bingkai yang sama, seukuran
 * penuh, lalu barulah ia berayun.
 *
 * Terukur di peramban sebelum diubah: p50 8,3 ms, p99 8,6 ms, nol bingkai di
 * atas 33 ms sepanjang enam detik pertama. Jadi kekasarannya bukan frame yang
 * jatuh — tidak ada satu pun yang jatuh — melainkan tidak adanya kedatangan.
 *
 * Yang ditambahkan dua hal yang ikut mengendap pada deselerasi yang sama:
 * object tumbuh dari 0,9 ke ukurannya, dan turun sedikit ke alasnya. Ketiganya
 * `power3.out`, jadi ketiganya melambat bersamaan dan yang terbaca satu gerak,
 * bukan tiga.
 *
 * Skala dan ketinggian berhenti lebih dulu daripada putarannya. Object sudah
 * berdiri pada ukuran dan tempatnya sementara putarannya masih mengendap —
 * itu yang membuat ekornya terasa sebagai object yang melambat, bukan sebagai
 * animasi yang masih berjalan.
 *
 * **`invalidate()` di tiap update bukan kehati-hatian berlebihan.** Kanvas ini
 * `frameloop="demand"`: tidak ada satu pun bingkai yang tergambar sendiri. Tanpa
 * dorongan itu yang terlihat cuma bingkai pertama dan terakhir — objectnya
 * melompat ke pose akhir alih-alih berputar ke sana. Ia dipasang pada
 * TIMELINE-nya, bukan pada ketiga tween: satu dorongan per bingkai, bukan tiga.
 *
 * Gerak dikurangi: tidak ada tween sama sekali, dan ketiga properti dibiarkan
 * pada nilai akhirnya. Object langsung berdiri pada pose akhirnya (§10).
 */
function EntranceSpin({
  ready,
  /** tinggi model yang sudah dinormalkan; skala ketinggian awalnya */
  height,
  children,
}: {
  ready: boolean;
  height: number;
  children: React.ReactNode;
}) {
  const invalidate = useThree((state) => state.invalidate);
  /* Grupnya DIMILIKI komponen ini, tidak diterima sebagai prop.

     Menerima ref lalu menulis ke dalamnya berarti komponen mengubah nilai milik
     pemanggilnya, dan `react-hooks/immutability` menolaknya dengan benar. Pola
     yang sama sudah dipakai `advance` di globe pembuka dan `publish` di film
     penyelaman: yang menulis adalah yang memiliki. */
  const group = useRef<THREE.Group>(null);

  useEffect(() => {
    const node = group.current;
    if (!node || !ready) return;

    const rest = () => {
      node.rotation.y = 0;
      node.position.y = 0;
      node.scale.setScalar(1);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rest();
      invalidate();
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: EASE.enter }, onUpdate: invalidate });
    tl.fromTo(node.rotation, { y: -TURN }, { y: 0, duration: 1.25 }, 0)
      .fromTo(
        node.scale,
        { x: SETTLE_SCALE, y: SETTLE_SCALE, z: SETTLE_SCALE },
        { x: 1, y: 1, z: 1, duration: 0.9 },
        0,
      )
      .fromTo(node.position, { y: height * SETTLE_LIFT }, { y: 0, duration: 0.9 }, 0);

    return () => {
      tl.kill();
      rest();
    };
  }, [ready, height, invalidate]);

  return <group ref={group}>{children}</group>;
}

export function HeritageStage({
  heritage,
  locale,
  loadingLabel,
  closeLabel,
  showHotspots,
  autoRotate,
  active,
  bare = false,
  onControlsReady,
}: {
  heritage: Heritage;
  locale: Locale;
  loadingLabel: string;
  closeLabel: string;
  showHotspots: boolean;
  autoRotate: boolean;
  /** false ketika kanvas keluar layar atau tab disembunyikan */
  active: boolean;
  /**
   * Lepaskan bingkai milik panggung sendiri.
   *
   * Dipakai ketika pemanggilnya SUDAH memberi bingkai. Tanpa ini halaman
   * warisan menumpuk dua: `rounded-2xl border` miliknya membungkus
   * `rounded-xl border` milik panggung, berjarak satu piksel — dua garis
   * sejajar yang terbaca sebagai kesalahan render, bukan sebagai desain.
   */
  bare?: boolean;
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
    <div
      className={cn(
        "stage-backdrop relative h-full w-full overflow-hidden",
        !bare && "rounded-xl border border-line",
      )}
    >
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
          {/* Model sudah dinormalkan ke titik asal oleh `normalizeModel`, jadi
              memutar grup pembungkusnya memutarnya tepat pada sumbunya sendiri.

              **Penanda hotspot IKUT DI DALAM grup ini**, dan itu memperbaiki
              cacat yang sudah ada sejak putaran masuk dipasang: `anchors`
              berada di ruang koordinat model, sementara penandanya dirender di
              luar grup yang sedang diputar. Selama animasi masuk berjalan,
              kelima belas penanda berdiri diam di pose akhir sementara objectnya
              berputar di bawahnya. Di dalam grup, keduanya memakai matriks dunia
              yang sama dan tidak pernah bisa berbeda.

              `<Html>` tanpa prop `transform` memproyeksikan titiknya lalu
              menaruh DOM seukuran layar, jadi ia mengikuti putaran dan skalanya
              tanpa ikut mengecil. */}
          <EntranceSpin ready={resolved !== null} height={resolved?.height ?? 1}>
            <HeritageModel heritage={heritage} onReady={handleReady} />

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
          </EntranceSpin>
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

      {/* Keterangan hotspot hidup DI SINI, di luar `<Canvas>`.

          Di dalam `<Html>` ia punya dua masalah sekaligus: ia menimpa bagian
          object yang sedang ditunjuk, dan `occlude="blending"` ikut mencampurnya
          dengan geometri di depannya sehingga teksnya sendiri jadi buram. Di
          lapisan ini tidak ada occlusion sama sekali, dan ia bisa bertambat ke
          tepi bawah wadah alih-alih mengambang di atas subjeknya. */}
      <HotspotDetail
        heritage={heritage}
        locale={locale}
        activeId={showHotspots ? activeHotspot : null}
        onClose={() => setActiveHotspot(null)}
        closeLabel={closeLabel}
      />
    </div>
  );
}
