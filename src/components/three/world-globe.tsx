"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
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

/**
 * Kecepatan putar bebas, dalam satuan `autoRotateSpeed` milik OrbitControls.
 *
 * Satuannya BUKAN derajat per detik: nilai 1 berarti satu putaran penuh tiap
 * tiga puluh detik, jadi 12 derajat per detik. 0,35 menghasilkan 4,2 derajat
 * per detik — kecepatan yang sama dengan putaran tulisan tangan sebelumnya.
 */
const AUTO_ROTATE_SPEED = 0.35;

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
 * Jepitan yang sama, dinyatakan sebagai sudut polar untuk OrbitControls.
 *
 * Sudut polar diukur DARI kutub utara, jadi lintang `lat` adalah `90 - phi` —
 * dan jepitan lintang simetris jadi jepitan polar di kedua sisi khatulistiwa.
 * Diturunkan, bukan ditulis ulang, supaya menyetel `LAT_CLAMP` tetap cukup di
 * satu tempat.
 */
const POLAR_CLAMP = {
  min: THREE.MathUtils.degToRad(90 - LAT_CLAMP),
  max: THREE.MathUtils.degToRad(90 + LAT_CLAMP),
};

const TAU = Math.PI * 2;

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

/* ── Bola ───────────────────────────────────────────────────────────────── */

