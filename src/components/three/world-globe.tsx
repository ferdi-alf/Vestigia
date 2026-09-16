"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { Continent } from "@/data/types";
import { CONTINENT_INFO } from "@/data/continents";
import { latLonToVector3 } from "@/lib/geo";
import { createReliefMaps } from "@/lib/three/relief-texture";
import { readTokens } from "@/lib/three/globe-texture";
import { ACCENT, oklchToRgb } from "@/lib/three/oklch";
import { EASE, gsap } from "@/lib/motion/use-scroll-scene";

export interface WorldMark {
  slug: string;
  lat: number;
  lon: number;
  continent: Continent;
}

/** Jari-jari bola. Seluruh angka lain di berkas ini kelipatannya. */
const RADIUS = 1;

/**
 * Kerapatan segmen bola.
 *
 * Jauh lebih rapat daripada bola biasa, dan itu syarat — bukan selera.
 * `displacementMap` menggeser VERTEKS; pada bola bersegmen jarang, daratan yang
 * timbul jadi segi banyak yang kasar dan garis pantainya patah-patah. 256x128
 * adalah titik tempat siluetnya berhenti terlihat bersudut pada ukuran layar
 * yang dipakai section ini.
 */
const SEGMENTS: [number, number] = [256, 128];

/** Seberapa tinggi daratan menonjol, satuan radius. */
const RELIEF = 0.028;

/** Derajat per detik saat bola berputar bebas. */
const SPIN_SPEED = 4.2;

/** Jarak kamera dari pusat, satuan radius. */
const DISTANCE = 3.05;

/**
 * Lintang kamera dijepit di sini saat sebuah benua dipilih.
 *
 * Tanpa jepitan, memilih Oseania akan melempar kamera hampir ke kutub dan
 * bolanya terbaca sebagai piringan. Empat puluh lima derajat adalah batas
 * tempat bola masih terbaca sebagai bola.
 */
const LAT_CLAMP = 45;

/**
 * Bujur yang harus dihadapkan kamera supaya sebuah titik menghadap kita.
 *
 * `latLonToVector3` menempatkan bujur 0 pada azimut +90 derajat — konsekuensi
 * dari konvensi `phi = (lon + 180) / 360 * 2pi` yang dipakai supaya penanda
 * mendarat tepat pada texel tempat koordinat itu dilukis. Jadi sudut putar
 * bolanya adalah negatif dari azimut titik itu.
 */
function facingRotation(lon: number): number {
  return -(lon + 90);
}

/** Rata-rata bujur yang benar melintasi garis tanggal — rata-rata biasa gagal di Pasifik. */
function meanLon(values: number[]): number {
  if (values.length === 0) return 0;
  let x = 0;
  let y = 0;
  for (const v of values) {
    x += Math.cos((v * Math.PI) / 180);
    y += Math.sin((v * Math.PI) / 180);
  }
  return (Math.atan2(y, x) * 180) / Math.PI;
}

interface WorldView {
  /** derajat putar bola pada sumbu Y */
  rot: number;
  /** derajat lintang yang dipandang kamera */
  lat: number;
  /** 1 = berputar bebas, 0 = dipegang */
  spin: number;
}

/* ── Bola ───────────────────────────────────────────────────────────────── */

function ReliefBody({
  marks,
  activeContinent,
  view,
  stone,
}: {
  marks: WorldMark[];
  activeContinent: Continent | null;
  view: React.RefObject<WorldView>;
  stone: string;
}) {
  const group = useRef<THREE.Group>(null);

  const maps = useMemo(() => createReliefMaps(), []);
  useEffect(
    () => () => {
      maps?.displacementMap.dispose();
      maps?.bumpMap.dispose();
    },
    [maps],
  );

  const placed = useMemo(
    () =>
      marks.map((m) => ({
        ...m,
        /* Sedikit di atas puncak relief, bukan di permukaan bola. Pada radius
           telanjang penanda akan tenggelam ke dalam daratan yang baru saja
           ditinggikan `displacementScale`. */
        position: latLonToVector3(m.lat, m.lon, RADIUS + RELIEF + 0.006),
        color: new THREE.Color().setRGB(
          ...oklchToRgb(ACCENT.lightness, ACCENT.chroma, CONTINENT_INFO[m.continent].hue),
          THREE.SRGBColorSpace,
        ),
      })),
    [marks],
  );

  useFrame(() => {
    const node = group.current;
    if (!node) return;
    node.rotation.y = ((view.current?.rot ?? 0) * Math.PI) / 180;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[RADIUS, ...SEGMENTS]} />
        {/* NOL `map`. Warnanya satu batu dari token — bola ini tidak pernah
            membawa warna yang bukan milik situs ini, dan ia ikut berganti
            kalau paletnya bergeser. §5: batu kering, bukan kaca atau neon. */}
        <meshStandardMaterial
          color={stone}
          displacementMap={maps?.displacementMap ?? undefined}
          displacementScale={RELIEF}
          bumpMap={maps?.bumpMap ?? undefined}
          bumpScale={0.012}
          roughness={0.94}
          metalness={0}
        />
      </mesh>

      {placed.map((mark) => (
        <WorldMarker
          key={mark.slug}
          mark={mark}
          dimmed={activeContinent !== null && activeContinent !== mark.continent}
        />
      ))}
    </group>
  );
}

