"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { CONTINENT_INFO } from "@/data/continents";
import { latLonInto, latLonToVector3 } from "@/lib/geo";
import { createGlobeMaps } from "@/lib/three/globe-texture";
import { readTokens } from "@/lib/read-tokens";
import { ACCENT, oklchToRgb } from "@/lib/three/oklch";
import {
  ENTER_FADE_FROM,
  TOTAL_TURN,
  VIEWPOINT,
  altitudeAt,
  stateProgress,
} from "@/concepts/a/dive-beats";

export interface DiveProgress {
  /** progres gulir 0..1, dimiliki ScrollTrigger */
  value: number;
  /**
   * Kemajuan animasi MASUK, 0..1 — berbasis waktu, bukan gulir.
   *
   * Tinggal di kotak yang sama supaya panggung 3D tetap punya satu sumber untuk
   * dibaca. Pemiliknya tetap satu: film. Memisahkannya ke ref kedua berarti dua
   * kotak yang harus disinkronkan, dan tidak ada yang didapat dari itu.
   */
  intro: number;
}

export interface GlobeMark {
  slug: string;
  lat: number;
  lon: number;
  continent: keyof typeof CONTINENT_INFO;
}

const GLOBE_RADIUS = 1;

/**
 * Seberapa jauh globe digeser ke kanan, pecahan jarak kamera.
 *
 * Dinaikkan dari 0,26 setelah melihatnya: pada nilai lama tepi kiri bola
 * menabrak baris kedua judul. Karena geserannya sebanding dengan jarak kamera,
 * pecahannya terhadap lebar layar tetap sama pada setiap ketinggian — jadi satu
 * angka ini berlaku sepanjang sekuens, bukan cuma pada bingkai pembuka.
 */
const RIGHT_BIAS = 0.32;

/**
 * Penempatan globe pada layar POTRET — setengah bola mengintip dari pojok.
 *
 * Bukan versi desktop yang dipangkas. `RIGHT_BIAS` sendirian adalah satu angka
 * yang disetel pada layar lebar, dan pada viewport tinggi-sempit frustum
 * mendatarnya menyempit sehingga pecahan yang sama mendorong bola jauh melewati
 * tepi kanan — bolanya terpotong di tempat yang tidak dipilih siapa pun.
 *
 * Sempat disetel jadi SETENGAH bola yang mengintip dari pojok, dan pemilik
 * project mengoreksinya setelah melihat di perangkat sungguhan: yang terlihat
 * cuma sedikit, bukan setengah. Pada layar 375px, bias 0,46 ditambah bias turun
 * 0,34 mendorong sebagian besar bola keluar dari dua sisi sekaligus, dan yang
 * tersisa di bingkai tinggal serpihan.
 *
 * Sekarang kebalikannya: bolanya harus terlihat BANYAK, duduk di kanan-bawah
 * dan sedikit ke tengah. Biasnya dipangkas ke sekitar seperlima, dan
 * ketinggiannya nyaris disamakan dengan desktop supaya ukurannya tetap besar
 * tanpa perlu didorong keluar bingkai untuk memberi ruang teks.
 *
 * Dihitung dari RASIO ASPEK kanvas, bukan dari breakpoint. Aspek bereaksi pada
 * rotasi layar dan pada tiap perubahan ukuran tanpa media query kedua yang
 * harus dijaga tetap sinkron dengan yang ada di CSS.
 */
const PORTRAIT = {
  /** Di bawah rasio ini penempatannya beralih penuh ke bentuk potret. */
  until: 0.72,
  /** Di atas rasio ini penempatannya sepenuhnya bentuk lanskap. */
  from: 1.0,
  right: 0.2,
  down: 0.16,
  /** Pengali ketinggian: lebih dekat berarti bola lebih besar. */
  altitude: 0.92,
};

/**
 * Lebar jendela nyala/padam tiap penanda, dalam satuan progres keadaan.
 *
 * Di bawah 1 supaya penanda pertama dan terakhir tidak berbagi momen yang
 * sama; sisanya dibagi rata menurut urutan bujur. Yang berurutan terbaca
 * sebagai sesuatu yang sedang terjadi, yang serentak terbaca sebagai kedipan.
 */
const MARK_SPAN = 0.5;

