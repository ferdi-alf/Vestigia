"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useProgress } from "@react-three/drei";
import * as THREE from "three";
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
 * Menggambar satu bingkai ketika panggung kembali aktif, atau ketika kontrol
 * baru saja diserahkan kembali ke pengguna.
 *
 * `frameloop="never"` berarti benar-benar tidak ada yang digambar — termasuk
 * bingkai pertama setelah kembali terlihat. Tanpa dorongan ini kanvas akan
 * memperlihatkan isi buffer yang basi sampai pengguna kebetulan menyentuhnya.
 *
 * **`settled` ikut jadi pemicu, dan itu bukan kehati-hatian berlebihan.**
 * Putaran otomatis di bawah `frameloop="demand"` menyalakan dirinya sendiri:
 * `useFrame` milik `OrbitControls` memanggil `update()`, `update()` menggeser
 * kamera, pergeseran itu memancarkan `change`, dan `change` memanggil
 * `invalidate()` yang menjadwalkan bingkai berikutnya. Rantai itu butuh satu
 * bingkai untuk dimulai, dan `useFrame`-nya hanya berjalan selagi kontrolnya
 * `enabled`.
 *
 * Sejak kontrol dilepas selama penerbangan masuk, bingkai penyulut itu tidak
 * pernah ada: pada bingkai terakhir penerbangan kontrolnya masih mati, dan saat
 * ia dinyalakan lagi tidak ada satu pun yang meminta gambar ulang. Terukur di
 * peramban — object berdiri diam sepenuhnya, dan menyeretnya dengan tetikus
 * tetap bekerja, yang membuktikan kontrolnya memang sudah hidup. Satu dorongan
 * di sini menyalakan rantainya.
 */
function ResumeOnActive({ active, settled }: { active: boolean; settled: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, settled, invalidate]);
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
/* ══ Penerbangan masuk ═════════════════════════════════════ */

/** Sudut kutub awal, radian dari sumbu tegak. Nyaris lurus dari atas. */
const INTRO_PHI = 0.17;

/** Jarak awal sebagai pecahan jarak akhir — mulai dekat, lalu menjauh. */
const INTRO_CLOSE = 0.5;

/** Sapuan mendatar sepanjang penerbangan, radian. Sekitar 75 derajat. */
const INTRO_SWEEP = Math.PI * 0.42;

/** Lama penerbangan, detik. */
const INTRO_FLIGHT = 1.9;

/**
 * Kamera terbang masuk: dari atas, menjauh, sambil menyapu.
 *
 * ---
 *
 * **Yang berpindah kini KAMERA, bukan modelnya.** Versi sebelumnya memutar grup
 * pembungkus model satu putaran penuh sambil menskalakannya. Itu memperbaiki
 * keluhan waktu itu — object yang muncul utuh seketika — tetapi ia memutar
 * BENDANYA, dan benda yang berputar sendiri saat pertama dilihat menyiratkan
 * bahwa begitulah ia berdiri di dunia.
 *
 * Memindahkan gerak ke kamera mengubah kalimatnya: yang bergerak adalah
 * pengamat. Ia juga membayar dua hal sekaligus yang dulu harus diurus terpisah
 * — model tidak pernah meninggalkan transform identitas, jadi jangkar hotspot
 * dan garis pandang selalu diukur pada geometri yang diam, dan penanda tidak
 * perlu lagi ikut dimasukkan ke dalam grup yang berputar.
 *
 * **Urutannya seluruh maksudnya.** Bingkai pertama adalah denah dari atas:
 * sebuah bentuk yang terbaca sebagai RENCANA, bukan sebagai foto. Lalu kamera
 * mundur dan turun ke sudut baca sambil menyapu mendatar, dan bentuk itu
 * berubah jadi bangunan. Sapuan mendatarnya berakhir pada azimut preset dan
 * diserahkan ke putaran otomatis yang memang sudah ada — tidak ada bingkai di
 * mana putarannya berhenti lalu mulai lagi.
 *
 * Kontrol dilepas selama terbang — lewat prop `enabled` milik `OrbitControls`,
 * bukan dengan menulis propertinya. Kamera diposisikan langsung dari koordinat
 * bola, dan kontrol yang hidup akan mengedam posisi yang baru saja ditulis lalu
 * menariknya balik.
 *
 * `saveState()` dipanggil saat mendarat, dan itu memperbaiki cacat diam-diam:
 * tombol reset mengembalikan kamera ke pose yang direkam `OrbitControls` saat
 * ia DIBANGUN — yaitu sebelum model selesai dimuat, jadi sebelum jarak dan
 * titik pandangnya diketahui. Merekam ulang di sini membuat reset pulang ke
 * bingkai pembuka yang sebenarnya.
 *
 * Gerak dikurangi: tidak ada tween sama sekali, kamera langsung berdiri pada
 * pose akhirnya (§10).
 */
