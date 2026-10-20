# Vestigia

**Jejak peradaban, dalam tiga dimensi.**

Atlas warisan budaya dunia yang bisa diputar, didekati, dan ditanyai. Setiap
situs hadir sebagai object 3D interaktif dengan penanda yang menempel pada
geometrinya sendiri, didampingi pemandu AI yang menjawab berdasarkan data situs
tersebut — bukan dari ingatan model.

Tersedia dalam Bahasa Indonesia dan English.

**Situs langsung:** <https://vestigia-topaz.vercel.app>
**Dokumentasi lengkap:** [`submission/`](submission/) — konsep, dokumentasi teknis,
dan log pengembangan.

---

## Masalah yang diangkat

Warisan budaya dunia sebagian besar hanya bisa diakses lewat foto dan teks. Foto
membekukan satu sudut pandang; teks menuntut pembaca sudah tahu bentuk yang
sedang dijelaskan. Di antara keduanya, arsitektur — hal yang paling ingin
dipahami orang dari sebuah situs — justru yang paling sulit ditangkap.

Vestigia menukar keduanya dengan object yang bisa diputar, dan penjelasan yang
terikat pada bagian yang sedang dilihat.

---

## Menjalankan

Butuh Node 20 atau lebih baru.

```bash
npm install
npm run dev             # server pengembangan
npm run build           # type-check + build produksi
npm run lint
```

Tidak ada langkah unduh asset terpisah: kelima belas model 3D (51,9 MB) ikut di
dalam repository ini.

**Kunci API tidak wajib.** Tanpa kunci, seluruh fitur AI tetap jalan dalam mode
luring — jawabannya dirakit langsung dari basis pengetahuan situs dan ditandai
sebagai mode luring. Untuk menghidupkan pemandu yang sesungguhnya, salin
`.env.example` menjadi `.env.local` lalu isi salah satu kunci penyedia yang ada
di sana.

---

## Cara kerja koleksi

Koleksi tidak ditulis di dalam kode. Sebuah situs masuk koleksi aktif hanya
kalau **dua-duanya** ada:

```
public/models/<benua>/<slug>.glb     model 3D-nya
src/data/heritage/<slug>.ts          metadata-nya, ditulis tangan
```

Punya salah satu saja tidak cukup — GLB tanpa metadata tidak ada yang bisa
diceritakan, metadata tanpa GLB kehilangan inti pengalamannya. Keduanya gagal
dengan diam di runtime dan berisik di terminal saat sync, bukan dengan crash.

Konsekuensinya: menambah situs baru berarti menaruh satu file GLB dan menulis
satu file data. Tidak ada kode aplikasi yang perlu diubah, dan benua tanpa isi
tidak muncul di mana pun.

`npm run sync:heritage` adalah langkah penyiapan, bukan syarat menjalankan. Ia
mengambil GLB mentah dari folder penyiapan lokal kalau ada, mengoptimasinya
(Draco + resize texture), menyalin hasilnya ke `public/models/`, dan menulis
ulang `src/data/generated/asset-manifest.ts`. Kalau folder itu tidak ada — dan
pada salinan repository ini memang tidak — ia melaporkannya lalu melewatkan
dirinya tanpa menyentuh manifest. Ia berjalan otomatis sebelum `dev` dan
`build`, jadi tidak perlu dipanggil sendiri.

---

## Susunan

```
src/
├─ app/                    rute App Router
│  ├─ page.tsx             landing
│  ├─ about/               latar dan batas karya
│  ├─ heritage/[slug]/     penampil 3D — inti aplikasi
│  └─ api/ai/              route handler fitur AI
│     ├─ guide/            pemandu budaya, terikat satu situs
│     ├─ quiz/             soal dibangun dari data situs
│     ├─ compare/          perbandingan dua situs
│     └─ story/            narasi singkat
├─ components/
│  ├─ three/               kanvas, model, hotspot, kontrol
│  ├─ workspace/           tata letak tiga kolom halaman warisan
│  ├─ heritage/            kartu, panel informasi, lini masa
│  ├─ landing/             section landing page
│  ├─ ai/                  panel pemandu, kuis, perbandingan
│  ├─ shell/               header, footer, ganti bahasa
│  └─ ui/                  primitif tombol dan sejenisnya
├─ concepts/a/             komponen penyusun landing
├─ data/
│  ├─ types.ts             kontrak data yang dipenuhi setiap situs
│  ├─ heritage/<slug>.ts   metadata per situs, ditulis tangan
│  ├─ generated/           manifest asset — digenerate, jangan diedit
│  └─ registry.ts          gabungan manifest × metadata
└─ lib/
   ├─ three/               normalisasi model, penempelan hotspot
   ├─ ai/                  adapter provider, grounding, pagar cakupan
   └─ i18n/                kamus dan penyedia bahasa
```

**Stack** — Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
three.js · React Three Fiber · drei · GSAP

---

## Catatan penampil 3D

**Model dinormalisasi saat dimuat.** GLB datang dengan skala, pivot dan posisi
yang berbeda-beda. Sebelum masuk scene, setiap model diskalakan sehingga sisi
terpanjangnya sama, dipusatkan pada XZ, dan didudukkan tepat di lantai. Dengan
begitu satu rig kamera dan satu setelan cahaya berlaku untuk semua object —
yang persis dibutuhkan supaya menambah asset tidak menyentuh arsitektur.

**Penanda mencari permukaan, bukan koordinat.** Menulis hotspot sebagai titik
tetap di dalam bounding box menaruh pin di udara sesering di batu, karena
bounding box adalah kotak dan bangunan tidak. Jadi hotspot hanya menyatakan
*jenis permukaan* yang ia maksud — puncak, tanah, atau kulit luar — dan engine
mencarinya dari geometri model itu sendiri lewat sampling medan ketinggian.
Anchor hanya memilih bagian mana dari permukaan itu.

**Render hanya saat ada yang berubah.** Mengorbit menggerakkan kamera, bukan
geometri, jadi tidak ada alasan menggambar ulang enam puluh kali per detik saat
layar diam.

---

## Catatan pemandu AI

Pemandu dibatasi pada basis pengetahuan situs yang sedang dilihat: deskripsi,
signifikansi, fitur utama, lini masa, fakta, dan daftar sumber. Kalau sebuah
pertanyaan tidak terjawab oleh data itu, ia mengatakan demikian alih-alih
mengarang tanggal, angka, atau sumber.

Batasan ini disengaja, dan diuji secara eksplisit. Penjelasan yang terdengar
meyakinkan tetapi salah lebih merugikan bagi pemahaman warisan budaya daripada
tidak ada jawaban sama sekali.

Seluruh pemanggilan model terjadi di server; kunci tidak pernah sampai ke
peramban. Cakupan dikunci berlapis, dan usaha membujuk pemandu keluar dari
warisan budaya ditolak sebelum model dipanggil.

---

## Aksesibilitas

- Penampil 3D bisa dikendalikan sepenuhnya dari papan ketik
- Penanda adalah tombol yang bisa difokus; anotasinya terbuka pada fokus, bukan hanya hover
- `prefers-reduced-motion` dihormati di CSS maupun di animasi kamera dan scroll
- Cincin fokus tidak pernah dihilangkan, hanya diberi bentuk
