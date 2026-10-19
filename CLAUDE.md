@AGENTS.md

# Vestigia — Instruksi Project

Lapisan orkestrasi. Berkas ini **tidak menyalin isi skill**; ia memutuskan skill mana
yang berkuasa atas apa, dan apa yang berlaku ketika dua skill bertentangan.

---

## 1. Visi

Vestigia adalah ruang baca warisan budaya dunia dalam tiga dimensi. Dua pengalaman,
satu dunia:

1. **Landing sinematik** — pengunjung *turun menembus* satu lanskap batu pada cahaya
   pertama, dan halaman membuka cerita tentang apa yang hilang ketika sebuah situs hilang.
2. **Penjelajah 3D** — satu object warisan nyata per halaman, bisa diputar, didekati, dan
   ditanyai. 3D di sini berfungsi menjelaskan, bukan berputar karena 3D terlihat keren.

Tesis yang mengikat keduanya: **menolak mengarang.** Aplikasi hanya menampilkan situs yang
benar-benar punya model 3D dan metadata; AI-nya hanya menjawab dari data situs itu dan
mengatakan "tidak ada dalam data" ketika memang tidak ada. Arah seninya —
cahaya rendah menyapu batu sampai tepinya terbaca — adalah gambar harfiah dari tesis itu.

## 2. Prinsip implementasi

1. **Nol asumsi asset.** Aplikasi harus build dan jalan dengan nol GLB dan nol gambar.
   Apa yang ada ditentukan manifest yang digenerate, bukan daftar yang ditulis tangan.
2. **Menambah isi tidak boleh mengubah arsitektur.** Satu GLB + satu berkas metadata =
   satu warisan baru. Satu berkas gambar = satu slot terisi. Nol perubahan kode.
3. **Jangan mengejar visual tinggi kalau membuat web sulit dipakai di perangkat biasa.**
   Ini aturan pemilik project dan ia mengalahkan setiap saran estetis.
4. **Jangan overengineer.** Tidak ada dependency baru tanpa kebutuhan konkret yang
   tidak bisa dijawab yang sudah terpasang.
5. **Jangan membuat klaim palsu** tentang proses, kepemilikan, atau sejarah project.
   Dokumentasi menggambarkan apa yang benar-benar terjadi.

## 3. Prioritas skill

Skill tersedia di `.claude/skills/` (folder ini di-gitignore: perkakas penulis, bukan
bagian dari produk). **Yang lebih tinggi menang saat bertentangan.**

| # | Otoritas | Berkuasa atas | Catatan |
|---|---|---|---|
| 1 | **Instruksi pemilik project** + berkas ini | segalanya | mengalahkan seluruh saran skill |
| 2 | **Kontrak data & anti-mengarang** (`registry.ts`, `lib/ai/grounding.ts`) | apa yang boleh tampil dan apa yang boleh dikatakan | tidak bisa ditawar oleh alasan estetis apa pun |
| 3 | **Aksesibilitas & gerak-dikurangi** | semua keputusan UI | halaman yang gagal di sini ditolak seberapa pun indahnya |
| 4 | `cinematic-scroll` | arah seni, koreografi scroll, momen tanda tangan, resep | otoritas atas **pengalamannya seperti apa** |
| 5 | `design-system`, `brand` | arsitektur token, konsistensi identitas | **memvalidasi** token yang sudah ada, bukan menggantinya |
| 6 | `ui-ux-pro-max` | daftar periksa UX/a11y, pola interaksi | alat **konsultasi**; hasil pencarian tidak pernah diterapkan otomatis |
| 7 | `gsap-scrolltrigger` → `gsap-timeline` → `gsap-core`; `gsap-react` (siklus hidup); `gsap-performance` (jalur panas); `gsap-plugins`, `gsap-utils`, `gsap-frameworks` (bila benar-benar dibutuhkan) | **bagaimana gerak diimplementasikan** | `gsap-performance` mengalahkan `cinematic-scroll` pada konflik biaya frame. Plugin berbayar di `gsap-plugins` (SplitText, ScrollSmoother, Flip) **tidak dipakai** — belum ada kebutuhan yang tidak bisa dijawab ScrollTrigger |
| 8 | **MCP `reactbits.dev`** | sumber komponen beranimasi dan latar, serta **rujukan pola desain dan pewarnaan** | Diambil komponennya hanya bila ada kebutuhan nyata. Yang lebih berharga adalah polanya — cara komponennya disusun dan diwarnai — untuk diterapkan pada token kita sendiri, bukan disalin mentah-mentah. Komponennya mengimpor `cn` dari `@/lib/utils`, yang sudah ada dan meneruskan ke implementasi kita. |
| 9 | `ui-styling` | utilitas Tailwind saja | **bagian shadcn-nya di luar cakupan** — komponen di project ini ditulis tangan |

