"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Continent } from "@/data/types";
import { CONTINENT_INFO } from "@/data/continents";
import { latLonToVector3 } from "@/lib/geo";
import { createReliefMaps, LAND_COVERAGE, type ReliefColors } from "@/lib/three/relief-texture";
import { readTokens } from "@/lib/read-tokens";
import { ACCENT, RELIC_ACCENT, oklchToRgb } from "@/lib/three/oklch";
import { EASE, gsap } from "@/lib/motion/use-scroll-scene";

export interface WorldMark {
  slug: string;
  lat: number;
  lon: number;
  continent: Continent;
  /** Proxy geometri-saja. Tanpa ini warisan tetap tampil, sebagai titik. */
  proxy?: string;
}

/** Penanda yang sudah punya tempat, arah tegak, dan warna benuanya. */
type PlacedMark = WorldMark & {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  quaternion: THREE.Quaternion;
  /** Warna object yang berdiri — terang, untuk latar bola yang gelap. */
  color: THREE.Color;
  /** Warna penanda titik cadangan — gelap, pasangan lama. */
  dotColor: THREE.Color;
};

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

/**
 * Seberapa tinggi daratan menonjol, satuan radius.
 *
 * Dinaikkan dari 0,028 setelah melihatnya: pada nilai itu bolanya terbaca rata
 * dan benua praktis tidak ada. Relief hanya terbaca lewat BAYANGAN yang
 * dijatuhkannya, dan bayangan sedalam tiga persen radius di bawah cahaya yang
 * nyaris tegak lurus tidak menghasilkan apa pun.
 *
 * Dinaikkan lagi ke 0,075 setelah pass kedua: pada 0,055 siluetnya memang
 * bergerigi tetapi benua di tengah bingkai masih rata. Tujuh setengah persen
 * radius adalah titik tempat tepi benua mulai menjatuhkan bayangan yang
 * benar-benar terbaca sebagai tepi.
 */
const RELIEF = 0.075;

/**
 * Tinggi permukaan daratan yang SEBENARNYA, satuan radius.
 *
 * `RELIEF` adalah batas atas, bukan tinggi yang dicapai: `displacementScale`
 * mengalikan nilai peta, dan pedalaman benua di peta itu cuma sampai
 * `LAND_COVERAGE`. Object yang ditempatkan pada `RELIEF` penuh berdiri di udara
 * dengan celah yang terlihat di bawah alasnya.
 */
const LAND_RISE = RELIEF * LAND_COVERAGE;

/**
 * Sisi terpanjang sebuah object di atas bola, satuan radius.
 *
 * Skala sungguhan mustahil dan tidak diinginkan: Borobudur selebar 120 meter di
 * atas bola berjari-jari 6.371 km adalah dua per seratus ribu radius, yaitu nol
 * piksel. Yang dicari bukan skala melainkan KETERBACAAN — cukup besar untuk
 * mengenali siluetnya, cukup kecil untuk lima belas sekaligus tidak saling
 * menabrak di Eropa dan Asia Tenggara.
 */
const RELIC_SIZE = 0.1;

/**
 * Seberapa dalam alas object ditenggelamkan ke bawah permukaan, satuan radius.
 *
 * Alas sebuah model adalah bidang DATAR, sedangkan yang dipijaknya bola yang
 * bergelombang. Diletakkan tepat di permukaan, bidang itu menyentuh tanah hanya
 * di satu titik dan menggantung di atas sisanya — paling kelihatan di pulau
 * kecil, tempat laut di sekelilingnya lebih rendah lagi dan candi terbaca
 * seperti mengapung.
 *
 * Ditenggelamkan sedikit, tepi alasnya masuk ke dalam lereng dan objectnya
 * terbaca tertanam. Angkanya jauh di bawah `LAND_RISE`, jadi ia tidak pernah
 * tenggelam sampai ke bawah permukaan laut.
 */
const RELIC_SINK = 0.012;

/** Sumbu tegak glTF. Dipakai menegakkan object pada normal permukaannya. */
const MODEL_UP = new THREE.Vector3(0, 1, 0);

/**
 * Decoder Draco dari domain sendiri, bukan CDN Google yang jadi bawaan drei.
 * Kelima belas proxy terkompresi Draco, jadi decoder ini syarat — bukan
 * pelengkap. Alamat yang sama dipakai penampil warisan.
 */
const DRACO_PATH = "/draco/gltf/";

