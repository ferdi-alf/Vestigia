/**
 * Mesin keadaan pembuka konsep A — satu sumber kebenaran.
 *
 * Dipakai bersama oleh panggung 3D (yang memiliki kamera dan globe) dan
 * koreografi DOM (yang memiliki teks). Keduanya bertemu hanya lewat satu kotak
 * yang berisi dua angka.
 *
 * ---
 *
 * **VIDEO DIBUANG SELURUHNYA.** Versi sebelumnya membuka dengan klip ter-scrub
 * 7,95 MB, menutupnya dengan dua panel kertas, lalu menyerahkan bingkai ke
 * globe. Pemilik project memotongnya: pembuka kini teks dan globe saja, dan
 * seluruh halaman jadi animasi tanpa satu byte video pun.
 *
 * Yang ikut hilang bersamanya dan memang tidak punya pekerjaan lagi: tirai
 * (tidak ada yang perlu disapu bersih), kerai keterbacaan (teks berdiri di atas
 * kertas sejak bingkai pertama), `videoTimeAt`, `videoOpacityAt`, dan seluruh
 * gagasan "dua medium, satu angka". Tinggal satu medium.
 *
 * ---
 *
 * **EMPAT KEADAAN, DAN DUA YANG BUKAN KEADAAN.**
 *
 *   masuk      berbasis WAKTU, saat mount — teks naik, globe memudar masuk
 *   0,00–0,06  arrive   globe utuh di kanan, penanda menyala barat ke timur
 *   0,06–0,32  turn     globe berputar seiring scroll · teks hero mundur
 *   0,32–0,50  close    kamera jatuh ke permukaan · jembatan dibaca
 *   0,50–1,00  enter    menembus kerak, selesai pada 0,60 lalu ditahan
 *   0,42–0,60  cahaya   MEMOTONG `enter` — lihat LIGHT_TO di bawah
 *
 * Animasi masuk sengaja TIDAK jadi keadaan. Ia satu-satunya gerak di section ini
 * yang tidak dipegang scroll, dan mencampurnya ke dalam progres akan membuat
 * bingkai pertama bergantung pada posisi gulir — padahal ia harus terjadi justru
 * ketika belum ada yang digulir.
 *
 * Cahaya penutup juga bukan keadaan, dengan alasan yang berbeda: ia MEMOTONG
 * `enter` alih-alih menggantikannya. Penembusan tetap berjalan di bawahnya
 * sampai habis — yang terjadi bukan satu beat berhenti lalu beat lain mulai,
 * melainkan satu bidang yang naik menutupi beat yang masih berlangsung.
 *
 * **Angka di blok ini pernah berbohong.** Sampai sesi ini header di sini masih
 * menyebut `0,10 / 0,55 / 0,85` dan menamai beat keempat `hand`, padahal kodenya
 * sudah lama memakai `0,07 / 0,42 / 0,65` dan `enter`. Komentar yang meleset dari
 * kodenya lebih berbahaya daripada tidak ada komentar: ia dibaca sebagai
 * kebenaran lalu dipakai menghitung.
 */

/**
 * Seberapa lama animasi mengejar posisi scroll, dalam detik.
 *
 * Angka yang kecil membuat progres mengejar jari nyaris seketika, dan tiap
 * sentakan roda diteruskan mentah ke rotasi globe. Pada 0,7 progresnya
 * tertinggal lebih lama dan mendarat lebih lembut.
 */
export const SCRUB = 0.7;

/**
 * Empat keadaan, batasnya tidak tumpang tindih — dan batas `enter` itu BUKAN
 * angka bulat yang dipilih karena enak dilihat.
 *
 * Section setinggi 260svh dengan panggung lengket 100svh berarti panggungnya
 * lepas setelah 160svh digulir. Dengan `end: "bottom top"`, progres 1 jatuh saat
 * section benar-benar habis pada 260svh — jadi panggung lepas tepat pada
 * 160/260 = 0,615. Beat `enter` dimulai pada 0,65, sedikit sesudahnya, supaya
 * penembusan dimulai saat panggungnya SUDAH mulai meluncur — bukan sedetik
 * sebelumnya.
 */
export const STATE = {
  /** globe utuh di kanan, penanda menyala berurutan, teks terbaca */
  arrive: { from: 0.0, to: 0.06 },
  /** globe berputar seiring scroll, teks hero mundur ke atas */
  turn: { from: 0.06, to: 0.32 },
  /** kamera jatuh ke permukaan · empat belas penanda padam, satu bertahan */
  close: { from: 0.32, to: 0.5 },
  /** menembus kerak — permukaan memenuhi bingkai lalu lewat */
  enter: { from: 0.5, to: 1.0 },
} as const;