/* ── Globe ──────────────────────────────────────────────────────────────── */

function GlobeBody({
  marks,
  target,
  progress,
  colors,
}: {
  marks: GlobeMark[];
  target: string;
  progress: React.RefObject<DiveProgress>;
  colors: Record<"sea" | "land" | "coast" | "graticule", string>;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const rim = useRef<THREE.MeshBasicMaterial>(null);

  const maps = useMemo(() => createGlobeMaps(colors), [colors]);
  useEffect(
    () => () => {
      maps?.map.dispose();
      maps?.bumpMap.dispose();
    },
    [maps],
  );

  /* Diurut BUJUR, bukan urutan registry.

     Stagger di bawah memakai indeks sebagai posisi dalam urutan, dan sebelumnya
     urutan itu kebetulan urutan registry — sehingga "menyala dari barat ke
     timur" adalah klaim yang tidak dikerjakan kode mana pun. Mengurutnya di
     sini membuat klaimnya benar, dan urutan render tidak berarti apa-apa di
     ruang 3D. */
  const placed = useMemo(
    () =>
      [...marks]
        .sort((a, b) => a.lon - b.lon)
        .map((m) => ({
          ...m,
          position: latLonToVector3(m.lat, m.lon, GLOBE_RADIUS * 1.004),
          /* Dihitung, bukan diserahkan ke parser three.js.

             `new THREE.Color("oklch(…)")` GAGAL DIAM-DIAM: parser warna three.js
             tidak mengenal `oklch()`, jadi ia mencatat `Unknown color model` lalu
             meninggalkan warnanya PUTIH. Kelima belas penanda karena itu tidak
             pernah sekali pun berwarna benua — di atas langit gelap titik putih
             terbaca sebagai pilihan desain, jadi tidak ada yang curiga sampai
             latarnya jadi kapur dan semuanya lenyap.

             Lihat `lib/three/oklch.ts` untuk kenapa ini tidak bisa dibaca dari
             token CSS. */
          color: new THREE.Color().setRGB(
            ...oklchToRgb(ACCENT.lightness, ACCENT.chroma, CONTINENT_INFO[m.continent].hue),
            THREE.SRGBColorSpace,
          ),
        })),
    [marks],
  );

  useFrame(() => {
    const t = progress.current?.value ?? 0;
    const intro = progress.current?.intro ?? 1;
    const node = group.current;
    const mat = material.current;
    if (!node || !mat) return;

    const enter = stateProgress(t, "enter");

    /* Masuk berbasis WAKTU, pergi berbasis GULIR — dua sumber, dikalikan.

       Kepergiannya sengaja DITUNDA sampai dua pertiga `enter` sudah lewat.
       Memudarkannya selagi kamera mendekat akan terbaca sebagai benda yang
       menghilang; menahannya sampai permukaannya memenuhi bingkai membuatnya
       terbaca sebagai permukaan yang DILEWATI. */
    const leave = Math.min(
      1,
      Math.max(0, (enter - ENTER_FADE_FROM) / (1 - ENTER_FADE_FROM)),
    );
    const alpha = intro * (1 - leave);
    mat.opacity = alpha;
    if (rim.current) rim.current.opacity = alpha * 0.22;

    node.scale.setScalar(1 + (1 - intro) * 0.08);

    /* Putaran BERBASIS PROGRES sepanjang seluruh gulir, bukan waktu. Menggulir
       ke atas menelusurinya balik persis — §6, dan permintaan harfiah pemilik
       project: "berputar seiring scroll". */
    node.rotation.y = (t * TOTAL_TURN * Math.PI) / 180;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 128, 80]} />
        {/* `standard`, bukan `basic`: bola tanpa naungan terbaca sebagai
            piringan, dan seluruh rasa kedalaman hilang.

            `bumpMap` yang membuat benua TIMBUL. Tanpa ia, daratan cuma warna
            berbeda di atas laut dan bolanya terbaca sebagai stiker peta yang
            dilengkungkan. `bumpScale` sengaja kecil: relief yang berlebihan
            pada bola seukuran ini berubah jadi kerut, bukan jadi benua. */}
        <meshStandardMaterial
          ref={material}
          map={maps?.map ?? undefined}
          bumpMap={maps?.bumpMap ?? undefined}
          bumpScale={0.035}
          roughness={0.88}
          metalness={0}
          transparent
        />
      </mesh>

      {/* Rim atmosfer.

          Bola sedikit lebih besar yang dirender dari DALAM (`BackSide`). Yang
          terlihat hanya tepinya — karena bagian tengahnya tertutup bola utama —
          sehingga hasilnya cincin tipis yang mengikuti siluet. Itu satu-satunya
          hal yang memisahkan "bola bertekstur" dari "planet" tanpa menulis
          shader sendiri.

          **Blending NORMAL, bukan aditif.** Aditif benar di atas langit gelap:
          ia menambah cahaya, dan di sana ada ruang gelap untuk diterangi. Di
          atas krem terang ia nyaris tidak terlihat. Yang membuat siluet terbaca
          di sini justru kebalikannya: cincin yang lebih GELAP daripada latarnya.

          Keburamannya ikut dianimasikan bersama bola utama — kalau tidak,
          cincinnya tertinggal sebagai lingkaran melayang setelah globe pergi.

          `depthWrite` dimatikan supaya lapisan ini tidak memotong penanda yang
          berada di depannya. */}
      <mesh scale={1.035}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 48]} />
        <meshBasicMaterial
          ref={rim}
          color={colors.coast}
          side={THREE.BackSide}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>

      {placed.map((mark, index) => (
        <Marker
          key={mark.slug}
          mark={mark}
          isTarget={mark.slug === target}
          index={index}
          total={placed.length}
          progress={progress}
        />
      ))}
    </group>
  );
}