function CameraFlight({
  ready,
  azimuth,
  elevation,
  distance,
  targetY,
  onSettled,
}: {
  ready: boolean;
  azimuth: number;
  elevation: number;
  distance: number;
  targetY: number;
  onSettled: () => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  /* `makeDefault` pada `OrbitControls` mendaftarkannya ke store R3F, jadi ia
     bisa diambil dari sini tanpa satu pun ref yang dioper turun. */
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  useEffect(() => {
    if (!ready || !controls) return;

    const camera = controls.object;
    const target = new THREE.Vector3(0, targetY, 0);
    const spherical = new THREE.Spherical();

    const end = {
      r: distance,
      phi: Math.PI / 2 - (elevation * Math.PI) / 180,
      theta: (azimuth * Math.PI) / 180,
    };

    const apply = (pose: typeof end) => {
      controls.target.copy(target);
      spherical.set(pose.r, pose.phi, pose.theta);
      camera.position.setFromSpherical(spherical).add(target);
      camera.lookAt(target);
      controls.update();
      invalidate();
    };

    const land = () => {
      controls.saveState();
      onSettled();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(end);
      land();
      return;
    }

    const pose = {
      r: end.r * INTRO_CLOSE,
      phi: INTRO_PHI,
      theta: end.theta - INTRO_SWEEP,
    };
    apply(pose);

    const tween = gsap.to(pose, {
      r: end.r,
      phi: end.phi,
      theta: end.theta,
      duration: INTRO_FLIGHT,
      ease: EASE.enter,
      onUpdate: () => apply(pose),
      onComplete: land,
    });

    return () => {
      tween.kill();
    };
  }, [ready, controls, azimuth, elevation, distance, targetY, onSettled, invalidate]);

  return null;
}

/* ══ Fokus hotspot ═════════════════════════════════════════ */

/** Jarak pandang saat hotspot dipilih, pengali radius model. */
const FOCUS_DISTANCE = 0.9;

/** Langkah pencarian azimut saat pandangan terhalang, radian. 15 derajat. */
const PROBE_STEP = Math.PI / 12;

/** Berapa langkah dicoba ke tiap arah sebelum menyerah. 12 x 15 = setengah putaran. */
const PROBE_STEPS = 12;

/** Elevasi cadangan kalau tidak ada azimut yang bersih pada elevasi sekarang. */
const PROBE_PHI = [Math.PI * 0.34, Math.PI * 0.46];

/**
 * Sudut pandang yang benar-benar MELIHAT titik itu.
 *
 * Masalahnya konkret dan tidak bisa dijawab dengan aritmetika: hotspot menempel
 * pada permukaan, dan permukaan punya dua sisi. Mendekat lurus dari tempat
 * kamera kebetulan berdiri berarti, pada separuh kemungkinan, menembus dinding
 * yang justru sedang ditunjuk — yang terlihat bukan relief melainkan bagian
 * dalam batu, atau layar yang tiba-tiba gelap.
 *
 * Jadi sebelum bergerak, sebuah sinar ditembakkan dari titik itu KE ARAH kamera
 * yang direncanakan, sepanjang jarak yang direncanakan. Kalau ia mengenai
 * sesuatu, jalur itu ditolak dan azimut digeser lima belas derajat lalu dicoba
 * lagi, bergantian ke kiri dan ke kanan supaya yang terpilih selalu yang
 * TERDEKAT dengan sudut pandang sekarang — memutar sedikit lebih bisa diikuti
 * mata daripada melompat ke seberang.
 *
 * Kalau setengah putaran penuh tidak menemukan apa pun, elevasinya dinaikkan
 * dan pencariannya diulang: banyak hotspot berada di ceruk yang tertutup dari
 * samping tetapi terbuka dari atas.
 *
 * Sinarnya berangkat sedikit DI LUAR permukaan, bukan dari titiknya persis.
 * Hotspot memang menempel pada kulit model; menembak dari tepat di permukaan
 * akan selalu mengenai permukaan itu sendiri dan tidak satu pun arah akan
 * pernah dinyatakan bersih.
 *
 * Selalu mengembalikan sesuatu. Sudut yang sedikit meleset jauh lebih baik
 * daripada klik yang tidak menghasilkan apa-apa.
 */
function findClearView(
  point: THREE.Vector3,
  meshes: THREE.Mesh[],
  distance: number,
  fromTheta: number,
  fromPhi: number,
  modelRadius: number,
  minPhi: number,
  maxPhi: number,
): { theta: number; phi: number; turned: boolean } {
  const raycaster = new THREE.Raycaster();
  raycaster.firstHitOnly = true;
  raycaster.far = distance;

  const direction = new THREE.Vector3();
  const origin = new THREE.Vector3();

  const clear = (theta: number, phi: number) => {
    direction.setFromSphericalCoords(1, phi, theta);
    origin.copy(point).addScaledVector(direction, modelRadius * 0.04);
    raycaster.set(origin, direction);
    return raycaster.intersectObjects(meshes, false).length === 0;
  };

  const clampPhi = (phi: number) => Math.min(maxPhi, Math.max(minPhi, phi));

  const levels = [fromPhi, ...PROBE_PHI.map(clampPhi)];

  for (let level = 0; level < levels.length; level += 1) {
    const phi = levels[level];
    for (let step = 0; step <= PROBE_STEPS; step += 1) {
      for (const sign of step === 0 ? [1] : [1, -1]) {
        const theta = fromTheta + sign * step * PROBE_STEP;
        if (clear(theta, phi)) {
          return { theta, phi, turned: step > 0 || level > 0 };
        }
      }
    }
  }

  return { theta: fromTheta, phi: fromPhi, turned: false };
}

/**
 * Mendekat ke hotspot yang dipilih — memutar dulu bila perlu, baru mendekat.
 *
 * Dua fase, dan pemisahannya bukan kosmetik. Memutar dan mendekat sekaligus
 * menghasilkan jalur melengkung yang menyapu masuk ke samping bangunan; mata
 * kehilangan jejak benda yang ditunjuk di tengah jalan. Memutar lebih dulu
 * sampai titiknya benar-benar terlihat, lalu mendekat lurus, membuat kedua
 * gerakannya masing-masing punya satu hal untuk dibaca.
 *
 * Fase pertama dilewati sama sekali kalau pandangannya memang sudah bersih.
 *
 * Titik orbit ikut pindah ke hotspotnya, jadi memutar sesudahnya berputar
 * mengelilingi bagian yang sedang dibaca, bukan mengelilingi pusat bangunan.
 * Tombol reset mengembalikan keduanya ke bingkai pembuka.
 */
function HotspotFocus({
  point,
  meshes,
  modelRadius,
  enabled,
  onBusy,
}: {
  point: THREE.Vector3 | null;
  meshes: THREE.Mesh[] | null;
  modelRadius: number;
  enabled: boolean;
  /** Umumkan bahwa kamera sedang dikemudikan, supaya kontrol pengguna dilepas. */
  onBusy: (busy: boolean) => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  useEffect(() => {
    if (!enabled || !point || !meshes || !controls) return;

    const camera = controls.object;
    const spherical = new THREE.Spherical().setFromVector3(
      new THREE.Vector3().subVectors(camera.position, controls.target),
    );

    const distance = Math.max(controls.minDistance * 1.05, modelRadius * FOCUS_DISTANCE);
    const view = findClearView(
      point,
      meshes,
      distance,
      spherical.theta,
      spherical.phi,
      modelRadius,
      controls.minPolarAngle,
      controls.maxPolarAngle,
    );

    const pose = {
      r: spherical.radius,
      theta: spherical.theta,
      phi: spherical.phi,
      tx: controls.target.x,
      ty: controls.target.y,
      tz: controls.target.z,
    };

    const carrier = new THREE.Spherical();
    const apply = () => {
      controls.target.set(pose.tx, pose.ty, pose.tz);
      carrier.set(pose.r, pose.phi, pose.theta);
      camera.position.setFromSpherical(carrier).add(controls.target);
      camera.lookAt(controls.target);
      controls.update();
      invalidate();
    };

    const arrive = {
      r: distance,
      theta: view.theta,
      phi: view.phi,
      tx: point.x,
      ty: point.y,
      tz: point.z,
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Object.assign(pose, arrive);
      apply();
      return;
    }

    onBusy(true);
    const timeline = gsap.timeline({
      defaults: { ease: EASE.enter, onUpdate: apply },
      onComplete: () => onBusy(false),
    });

    /* Fase satu HANYA kalau jalurnya memang terhalang. Memutar ketika tidak ada
       yang menghalangi cuma menambah gerak yang tidak menjelaskan apa-apa. */
    if (view.turned) {
      timeline.to(pose, { theta: view.theta, phi: view.phi, duration: 0.8 });
    }
    timeline.to(pose, { ...arrive, duration: 0.95 });

    return () => {
      timeline.kill();
      onBusy(false);
    };
  }, [enabled, point, meshes, modelRadius, controls, invalidate, onBusy]);

  return null;
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
  /**
   * Apakah penerbangan masuk sudah mendarat.
   *
   * Gerbang untuk dua hal yang keduanya menulis pose kamera dan karena itu
   * tidak boleh hidup selagi penerbangan berjalan: putaran otomatis, dan fokus
   * hotspot. §6 — satu pemilik per properti animasi.
   */
  const [settled, setSettled] = useState(false);
  /** Kamera sedang dikemudikan menuju sebuah hotspot. */
  const [steering, setSteering] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const preset = heritage.camera ?? DEFAULT_CAMERA;
  const modelRadius = resolved?.radius ?? 1.6;
  const radius = modelRadius * 2.4 * preset.distance;
  const position = toPosition(preset.azimuth, preset.elevation, radius);
  const targetY = (resolved?.height ?? 1) * preset.targetY;

  const handleReady = useCallback((result: ResolvedModel) => setResolved(result), []);
  const handleSettled = useCallback(() => setSettled(true), []);
  const handleSteering = useCallback((busy: boolean) => setSteering(busy), []);

  /* Jangkar hotspot yang sedang dipilih, atau null. Dihitung di sini supaya
     `HotspotFocus` menerima titik yang sudah jadi alih-alih ikut tahu tentang
     peta jangkar dan id. */
  const focusPoint = activeHotspot ? (resolved?.anchors.get(activeHotspot) ?? null) : null;

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

        <ResumeOnActive active={active} settled={settled} />

        {/* Modelnya TIDAK PERNAH dianimasikan lagi — yang bergerak kamera.

            Konsekuensinya bukan cuma soal rasa: grup pembungkus yang dulu
            diputar membuat matriks dunia model berubah selama animasi masuk,
            sehingga penanda hotspot harus ikut dimasukkan ke dalamnya supaya
            tidak tertinggal. Dengan model yang selalu pada transform identitas,
            jangkar hotspot dan uji garis pandang keduanya diukur pada geometri
            yang diam, dan penandanya kembali berdiri sebagai saudara. */}
        <Suspense fallback={null}>
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
        </Suspense>

        <CameraFlight
          ready={resolved !== null}
          azimuth={preset.azimuth}
          elevation={preset.elevation}
          distance={radius}
          targetY={targetY}
          onSettled={handleSettled}
        />

        <HotspotFocus
          point={focusPoint}
          meshes={resolved?.meshes ?? null}
          modelRadius={modelRadius}
          enabled={settled}
          onBusy={handleSteering}
        />

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
          /* Dilepas selama kamera dikemudikan sendiri: penerbangan masuk dan
             pendekatan ke hotspot keduanya menulis pose langsung, dan kontrol
             yang hidup akan mengedamnya lalu menariknya balik. Lewat prop,
             bukan dengan menulis `controls.enabled` — instance itu milik store
             R3F, dan menulisinya ditolak `react-hooks/immutability` dengan
             benar. */
          enabled={settled && !steering}
          target={[0, targetY, 0]}
          enablePan
          enableDamping
          dampingFactor={0.08}
          /* Menunggu pendaratan, dan berhenti selama sebuah hotspot sedang
             dibaca.

             Keduanya syarat, bukan selera. Selama penerbangan masuk berjalan,
             putaran otomatis akan menambahkan azimutnya sendiri ke pose yang
             sedang ditulis tween — dua pemilik pada satu properti. Dan setelah
             kamera diputar sampai menemukan garis pandang yang bersih ke sebuah
             hotspot, putaran otomatis akan segera memutarnya pergi lagi;
             pekerjaan mencari sudut itu jadi sia-sia dalam hitungan detik. */
          autoRotate={autoRotate && active && settled && activeHotspot === null}
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