/** Derajat per detik saat bola berputar bebas. */
const SPIN_SPEED = 4.2;

/**
 * Jarak kamera dari pusat, satuan radius.
 *
 * Dinaikkan dari 3,05: pada fov 34 jarak itu membuat setengah tinggi bingkai
 * cuma 0,93 radius — lebih kecil daripada bolanya sendiri, jadi ia terpotong di
 * keempat sisi wadahnya. Sebuah bola yang terpotong berhenti terbaca sebagai
 * bola, dan seluruh gagasan globe ikut hilang bersamanya.
 */
const DISTANCE = 4.0;

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
  earth,
}: {
  marks: WorldMark[];
  activeContinent: Continent | null;
  view: React.RefObject<WorldView>;
  earth: ReliefColors;
}) {
  const group = useRef<THREE.Group>(null);

  const maps = useMemo(() => createReliefMaps(earth), [earth]);
  useEffect(
    () => () => {
      maps?.height.dispose();
      maps?.color.dispose();
    },
    [maps],
  );

  const placed = useMemo(
    () =>
      marks.map((m) => {
        /* Tepat di permukaan daratan, bukan di atas radius telanjang dan bukan
           pada `RELIEF` penuh — lihat `LAND_RISE`. Object yang berdiri harus
           menyentuh tanahnya; celah setipis apa pun di bawah alas langsung
           terbaca sebagai benda yang melayang. */
        const position = latLonToVector3(m.lat, m.lon, RADIUS + LAND_RISE - RELIC_SINK);
        const normal = position.clone().normalize();

        return {
          ...m,
          position,
          normal,
          /* Tegak terhadap permukaan di koordinatnya sendiri. Tidak ada satu pun
             sudut yang ditulis tangan: normalnya berasal dari lintang dan bujur
             yang sama dengan yang dipakai menempatkannya. */
          quaternion: new THREE.Quaternion().setFromUnitVectors(MODEL_UP, normal),
          /* Dua warna dari hue benua yang SAMA, dipakai di dua latar yang
             berlawanan: object berdiri di atas bola yang gelap, penanda titik
             cadangan tetap memakai pasangan lama. Lihat `RELIC_ACCENT`. */
          color: new THREE.Color().setRGB(
            ...oklchToRgb(
              RELIC_ACCENT.lightness,
              RELIC_ACCENT.chroma,
              CONTINENT_INFO[m.continent].hue,
            ),
            THREE.SRGBColorSpace,
          ),
          dotColor: new THREE.Color().setRGB(
            ...oklchToRgb(ACCENT.lightness, ACCENT.chroma, CONTINENT_INFO[m.continent].hue),
            THREE.SRGBColorSpace,
          ),
        };
      }),
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
        {/* `map` dari peta warna bumi, dan TANPA `color`.

            `color` mengalikan `map`, jadi warna apa pun selain putih akan
            menodai laut dan daratan sekaligus. Bawaan three.js sendiri sudah
            putih, jadi cara paling jujur menyerahkan warna sepenuhnya kepada
            peta adalah tidak menyebut `color` sama sekali — bukan menuliskan
            putih sebagai hex mentah, yang dilarang §5. */}
        <meshStandardMaterial
          map={maps?.color ?? undefined}
          displacementMap={maps?.height ?? undefined}
          displacementScale={RELIEF}
          /* Peta yang SAMA, dan itu yang membuat reliefnya terlihat — lihat
             catatan di `ReliefMaps`. Tanpa ini cahaya menaungi bola seolah
             masih bulat sempurna dan seluruh displacement jadi sia-sia. */
          bumpMap={maps?.height ?? undefined}
          /* Satu, bukan sepersekian.

             `bumpScale` BUKAN satuan dunia — ia pengali gangguan normal, dan
             bawaannya three.js sendiri 1. Nilai sepersekian yang benar untuk
             `displacementScale` di baris atas justru mematikan bump sama
             sekali: bolanya kembali mulus dan seluruh benua lenyap. Dua
             properti bertetangga dengan satuan yang sama sekali berbeda. */
          bumpScale={1}
          roughness={0.94}
          metalness={0}
        />
      </mesh>

      {placed.map((mark) => {
        const dimmed = activeContinent !== null && activeContinent !== mark.continent;

        /* Satu batas Suspense PER object, bukan satu untuk kelima belasnya.
           Satu batas bersama berarti bola berdiri kosong sampai proxy paling
           lambat selesai; begini tiap warisan muncul begitu miliknya sendiri
           mendarat. Fallback-nya `null` dan bukan penanda titik: berkedip dari
           titik ke bangunan lebih mengganggu daripada muncul sekali. */
        return mark.proxy ? (
          <Suspense key={mark.slug} fallback={null}>
            <WorldRelic mark={{ ...mark, proxy: mark.proxy }} dimmed={dimmed} />
          </Suspense>
        ) : (
          <WorldMarker key={mark.slug} mark={mark} dimmed={dimmed} />
        );
      })}
    </group>
  );
}