/**
 * Satu penanda di atas relief.
 *
 * Sisi jauh disembunyikan lewat SKALA, bukan lewat `visible`. Mematikan
 * `visible` di tengah putaran menghasilkan kedipan tepat di tepi bola; mengecil
 * ke nol terbaca sebagai penanda yang tenggelam di balik lengkung bumi, yang
 * memang persis yang sedang terjadi.
 */
function WorldMarker({
  mark,
  dimmed,
}: {
  mark: WorldMark & { position: THREE.Vector3; color: THREE.Color };
  dimmed: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const camera = useThree((state) => state.camera);

  const normal = useMemo(() => mark.position.clone().normalize(), [mark.position]);
  const toCamera = useMemo(() => new THREE.Vector3(), []);
  const worldNormal = useMemo(() => new THREE.Vector3(), []);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const spin = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const node = ref.current;
    const mat = material.current;
    if (!node || !mat) return;

    const parent = node.parent;
    if (parent) parent.getWorldQuaternion(spin);
    worldNormal.copy(normal).applyQuaternion(spin);
    node.getWorldPosition(worldPosition);
    toCamera.copy(camera.position).sub(worldPosition).normalize();

    const facing = Math.max(0, worldNormal.dot(toCamera));
    const eased = facing * facing * (3 - 2 * facing);

    node.scale.setScalar(eased);
    mat.opacity = dimmed ? 0.25 : 1;
  });

  return (
    <mesh ref={ref} position={mark.position}>
      <sphereGeometry args={[0.014, 12, 12]} />
      <meshBasicMaterial ref={material} color={mark.color} transparent toneMapped={false} />
    </mesh>
  );
}

/* ── Kamera ─────────────────────────────────────────────────────────────── */

/**
 * Kamera naik-turun pada lintang, bola berputar pada bujur.
 *
 * Memiringkan BOLANYA untuk mencapai lintang akan memiringkan sumbu kutubnya,
 * dan dunia yang utaranya tidak di atas berhenti terbaca sebagai dunia. Jadi
 * yang bergerak kameranya.
 */
function WorldRig({ view }: { view: React.RefObject<WorldView> }) {
  const camera = useThree((state) => state.camera);
  const origin = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const lat = ((view.current?.lat ?? 0) * Math.PI) / 180;
    camera.position.set(0, DISTANCE * Math.sin(lat), DISTANCE * Math.cos(lat));
    camera.lookAt(origin);
  });

  return null;
}