/**
 * Satu penanda.
 *
 * Lima belas titik yang dibaca dari registry, menyala barat ke timur saat globe
 * datang dan padam barat ke timur saat ia pergi — kecuali satu. Yang bertahan
 * adalah situs yang section berikutnya tunjukkan sebagai object, jadi bingkai
 * terakhir panggung ini adalah kalimat pembuka section setelahnya.
 *
 * Di sinilah kehilangan DIPERLIHATKAN alih-alih diklaim, dan tidak ada satu
 * angka pun yang dikarang untuk mencapainya: yang padam adalah lima belas situs
 * yang memang ada di koleksi.
 */
function Marker({
  mark,
  isTarget,
  index,
  total,
  progress,
}: {
  mark: GlobeMark & { position: THREE.Vector3; color: THREE.Color };
  isTarget: boolean;
  index: number;
  total: number;
  progress: React.RefObject<DiveProgress>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const camera = useThree((state) => state.camera);

  /* Stagger dari urutan bujur, bukan dari acak. */
  const offset = index / Math.max(1, total - 1);

  /* Seluruh vektor kerja dialokasikan sekali. Lima belas penanda × tiga
     alokasi per frame adalah tekanan pada garbage collector yang muncul di
     layar sebagai sentakan berkala. */
  const normal = useMemo(() => mark.position.clone().normalize(), [mark.position]);
  const toCamera = useMemo(() => new THREE.Vector3(), []);
  const worldNormal = useMemo(() => new THREE.Vector3(), []);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const parentSpin = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const node = ref.current;
    const mat = material.current;
    if (!node || !mat) return;

    const t = progress.current?.value ?? 0;
    const intro = progress.current?.intro ?? 1;

    /* Penanda di sisi jauh bola harus hilang, kalau tidak lima belas titik
       terbaca menembus bumi dan bolanya berhenti terlihat padat. */
    const parent = node.parent;
    if (parent) parent.getWorldQuaternion(parentSpin);
    worldNormal.copy(normal).applyQuaternion(parentSpin);
    node.getWorldPosition(worldPosition);
    toCamera.copy(camera.position).sub(worldPosition).normalize();
    const facing = Math.max(0, worldNormal.dot(toCamera));

    /* Menyala bersama animasi MASUK, bukan menunggu gulir.

       Sebelumnya ini dipetakan ke `arrive`, yang berarti pada progres nol
       seluruh penanda masih padam — bingkai pertama yang dilihat pengunjung
       berisi bola telanjang, dan "lima belas situs" baru terbukti setelah ia
       menggulir. Sekarang mereka menyala barat ke timur selama tween masuk,
       jadi janji halamannya sudah berdiri sebelum jari menyentuh apa pun. */
    const start = offset * (1 - MARK_SPAN);
    const lit = Math.min(1, Math.max(0, (intro - start) / MARK_SPAN));
    /* Padam sepanjang `close`, selagi kamera turun ke permukaan. Empat belas
       pergi berurutan barat ke timur; yang dituju bertahan paling lama, lalu
       ikut hilang saat kerak ditembus — pada jarak sedekat itu ia sudah tepat di
       depan lensa dan tidak lagi menunjuk apa pun. */
    const dark = isTarget
      ? stateProgress(t, "enter")
      : Math.min(1, Math.max(0, (stateProgress(t, "close") - start) / MARK_SPAN));

    mat.opacity = lit * (1 - dark) * Math.min(1, facing * 2.2);

    /* Yang bertahan membesar saat yang lain pergi. Tanpa itu, bingkai terakhir
       hanya berisi satu titik yang kebetulan tidak padam — bukan satu titik
       yang ditunjuk. */
    node.scale.setScalar(isTarget ? 1 + stateProgress(t, "close") * 1.1 : 1);
  });

  return (
    <mesh ref={ref} position={mark.position}>
      <sphereGeometry args={[0.011, 12, 12]} />
      <meshBasicMaterial ref={material} color={mark.color} transparent toneMapped={false} />
    </mesh>
  );
}