/**
 * Mengecilkan sebuah node ke nol saat titiknya berputar ke sisi jauh bola.
 *
 * Sisi jauh disembunyikan lewat SKALA, bukan lewat `visible` maupun `opacity`.
 * Mematikan `visible` di tengah putaran menghasilkan kedipan tepat di tepi bola;
 * memudarkan berarti menulis ke material tiap frame, yang dilarang §8 di jalur
 * panas — dan pada object bergeometri ia menambahkan penyortiran tembus pandang
 * yang tidak dibutuhkan siapa pun. Mengecil ke nol terbaca sebagai benda yang
 * tenggelam di balik lengkung bumi, yang memang persis yang sedang terjadi.
 */
function useFacingScale(ref: React.RefObject<THREE.Object3D | null>, normal: THREE.Vector3) {
  const camera = useThree((state) => state.camera);
  const toCamera = useMemo(() => new THREE.Vector3(), []);
  const worldNormal = useMemo(() => new THREE.Vector3(), []);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const spin = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const node = ref.current;
    if (!node) return;

    const parent = node.parent;
    if (parent) parent.getWorldQuaternion(spin);
    worldNormal.copy(normal).applyQuaternion(spin);
    node.getWorldPosition(worldPosition);
    toCamera.copy(camera.position).sub(worldPosition).normalize();

    const facing = Math.max(0, worldNormal.dot(toCamera));
    node.scale.setScalar(facing * facing * (3 - 2 * facing));
  });
}

/**
 * Penanda titik — jalur MUNDUR, bukan jalur utama.
 *
 * Dipakai hanya untuk warisan yang belum punya proxy. §1 menuntut nol asumsi
 * asset: sebuah situs yang proxy-nya belum dibuat tetap berdiri di bolanya,
 * sebagai titik, bukan menghilang dari dunia.
 */