**Penyelesaian konflik yang sudah diputuskan:**

- Efek yang diminta arah sinematik tetapi dilarang `gsap-performance` → **performa menang**;
  cari mekanisme lain, jangan diam-diam menurunkan ambisinya.
- Saran palet atau tipografi dari `ui-ux-pro-max` → **diabaikan**. Palet sudah terkunci di
  `globals.css` dan diturunkan dari cahaya panggung 3D.
- Saran komponen shadcn → **diabaikan**. Menambah Radix berarti dependency baru untuk
  komponen yang sudah ada dan sudah aksesibel.
- Komponen reactbits yang membawa paletnya sendiri → **warnanya diganti token kita**.
  Yang diambil adalah mekanismenya, bukan identitas visual orang lain.
- `gsap-react` meminta `@gsap/react` → **diadopsi**. Satu paket kecil yang menghapus
  seluruh kelas bug pembersihan; ini pengecualian sah dari aturan "tanpa dependency baru".

## 4. Anti design slop

Yang **dilarang** — daftar pemilik project, ditambah yang ditegakkan skill:

- layout SaaS generik, landing yang terbaca seperti template
- kartu melayang berlebihan, glassmorphism, gradien tanpa alasan, blur berlebih
- animasi dekoratif yang tidak menceritakan apa pun
- spasi tidak konsisten, terlalu banyak titik fokus yang bersaing
- chrome UI berlebihan, ikon tempelan acak
- section yang semuanya terlihat sama
- **menganimasikan `filter`** (`blur`, `brightness`, `contrast`) saat scroll — buram
  dipanggang ke dalam asset, tidak pernah dianimasikan
- **menganimasikan `width`/`height`/`top`/`left`/`margin`/`padding`** — pakai `transform`
- **`setState` di dalam handler scroll** — pakai ref dan tulis langsung ke DOM
- **parallax pada teks di bawah 18px** — badan teks tidak pernah bergerak saat scroll
- mencegat `wheel`/`touch` untuk memaksa urutan; scroll native selalu utuh
- gerak yang berjalan sendiri tanpa pemicu pengguna
- **membuat warna baru** di luar token `globals.css`
- selektor CSS atau cabang JS yatim yang tidak menyentuh elemen mana pun

Yang **diutamakan**: hierarki jelas · ruang kosong yang disengaja · komposisi editorial ·
titik fokus kuat · identitas khas · UI yang menahan diri · arah seni spesifik-subjek ·
transisi sinematik · **satu bahasa material dan cahaya** · sistem desain konsisten.

## 5. Konsistensi desain

**Satu dunia.** Premis, motif, dan bahasa cahayanya terkunci; jangan mengarang yang baru.

- **Cahaya selalu dari kiri**, hangat, rendah. Berlaku untuk gambar, gradien CSS, *dan*
  `directionalLight` di panggung 3D. Ini alasan render 3D dan gambar generate terlihat
  berada di tempat yang sama.