/** Menggambar satu bingkai saat panggung kembali aktif — buffer basi kalau tidak. */
function ResumeOnActive({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}

/**
 * Putaran bebas, dan tiga pagar yang membuatnya tidak melanggar §4.
 *
 * §4 melarang "gerak yang berjalan sendiri tanpa pemicu pengguna". Putaran ini
 * diminta eksplisit pemilik project, dan ia dijinakkan begitu rupa sehingga ia
 * lebih tepat disebut keadaan diam yang menunggu daripada animasi yang berjalan:
 *
 *   1. berhenti saat kanvas keluar layar atau tab disembunyikan (`active`)
 *   2. berhenti saat pengguna meminta gerak dikurangi (`still`)
 *   3. berhenti begitu sebuah benua dipilih, dan baru jalan lagi saat dilepas
 */
function FreeSpin({ advance, active }: { advance: (seconds: number) => void; active: boolean }) {
  /* Menerima FUNGSI, bukan ref-nya.
     `react-hooks/immutability` menolak komponen yang menulis ke dalam
     argumennya sendiri, dan ia benar menolaknya: pemilik kotak `view` adalah
     `WorldGlobe`, dan komponen ini cuma penyewa yang mengabarkan waktu berlalu.
     Pola yang sama dipakai `publish` di `use-dive-film`. */
  useFrame((_, delta) => {
    if (!active) return;
    advance(delta);
  });
  return null;
}

/* ── Panggung ───────────────────────────────────────────────────────────── */

export function WorldGlobe({
  marks,
  activeContinent,
  active,
  still,
}: {
  marks: WorldMark[];
  /** benua yang dipilih daftar di kiri, atau null untuk berputar bebas */
  activeContinent: Continent | null;
  /** false ketika kanvas keluar layar atau tab disembunyikan */
  active: boolean;
  /** pengguna meminta gerak dikurangi */
  still: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<WorldView>({ rot: 0, lat: 12, spin: 1 });

  /* Satu-satunya jalan `FreeSpin` menyentuh kotak ini, dan ia dimiliki di sini.
     `spin` yang memutuskan: selama sebuah benua dipilih ia nol, jadi putaran
     bebas berhenti menulis sebelum tween GSAP di bawah menyentuh apa pun — dua
     penulis, tidak pernah bersamaan. §6. */
  const advance = useCallback((seconds: number) => {
    const v = view.current;
    if (v.spin <= 0) return;
    v.rot -= seconds * SPIN_SPEED * v.spin;
  }, []);
  const [stone, setStone] = useState<string | null>(null);

  /* Warna batu dibaca dari token yang berlaku pada elemen INI, bukan dari
     `:root` — sama seperti globe pembuka, supaya ia mengambil palet konsep. */
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    setStone(readTokens(node, { stone: "--color-raised" }).stone);
  }, []);

  /**
   * Satu tween, satu pemilik.
   *
   * `rot`, `lat`, dan `spin` semuanya ditulis dari SATU tempat — §6 melarang
   * dua sistem menggerakkan properti yang sama, dan putaran bebas di `FreeSpin`
   * sudah memegang `rot` juga. Itu aman karena `spin` yang memutuskan: selama
   * tween berjalan `spin` sudah nol, jadi `FreeSpin` berhenti menulis sebelum
   * tween menyentuh apa pun.
   */
  useEffect(() => {
    const v = view.current;
    if (still) return;

    if (activeContinent === null) {
      const tween = gsap.to(v, { spin: 1, duration: 0.9, ease: EASE.enter });
      return () => {
        tween.kill();
      };
    }

    const own = marks.filter((m) => m.continent === activeContinent);
    if (own.length === 0) return;

    const targetLon = meanLon(own.map((m) => m.lon));
    const targetLat = own.reduce((n, m) => n + m.lat, 0) / own.length;

    /* Putaran diambil jalur terpendek dari posisi sekarang, bukan dari nol.
       Tanpa ini memilih Oseania setelah Amerika bisa memutar bola nyaris satu
       lingkaran penuh ke arah yang salah. */
    const want = facingRotation(targetLon);
    const shortest = v.rot + (((want - v.rot) % 360) + 540) % 360 - 180;

    const tween = gsap.to(v, {
      spin: 0,
      rot: shortest,
      lat: Math.max(-LAT_CLAMP, Math.min(LAT_CLAMP, targetLat)),
      duration: 1.15,
      ease: EASE.enter,
    });
    return () => {
      tween.kill();
    };
  }, [activeContinent, marks, still]);

  return (
    <div ref={host} className="absolute inset-0" data-world-canvas>
      {stone ? (
        <Canvas
          frameloop={active ? (still ? "demand" : "always") : "never"}
          dpr={[1, 1.75]}
          camera={{ fov: 34, near: 0.05, far: 40, position: [0, 0, DISTANCE] }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          {/* Matahari dari kiri, posisi yang sama dengan seluruh situs. Relief
              hanya terbaca kalau cahayanya menyapu, bukan menyorot tegak. */}
          <hemisphereLight args={["#fff3e0", "#c9b79a", 0.55]} />
          <directionalLight position={[-3.4, 2.2, 2.6]} intensity={2.5} />
          <directionalLight position={[3, 0.6, -2]} intensity={0.3} />

          <ReliefBody
            marks={marks}
            activeContinent={activeContinent}
            view={view}
            stone={stone}
          />

          <Environment resolution={32} frames={1} environmentIntensity={0.35}>
            <Lightformer intensity={1.8} color="#fff1dc" position={[-2, 3, 3]} scale={[8, 8, 1]} />
          </Environment>

          <WorldRig view={view} />
          <FreeSpin advance={advance} active={active && !still} />
          <ResumeOnActive active={active} />
        </Canvas>
      ) : null}
    </div>
  );
}