export type StateName = keyof typeof STATE;

/**
 * Ketinggian kamera, pengali radius globe.
 *
 * 4,8 pada pembuka adalah jawaban atas "jangan terlalu besar", dan angkanya
 * diukur di peramban bukan ditebak: pada 4,0 bola mengisi 72% tinggi viewport
 * dan tepi kirinya menabrak baris kedua judul. Pada 4,8 ia sekitar 54% — masih
 * jelas subjek, tetapi kolom teks di kiri punya ruangnya sendiri.
 *
 * Turun ke 1,02 pada akhir `close` — tepat di atas permukaan — lalu menembusnya
 * ke 0,3 sepanjang `enter`.
 *
 * **Di bawah 1,0 kamera berada DI DALAM bola.** Karena material bawaan hanya
 * menggambar muka depan, bolanya lenyap persis saat dilewati; tidak ada trik
 * material yang perlu ditulis untuk itu. Yang membuatnya terbaca sebagai
 * MENEMBUS, bukan sebagai benda yang tiba-tiba hilang, adalah urutannya:
 * permukaan membesar sampai memenuhi bingkai LEBIH DULU, dan keburamannya baru
 * turun pada bagian akhir. Ia pergi setelah menutupi layar, bukan sebelum.
 */
export const ALTITUDE: readonly { at: number; value: number }[] = [
  { at: 0.0, value: 4.8 },
  { at: STATE.turn.to, value: 4.3 },
  { at: STATE.close.to, value: 1.02 },
  /* Penembusan SELESAI pada 0,6, bukan pada 1,0 — dan angka itu berpasangan
     dengan `LIGHT_TO`. Setelah cahaya menutup penuh tidak ada lagi yang bisa
     dilihat di belakangnya, jadi meneruskan gerak kamera sampai ujung section
     berarti menganimasikan sesuatu untuk nol penonton. Sisanya ditahan. */
  { at: 0.6, value: 0.3 },
  { at: 1.0, value: 0.3 },
];

/**
 * Titik pandang: di atas Laut Arab.
 *
 * Satu-satunya titik dari mana Afrika, Eropa, dan Asia Selatan terbaca
 * sekaligus — sehingga bingkai pertama menyebut "dunia", bukan "sebuah bola".
 */
export const VIEWPOINT = { lat: 16, lon: 52 } as const;

/**
 * Seberapa jauh globe berputar sepanjang SELURUH gulir, derajat.
 *
 * Berbasis progres, bukan waktu. Putaran berbasis waktu tidak bisa ditelusuri
 * balik: menggulir ke atas akan memutarnya maju terus, dan §6 menuntut progres
 * scroll yang dapat dibalik persis. Ini juga permintaan harfiah pemilik project —
 * "berputar seiring scroll".
 */
export const TOTAL_TURN = 165;

/**
 * Bagian `enter` yang dilewati sebelum keburaman mulai turun.
 *
 * Tanpa penundaan ini globe memudar SELAGI mendekat, dan yang terbaca benda yang
 * menghilang — bukan permukaan yang dilewati. Dengan 0,55, dua pertiga pertama
 * `enter` dipakai membesarkan permukaan sampai memenuhi bingkai, dan barulah ia
 * pergi.
 */
export const ENTER_FADE_FROM = 0.18;

/* ── Cahaya penutup ─────────────────────────────────────────────────────
   Dua bidang cahaya menutup dari kiri dan kanan sampai bertemu di tengah, dan
   bidang yang tertutup itu MENJADI latar tempat "Yang Hilang" berdiri. Ia bukan
   transisi yang datang lalu pergi; ia permukaan halaman berikutnya yang sampai
   lebih dulu.

   Mekanismenya pernah hidup di project ini sebagai tirai kertas yang
   menyerahkan bingkai dari video ke globe, lalu ikut terhapus bersama
   videonya. Yang dipulihkan mekanismenya; yang berubah wataknya — dulu dua
   pintu kertas, sekarang cahaya.

   **Jendelanya MEMOTONG `enter`, dan itu disengaja.** Penembusan bumi tidak
   berhenti untuk memberi jalan: kamera terus jatuh menembus kerak sementara
   cahaya naik menutupinya. Kalau keduanya dibuat berurutan, akan ada satu
   momen panggung kosong di antaranya — §6 menuntut komposisi yang disengaja di
   tiap kedalaman scroll, dan bidang kosong bukan salah satunya.

   Batas atasnya diukur, bukan dikira: pada sesi lalu judul "Yang Hilang" mulai
   terbaca sekitar progres 0,82. Cahaya karena itu wajib tertutup penuh
   SEBELUM itu, kalau tidak judulnya muncul dari balik bidang yang masih
   setengah terbuka. */