- **Lima motif berulang**: `raking-light`, `dust`, `strata`, `carved-edge`,
  `coordinate-mark`. **Setiap section wajib membawa minimal satu.** Kalau tidak bisa,
  section itu tidak termasuk dunia ini.
- **Material yang boleh**: batu kering, debu, logam berpatina. **Yang dilarang**: kaca,
  krom, neon, plastik.
- **Token warna hanya dari `globals.css`.** Tidak ada hex mentah di komponen.
- **Maksimal dua typeface**: `--font-display` (Cormorant Garamond) untuk judul,
  `--font-sans` (Inter) untuk UI. Variasi lain lewat bobot, bukan keluarga ketiga.
- **Tidak semua teks rata tengah.** Badan teks rata kiri; hanya sebagian judul display
  yang rata tengah. Asimetri menghasilkan ketegangan.
- `line-height` minimal 1,1 untuk display, 1,5 untuk badan teks.

## 6. Prinsip gerak sinematik

- **Satu jam scroll, satu pemilik per properti animasi.** Dua sistem yang menggerakkan
  `transform` yang sama adalah sumber bug yang mustahil ditelusuri.
- Setiap beat punya **pembuka → transformasi → tahan yang terbaca → lepas**. Teks berhenti
  bergerak selama ia harus dibaca.
- **Progres scroll langsung dan dapat dibalik.** Scroll ke atas menelusuri ulang persis.
- **Bingkai lengkap di setiap kedalaman scroll.** Pada 0%, 33%, 66%, 100% viewport harus
  berisi komposisi yang disengaja — bukan setengah transisi. Selalu ada komposisi dasar
  permanen di belakang; panggung tidak pernah dianimasikan sampai kosong.
- Scrub langsung memakai `ease: "none"`. Easing hanya untuk gerak berbasis waktu.
- `will-change` dipasang saat animasi mulai dan **dilepas saat selesai**.
- **Satu momen tanda tangan** untuk seluruh situs, bukan satu per section.
- Setiap lapisan parallax wajib membawa informasi visual yang berbeda. Kalau menghapus satu
  lapisan tidak mengubah apa pun, gabungkan — parallax kosong itu dekorasi yang menyamar.

## 7. Prinsip pengalaman 3D

- **Muat sesuai permintaan.** Kanvas baru di-mount ketika section-nya masuk viewport.
  Membuka landing dan berhenti di hero tidak boleh menarik satu byte GLB pun.
- **Loading berprogres persen** yang terlihat, di atas komposisi dasar permanen — bukan
  spinner tanpa akhir yang menutupi halaman.
- **Nonaktifkan saat tidak terlihat.** Gerbangnya dua: `IntersectionObserver` *dan*
  `document.visibilitychange`. `frameloop="demand"` sudah berarti tidak ada gambar ulang
  tanpa perubahan; auto-rotate dan animasi apa pun tetap harus dihentikan eksplisit.
- **Muncul kembali dengan mulus**, tidak menyentak: fade in, dan kamera mulai dari pose
  terakhir, bukan dari awal.
- **`dispose()` wajib saat teardown** — geometry, material, texture, controls, observer,
  listener. Three.js tidak mengumpulkan sampah GPU untuk Anda.
- **Path asset tidak pernah ditulis di dalam kode.** Semuanya dari manifest yang digenerate.
- Satu konteks WebGL per halaman. `dpr` dibatasi `[1, 2]`, lebih rendah di ponsel.
- Gagal apa pun — WebGL tidak ada, dekoder gagal, konteks hilang — harus mendarat pada
  poster permanen plus seluruh teks dan aksinya. Status gagal tidak boleh mengaku berhasil.
- Tekstur maksimal 2048², geometri Draco, anggaran 4 MB per model.

## 8. Performa