/* ── Kamera ─────────────────────────────────────────────────────────────── */

/**
 * Satu kamera untuk seluruh sekuens, tanpa potongan.
 *
 * Dipegang HANYA oleh komponen ini. Tidak ada OrbitControls di panggung ini —
 * dua sistem yang sama-sama menulis posisi kamera akan saling menimpa tiap
 * frame, dan yang terlihat adalah getaran yang mustahil ditelusuri.
 *
 * Titik pandangnya TETAP. Versi sebelumnya menggeser lintang-bujur dari satu
 * titik ke koordinat situs sambil ketinggiannya jatuh, karena sekuens lama
 * memang satelit yang turun menuju satu tempat. Sekuens ini tidak turun ke mana
 * pun — globe datang, menepi, lalu pergi — dan kamera yang bergerak dalam dua
 * sumbu sekaligus pada rentang sependek itu terbaca sebagai goyangan, bukan
 * sebagai perjalanan.
 */
function DiveRig({ progress }: { progress: React.RefObject<DiveProgress> }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const orbit = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(), []);

  /* Seberapa "potret" kanvasnya, 0..1. Dihitung saat ukuran berubah — bukan
     tiap frame — karena `size` dari R3F sudah merupakan state yang diperbarui
     oleh ResizeObserver miliknya sendiri.

     Melandai di antara kedua batas alih-alih membalik pada satu nilai: tablet
     yang diputar pelan-pelan melewati rasio 1 tidak boleh membuat globenya
     melompat. */
  const portrait = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    const k = (PORTRAIT.from - aspect) / (PORTRAIT.from - PORTRAIT.until);
    const clamped = Math.min(1, Math.max(0, k));
    return clamped * clamped * (3 - 2 * clamped);
  }, [size.width, size.height]);

  useFrame(() => {
    const t = progress.current?.value ?? 0;

    /* Ketinggian dikalikan, bukan diganti: seluruh bentuk kurva `altitudeAt`
       — termasuk penembusan di ujungnya — tetap berlaku di ponsel, hanya
       seluruhnya lebih dekat. */
    const lift = 1 - portrait * (1 - PORTRAIT.altitude);
    latLonInto(orbit, VIEWPOINT.lat, VIEWPOINT.lon, GLOBE_RADIUS * altitudeAt(t) * lift);
    camera.position.copy(orbit);
    camera.lookAt(origin);

    /* Globe duduk di KANAN bingkai, bukan di tengah.

       Caranya menggeser KAMERA sepanjang sumbu kanannya sendiri — dilakukan
       SESUDAH `lookAt`, jadi rotasinya tidak ikut berubah dan perspektifnya
       tidak menceng. Menggeser globe-nya sendiri tidak bisa dipakai: kamera
       mengorbit titik asal, jadi memindahkan bolanya justru melemparkannya
       keluar bingkai.

       Geserannya sebanding dengan jarak kamera supaya bagiannya terhadap lebar
       layar tetap sama pada setiap ketinggian — itu sebabnya globe tetap duduk
       pada pecahan bingkai yang sama baik saat jauh maupun saat mendekat.

       Berlaku PENUH sejak progres nol. Versi sebelumnya menumbuhkannya di
       tengah jalan karena globe di sana lahir di tengah bingkai; sekarang ia
       sudah di kanan sejak piksel pertama, dan kolom kiri memang sudah berisi
       teks yang menuntutnya.

       Pada layar potret biasnya membesar dan ditemani bias TURUN, sehingga
       yang tersisa di bingkai adalah kuadran kiri-atas bola — setengah bola
       yang mengintip dari tengah-bawah-kanan. `translateY` negatif menurunkan
       kameranya, yang menaikkan bolanya; yang dipakai di sini positif supaya
       bolanya justru turun. */
    const reach = orbit.length();
    camera.translateX(-reach * (RIGHT_BIAS + portrait * (PORTRAIT.right - RIGHT_BIAS)));
    if (portrait > 0) camera.translateY(reach * portrait * PORTRAIT.down);
  });

  return null;
}