function ReliefBody({
  marks,
  activeContinent,
  earth,
}: {
  marks: WorldMark[];
  activeContinent: Continent | null;
  earth: ReliefColors;
}) {

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

  /* Bolanya DIAM. Dulu grup ini diputar tiap frame untuk mensimulasikan
     putaran bumi; sejak kamera dipegang OrbitControls, yang bergerak kameranya.
     Dua sistem yang sama-sama menulis rotasi adalah persis yang dilarang §6,
     dan seretan pengguna tidak punya tempat untuk mendarat kalau bolanya juga
     berputar sendiri. */
  return (
    <group>
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

/** Menggambar satu bingkai saat panggung kembali aktif — buffer basi kalau tidak. */
function ResumeOnActive({ active }: { active: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
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
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
  const [earth, setEarth] = useState<ReliefColors | null>(null);

  /**
   * Apakah bola sudah pernah DIPEGANG pengguna.
   *
   * Sekali disentuh, putaran otomatis berhenti dan tidak menyala lagi: sebuah
   * bola yang merebut kembali kendali beberapa detik setelah dilepas adalah
   * bola yang melawan pemegangnya. Ia hanya diatur ulang saat pilihan benua
   * berubah, karena di situ pengguna memang meminta kamera bergerak sendiri.
   *
   * Pengaturan ulangnya terjadi SAAT RENDER, bukan di dalam sebuah effect.
   * Menyetel state di dalam effect berarti satu render tambahan dengan nilai
   * yang sudah diketahui basi — dan React menyebut pola ini secara eksplisit
   * untuk state yang harus menyesuaikan diri pada perubahan prop. Membandingkan
   * prop dengan salinan render sebelumnya membuat penyesuaiannya terjadi
   * sebelum satu pun piksel digambar.
   */
  const [held, setHeld] = useState(false);
  const [lastContinent, setLastContinent] = useState(activeContinent);
  if (lastContinent !== activeContinent) {
    setLastContinent(activeContinent);
    setHeld(false);
  }

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
   * Dua pagar supaya kendali 3D tidak pernah merebut gulir halaman.
   *
   * OrbitControls menyetel `touchAction: "none"` pada kanvasnya saat tersambung,
   * dan itu berarti satu jari yang kebetulan mendarat di atas bola TIDAK BISA
   * lagi menggulir halaman — di ponsel, bola seukuran ini menutupi hampir
   * seluruh layar. §4 melarang mencegat `touch` untuk memaksa urutan, dan ini
   * bentuk pencegatan yang paling tidak terduga: pengguna tidak bermaksud
   * menyentuh apa pun, ia cuma menggulir.
   *
   * `pan-y` mengembalikan gerakan tegak kepada peramban dan menyisakan gerakan
   * mendatar untuk bola. Gulir tetap utuh, dan memutar dunia ke samping —
   * satu-satunya sumbu yang benar-benar penting di sebuah globe — tetap bisa.
   *
   * `enableZoom` mati karena alasan yang sama pada tetikus: roda di atas kanvas
   * akan memperbesar bola alih-alih menggulir halaman, dan section ini duduk di
   * tengah perjalanan, bukan di ujungnya.
   */
  useEffect(() => {
    /* Dijalankan ketika KENDALINYA siap, bukan ketika kanvasnya siap, dan
       urutannya itu yang penting.

       `ref={setControls}` dipanggil saat commit, sedangkan `connect()` milik
       OrbitControls berjalan di effect pada commit yang sama — jadi effect ini,
       yang baru terjadwal oleh `setControls`, dijamin berjalan SETELAH
       `connect()` selesai. Sempat dicoba dengan satu `requestAnimationFrame`
       setelah warna bumi siap, dan itu terlalu awal: R3F belum memasang
       kendalinya, `none` dipasang belakangan, dan jepitan ini kalah balapan.

       Yang dijepit BUKAN kanvasnya. R3F menyambungkan pendengar pointer-nya
       pada div pembungkus dan `connect()` menyetel `touchAction` pada elemen
       ITU — terukur di peramban: kanvasnya `auto`, kakeknya `none`. Karena itu
       yang disapu seluruh keturunan `host`, bukan satu elemen yang ditebak.

       Dicari lewat `host`, bukan lewat `controls.domElement`: menulis ke dalam
       nilai yang dikembalikan `useState` adalah persis yang dilarang
       `react-hooks/immutability`. */
    if (!controls) return;
    const root = host.current;
    if (!root) return;

    for (const node of root.querySelectorAll<HTMLElement>("*")) {
      if (node.style.touchAction === "none") node.style.touchAction = "pan-y";
    }
  }, [controls]);

  /**
   * Satu tween, satu pemilik.
   *
   * Yang di-tween sekarang SUDUT BOLA KAMERA, bukan rotasi bumi. Polanya sama
   * dengan `heritage-viewer.tsx`: hitung `Spherical` dari posisi kamera
   * sekarang, geser theta dan phi, susun ulang posisinya.
   *
   * Arah tujuannya diambil dari `latLonToVector3` — fungsi yang SAMA yang
   * menempatkan kelima belas object. Menghitung azimutnya sendiri berarti
   * menyalin konvensi bujur ke tempat kedua, dan konvensi yang disalin adalah
   * konvensi yang suatu saat menyimpang.
   */
  useEffect(() => {
    if (!controls || still || activeContinent === null) return;

    const own = marks.filter((m) => m.continent === activeContinent);
    if (own.length === 0) return;

    const lon = meanLon(own.map((m) => m.lon));
    const lat = own.reduce((n, m) => n + m.lat, 0) / own.length;
    const clamped = Math.max(-LAT_CLAMP, Math.min(LAT_CLAMP, lat));

    const here = new THREE.Spherical().setFromVector3(
      new THREE.Vector3().subVectors(controls.object.position, controls.target),
    );
    const want = new THREE.Spherical().setFromVector3(latLonToVector3(clamped, lon, 1));

    /* Jalur terpendek, bukan selisih mentah. Tanpa ini memilih Oseania setelah
       Amerika memutar kamera nyaris satu lingkaran penuh ke arah yang salah. */
    const turn = (((want.theta - here.theta) % TAU) + TAU + Math.PI) % TAU - Math.PI;

    const state = { theta: here.theta, phi: here.phi };
    const target = new THREE.Spherical(here.radius, want.phi, here.theta);
    const offset = new THREE.Vector3();

    const tween = gsap.to(state, {
      theta: here.theta + turn,
      phi: want.phi,
      duration: 1.15,
      ease: EASE.enter,
      onUpdate: () => {
        target.theta = state.theta;
        target.phi = state.phi;
        controls.object.position.copy(controls.target).add(offset.setFromSpherical(target));
        controls.object.lookAt(controls.target);
        controls.update();
      },
    });

    return () => {
      tween.kill();
    };
  }, [controls, activeContinent, marks, still]);

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

          <ReliefBody marks={marks} activeContinent={activeContinent} earth={earth} />

          <Environment resolution={32} frames={1} environmentIntensity={0.35}>
            <Lightformer intensity={1.8} color="#fff1dc" position={[-2, 3, 3]} scale={[8, 8, 1]} />
          </Environment>

          {/* Bola BISA DIPEGANG, dan putaran bebasnya kini milik kendali yang
              sama — bukan `useFrame` terpisah yang menulis rotasi sendiri.

              `autoRotate` mati pada keempat keadaan yang memang harus
              mematikannya: kanvas keluar layar, tab disembunyikan, gerak
              dikurangi, dan bola sudah pernah dipegang. Yang terakhir itu yang
              membuat §4 lebih bersih daripada sebelumnya — dulu putarannya baru
              berhenti kalau sebuah benua dipilih, sekarang ia berhenti pada
              sentuhan pertama. */}
          <OrbitControls
            makeDefault
            ref={setControls}
            enablePan={false}
            enableZoom={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.45}
            /* `onStart` menembak sekali per gerakan, bukan tiap frame — jadi
               `setState` di sini bukan `setState` di dalam handler gulir yang
               dilarang §4. Dipasang sebagai prop dan bukan lewat
               `addEventListener` supaya tidak ada pendengar yang perlu dilepas
               tangan saat kendalinya berganti. */
            onStart={() => setHeld(true)}
            autoRotate={active && !still && !held && activeContinent === null}
            autoRotateSpeed={AUTO_ROTATE_SPEED}
            /* Lintang dijepit sama seperti sebelumnya: tanpa ini seretan ke atas
               melempar kamera ke kutub dan bolanya terbaca sebagai piringan. */
            minPolarAngle={POLAR_CLAMP.min}
            maxPolarAngle={POLAR_CLAMP.max}
          />
          <ResumeOnActive active={active} />
        </Canvas>
      ) : null}
    </div>
  );
}