| Ukuran | Target |
|---|---|
| Lighthouse desktop | ≥ 90 keempat kategori |
| Lighthouse mobile Performance | ≥ 75 |
| Frame saat scroll | 60fps desktop, 30fps ponsel kelas menengah |
| GLB per model | ≤ 4 MB setelah Draco |
| Gambar landing, total | ≤ 1,2 MB · hero ≤ 600 KB |
| Permintaan `.glb` saat landing dibuka tanpa scroll | **nol** |

Hanya `transform` dan `opacity` di jalur panas. Tidak ada CDN pihak ketiga di jalur kritis —
dekoder Draco dan environment map di-host sendiri.

## 9. Responsif

- Uji pada **375 / 768 / 1440**. Tidak pernah ada scroll horizontal.
- Ponsel adalah **komposisi yang utuh**, bukan desktop yang dipangkas: perjalanan lebih
  pendek, lapisan lebih sedikit, alur baca alami, tanpa pin.
- Target sentuh minimal 44×44 px, jarak antar target ≥ 8 px.
- Tilt pointer hanya di perangkat ber-hover dengan pointer halus.

## 10. Gerak dikurangi

- `gsap.matchMedia()` dengan `(prefers-reduced-motion: reduce)` — **ScrollTrigger tidak
  pernah dipasang**, bukan dipasang lalu dimatikan. Blok `@media` di CSS tidak bisa
  menghentikan GSAP, jadi ini wajib di JS.
- Lapisan berhenti pada **bingkai yang paling menjelaskan**, bukan pada nol.
- Seluruh pesan dan aksi tetap tersedia. Konten tidak pernah disembunyikan dengan `hidden`,
  `inert`, `display:none`, atau `visibility:hidden` — yang dianimasikan adalah presentasi,
  bukan ketersediaan.
- Tidak ada loop kontinu, autoplay, pin, parallax, atau smoothing.
- Perubahan preferensi saat halaman terbuka harus direspons.

## 11. Alur kerja implementasi

1. **Baca dulu**, jangan menebak: `src/data/types.ts`, `registry.ts`, `globals.css`,
   `_internal/01-art-direction.md`.
2. Muat **satu** resep dari `cinematic-scroll` sesuai pengalaman yang dibangun —
   `editorial-story` untuk landing, `real-time-3d` untuk penjelajah. Jangan berkeliling
   membaca semua referensi.
3. **Bangun irisan vertikalnya dulu**: hero dan momen tanda tangannya, sampai benar-benar
   jalan, sebelum menambah section lain.
4. Periksa di peramban sungguhan pada 0%, 33%, 66%, 100%. Konsol bersih bukan bukti visual.
5. `npm run build` harus hijau sebelum apa pun disebut selesai.
6. Baru lanjut ke section berikutnya.

## 12. Daftar periksa tinjauan

Sebelum menyebut sebuah halaman selesai:

- [ ] Tepat satu `h1` semantik, urutan heading koheren, teks bisa dipilih
- [ ] Fokus selalu terlihat; seluruh alur bisa ditempuh dengan papan ketik saja
- [ ] Kontras teks ≥ 4,5:1
- [ ] `prefers-reduced-motion` → `ScrollTrigger.getAll().length === 0`, semua teks terbaca
- [ ] 375 / 768 / 1440 tanpa scroll horizontal
- [ ] Empat kedalaman scroll masing-masing berdiri sebagai komposisi yang disengaja
- [ ] Setiap section membawa minimal satu motif dan bahasa cahaya yang sama
- [ ] Tidak ada warna di luar token, tidak ada typeface ketiga
- [ ] Tidak ada `filter`/layout yang dianimasikan; tidak ada `setState` dalam handler scroll
- [ ] Kanvas 3D tidak memuat apa pun sebelum terlihat, dan berhenti saat tidak terlihat
- [ ] Setiap listener, observer, timeline, dan sumber daya GPU dibersihkan saat teardown
- [ ] Tidak ada selektor CSS atau cabang JS yatim
- [ ] Build hijau; halaman jalan dengan nol gambar dan nol GLB