/**
 * Menggambar satu bingkai ketika panggung kembali aktif.
 *
 * Wajib untuk `frameloop` selain `"always"`: tanpa dorongan ini kanvas
 * memperlihatkan isi buffer yang basi sampai ada yang kebetulan memicu gambar
 * ulang. Pada gerak dikurangi ia satu-satunya yang pernah menggambar sama
 * sekali, karena di sana progresnya diterbitkan sekali lalu tidak pernah
 * berubah lagi.
 */
function ResumeOnActive({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}

/* ── Panggung ───────────────────────────────────────────────────────────── */

export function GlobeStage({
  marks,
  targetSlug,
  progress,
  active,
  still,
}: {
  marks: GlobeMark[];
  /** situs yang penandanya bertahan saat empat belas lainnya padam */
  targetSlug: string;
  progress: React.RefObject<DiveProgress>;
  /** false ketika kanvas keluar layar, tab disembunyikan, atau video menutup bingkai */
  active: boolean;
  /** pengguna meminta gerak dikurangi — progres tidak pernah berubah lagi */
  still: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState<Record<
    "sea" | "land" | "coast" | "graticule",
    string
  > | null>(null);

  /* Warna diselesaikan dari token yang berlaku pada elemen INI — bukan dari
     `:root` — supaya tekstur mengambil palet konsep dan ikut berganti kalau
     paletnya berganti. */
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    setColors(
      readTokens(node, {
        sea: "--color-surface",
        land: "--color-raised",
        coast: "--color-line-strong",
        graticule: "--color-line",
      }),
    );
  }, []);

  return (
    <div ref={host} className="absolute inset-0" data-globe-canvas>
      <Canvas
        /* Seluruh isi panggung ini kini fungsi murni dari progres scroll —
           tidak ada satu pun gerak berbasis waktu yang tersisa setelah putaran
           diam dibuang. Jadi saat pengguna meminta gerak dikurangi, progresnya
           diterbitkan sekali dan `"demand"` sudah cukup: satu bingkai digambar
           dan tidak ada yang perlu menggambarnya lagi. */
        frameloop={active ? (still ? "demand" : "always") : "never"}
        dpr={[1, 1.75]}
        camera={{ fov: 42, near: 0.005, far: 80, position: [0, 0, 3.5] }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <hemisphereLight args={["#fff3e0", "#c9b79a", 0.7]} />
        {/* Matahari dari kiri, posisi yang sama dengan seluruh situs. Arah
            cahaya bagian dari identitas, bukan parameter yang disetel per
            section. */}
        <directionalLight position={[-3.2, 2.4, 3]} intensity={2.3} />
        <directionalLight position={[3, 1, -2]} intensity={0.35} />

        {colors ? (
          <GlobeBody marks={marks} target={targetSlug} progress={progress} colors={colors} />
        ) : null}

        <Environment resolution={32} frames={1} environmentIntensity={0.4}>
          <Lightformer intensity={2} color="#fff1dc" position={[-2, 3, 3]} scale={[8, 8, 1]} />
        </Environment>

        <DiveRig progress={progress} />
        <ResumeOnActive active={active} />
      </Canvas>
    </div>
  );
}