/**
 * Jendela cahaya, dan kenapa ia BERBEDA di ponsel.
 *
 * **Batas atasnya struktural, bukan selera.** Panggung lengket setinggi 100svh
 * di dalam section setinggi H lepas setelah `H - 100` digulir, yaitu pada
 * progres `(H - 100) / H`. Sejak detik itu panggung meluncur ke atas dan section
 * di bawahnya ikut terlihat dari tepi bawah layar.
 *
 *     desktop  260svh  →  lepas pada (260-100)/260 = 0,615
 *     ponsel   210svh  →  lepas pada (210-100)/210 = 0,524
 *
 * Cahaya WAJIB tertutup penuh sebelum angka itu. Versi pertama menutup pada
 * 0,80 — jauh sesudahnya — dan akibatnya persis yang dilaporkan pemilik project:
 * "Yang Hilang" sudah mengintip dari bawah sementara cahayanya masih setengah
 * menutup, sehingga urutan yang diminta jadi terbalik.
 *
 * Satu angka tidak bisa melayani keduanya. Memakai 0,60 membuat ponsel rusak;
 * memakai 0,50 membuat desktop menyeret bidang polos jauh lebih lama daripada
 * perlu. Jadi jendelanya mengikuti breakpoint — `useScrollScene` sudah
 * menyediakan `compact`, jadi tidak ada media query kedua yang harus dijaga
 * tetap sinkron.
 *
 * Yang dijaga sama di keduanya: saat panggung mulai meluncur, layarnya SUDAH
 * jadi satu bidang cahaya penuh. Yang meluncur pergi bukan lagi pemandangan
 * melainkan bidang polos, dan section berikutnya naik di belakang bidang yang
 * sewarna persis — jadi yang terlihat bukan sambungan, melainkan judul yang
 * muncul di tengah cahaya.
 */
export const LIGHT = { from: 0.42, to: 0.6 } as const;
export const LIGHT_COMPACT = { from: 0.34, to: 0.5 } as const;

/** 0 sebelum keadaan mulai, 1 setelah selesai. Linear di dalamnya. */
export function stateProgress(progress: number, name: StateName): number {
  const { from, to } = STATE[name];
  if (to <= from) return progress >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - from) / (to - from)));
}

/** Smoothstep di tiap sambungan — kecepatan linear berubah mendadak dan mata membacanya sebagai patahan. */
export function altitudeAt(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  if (t <= ALTITUDE[0].at) return ALTITUDE[0].value;

  let a = ALTITUDE[0];
  let b = ALTITUDE[ALTITUDE.length - 1];

  for (let i = 0; i < ALTITUDE.length - 1; i += 1) {
    if (t >= ALTITUDE[i].at && t <= ALTITUDE[i + 1].at) {
      a = ALTITUDE[i];
      b = ALTITUDE[i + 1];
      break;
    }
  }

  const span = b.at - a.at;
  const k = span <= 0 ? 0 : (t - a.at) / span;
  const e = k * k * (3 - 2 * k);
  return a.value + (b.value - a.value) * e;
}

/* ── Kenapa tidak ada peta keadaan kedua untuk ponsel ───────────────────
   Perjalanan yang lebih pendek di ponsel datang dari TINGGI SECTION-nya, bukan
   dari batas keadaan yang digeser. Satu peta berarti tidak ada kemungkinan dua
   pembaca berbeda pendapat tentang di mana sebuah beat dimulai. */

/**
 * Pose diam saat gerak dikurangi.
 *
 * Tepat setelah `arrive` selesai: globe sudah utuh di kanan pada ukuran
 * bacanya, kelima belas penanda sudah menyala, teks hero masih penuh, dan tidak
 * ada satu pun lapisan yang tertangkap di tengah perpindahan. Bingkai yang
 * paling menjelaskan — §10.
 */
export const STILL_PROGRESS = 0.12;