function WorldMarker({ mark, dimmed }: { mark: PlacedMark; dimmed: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFacingScale(ref, mark.normal);

  return (
    <mesh ref={ref} position={mark.position}>
      <sphereGeometry args={[0.014, 12, 12]} />
      {/* Redup disetel lewat prop, bukan lewat useFrame: `dimmed` berubah saat
          benua dipilih — sekali per klik, bukan enam puluh kali per detik. */}
      <meshBasicMaterial
        color={mark.dotColor}
        transparent
        opacity={dimmed ? 0.25 : 1}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Satu warisan BERDIRI di atas globe, bukan menandainya.
 *
 * Inilah koreksi yang diminta: Borobudur harus menonjol di Jawa sebagai bentuk,
 * bukan sebagai titik di dekat Jawa. Yang membuatnya berdiri tegak adalah satu
 * kuaternion — sumbu `+Y` glTF diputar ke normal permukaan di koordinatnya —
 * dan karena normal itu dihitung dari koordinat aslinya, tidak ada satu pun
 * angka penempatan yang ditulis tangan. Menambah warisan baru menempatkan
 * objectnya sendiri (§2).
 *
 * **Model dikloning, materialnya diganti, geometrinya TIDAK PERNAH di-dispose.**
 * `scene.clone(true)` menyalin hierarki tetapi tetap BERBAGI geometri dan
 * material dengan scene yang di-cache `useGLTF`. Mem-`dispose()` geometri klon
 * saat komponen dilepas berarti merusak cache global: pemasangan berikutnya
 * mendapat geometri yang buffer GPU-nya sudah dibebaskan, dan objectnya lenyap
 * tanpa satu pun pesan kesalahan. Yang dibuat sendiri di sini cuma materialnya,
 * dan cuma itu yang dibersihkan.
 */
function WorldRelic({ mark, dimmed }: { mark: PlacedMark & { proxy: string }; dimmed: boolean }) {
  /* Argumen ketiga `true` adalah meshopt, nilai bawaan drei. KTX2 tidak
     dipasang: proxy dibuat tanpa satu tekstur pun — itu seluruh alasan ia
     muat di 150 KB. */
  const { scene } = useGLTF(mark.proxy, DRACO_PATH, true);
  const ref = useRef<THREE.Group>(null);
  useFacingScale(ref, mark.normal);

  const relic = useMemo(() => {
    const object = scene.clone(true);

    /* Satu material untuk seluruh proxy, warna benua yang sama dengan daftar di
       sebelahnya — bola dan daftar jadi satu sistem wayfinding. `roughness`
       tinggi supaya ia menangkap cahaya menyapu yang sama dengan bolanya dan
       terbaca sebagai batu, bukan sebagai stiker yang ditempel. */
    const material = new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0 });
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.material = material;
    });

    /* Normalisasi: sisi terpanjang ke `RELIC_SIZE`, lalu alasnya diturunkan ke
       nol dan pusatnya ditarik ke sumbu. Tanpa langkah kedua object tertanam
       separuh di dalam bola atau melayang, tergantung di mana pembuatnya
       kebetulan menaruh titik asal. */
    object.position.set(0, 0, 0);
    object.scale.setScalar(1);
    object.updateMatrixWorld(true);

    const raw = new THREE.Box3().setFromObject(object);
    const size = raw.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z);

    if (Number.isFinite(longest) && longest > 0) {
      object.scale.setScalar(RELIC_SIZE / longest);
      object.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(object);
      const center = fitted.getCenter(new THREE.Vector3());
      object.position.set(-center.x, -fitted.min.y, -center.z);
    }

    return { object, material };
  }, [scene]);

  /* Warna dan redupnya disetel di sini, bukan di `useMemo` di atas: keduanya
     berubah saat benua dipilih, dan membangun ulang seluruh klon untuk
     mengganti satu warna adalah pekerjaan yang tidak perlu dilakukan.

     Redup lewat WARNA, bukan alfa. Object tembus pandang menuntut penyortiran
     dan menembus satu sama lain di tepi bola; yang digelapkan tidak. */
  useEffect(() => {
    relic.material.color.copy(mark.color);
    if (dimmed) relic.material.color.multiplyScalar(0.4);
  }, [relic, mark.color, dimmed]);

  useEffect(() => () => relic.material.dispose(), [relic]);

  return (
    <group ref={ref} position={mark.position} quaternion={mark.quaternion}>
      <primitive object={relic.object} />
    </group>
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
  const [earth, setEarth] = useState<ReliefColors | null>(null);

  /* Keenam warna bumi dibaca dari token yang berlaku pada elemen INI, bukan
     dari `:root` — sama seperti globe pembuka, supaya ia mengambil palet
     konsep yang membungkusnya, tema gelap termasuk. */
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    setEarth(
      readTokens(node, {
        abyss: "--color-globe-abyss",
        sea: "--color-globe-sea",
        shelf: "--color-globe-shelf",
        land: "--color-globe-land",
        arid: "--color-globe-arid",
        ice: "--color-globe-ice",
      }),
    );
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
      {earth ? (
        <Canvas
          frameloop={active ? (still ? "demand" : "always") : "never"}
          dpr={[1, 1.75]}
          camera={{ fov: 34, near: 0.05, far: 40, position: [0, 0, DISTANCE] }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          {/* Matahari dari kiri, posisi yang sama dengan seluruh situs. Relief
              hanya terbaca kalau cahayanya menyapu, bukan menyorot tegak. */}
          {/* Cahaya MENYAPU, bukan menyorot.

              Sumber yang hampir tegak lurus permukaan menerangi puncak dan
              lembah sama rata, dan relief setinggi apa pun jadi tidak terbaca.
              Yang membuat batu terbaca sebagai batu adalah bayangan panjang
              dari sumber yang rendah — persis bahasa cahaya yang sudah dipakai
              seluruh situs ini: rendah, hangat, dari kiri. */}
          <hemisphereLight args={["#fff3e0", "#b9a88a", 0.52]} />
          <directionalLight position={[-4.2, 0.9, 1.4]} intensity={3.1} />
          <directionalLight position={[2.4, 0.4, -1.8]} intensity={0.25} />

          <ReliefBody
            marks={marks}
            activeContinent={activeContinent}
            view={view}
            earth={earth}
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
