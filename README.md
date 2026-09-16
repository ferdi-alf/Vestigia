# Vestigia

**Jejak peradaban, dalam tiga dimensi.**

Atlas warisan budaya dunia yang bisa diputar, didekati, dan ditanyai. Setiap
situs hadir sebagai object 3D interaktif dengan penanda yang menempel pada
geometrinya sendiri, didampingi pemandu AI yang menjawab berdasarkan data situs
tersebut — bukan dari ingatan model.

Tersedia dalam Bahasa Indonesia dan English.

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
npm run sync:heritage   # baca /3d-object, optimasi GLB, tulis manifest
npm run dev             # server pengembangan
npm run build           # type-check + build produksi
npm run lint
```

`npm run sync:heritage` berjalan otomatis sebelum `dev` dan `build`.

---

## Cara kerja koleksi

Koleksi tidak ditulis di dalam kode. Ia dibaca dari folder `/3d-object` di luar
aplikasi:

```
3d-object/<benua>/<slug>.glb   →   npm run sync:heritage
                                        │
                                        ├─ optimasi Draco + resize texture
                                        ├─ salin ke public/models/<benua>/
                                        └─ tulis src/data/generated/asset-manifest.ts
```

Sebuah situs masuk koleksi aktif hanya kalau **dua-duanya** ada: file GLB, dan
file metadata di `src/data/heritage/<slug>.ts`. Punya salah satu saja tidak
cukup — GLB tanpa metadata tidak ada yang bisa diceritakan, metadata tanpa GLB
kehilangan inti pengalamannya. Keduanya gagal dengan diam di runtime dan berisik
di terminal saat sync, bukan dengan crash.

Konsekuensinya: menambah situs baru berarti menaruh satu file GLB dan menulis
satu file data. Tidak ada kode aplikasi yang perlu diubah, dan benua tanpa isi
tidak muncul di mana pun.

Konvensi penamaan file ada di [`../3d-object/README.md`](../3d-object/README.md).

---

## Susunan

```
src/
├─ app/                    rute App Router
│  ├─ page.tsx             landing
│  ├─ explore/             pemilih benua → koleksi per benua
│  ├─ heritage/[slug]/     penampil 3D — inti aplikasi
│  ├─ compare/             perbandingan dua situs
│  └─ api/ai/              route handler untuk fitur AI
├─ components/
│  ├─ three/               kanvas, model, hotspot, kontrol
│  ├─ heritage/            kartu, panel informasi, lini masa
│  ├─ landing/             section landing page
│  ├─ ai/                  panel pemandu, kuis, perbandingan
│  └─ shell/               header, footer, ganti bahasa
├─ data/
│  ├─ types.ts             kontrak data yang dipenuhi setiap situs
│  ├─ heritage/<slug>.ts   metadata per situs, ditulis tangan
│  ├─ generated/           manifest asset — digenerate, jangan diedit
│  └─ registry.ts          gabungan manifest × metadata
└─ lib/
   ├─ three/               normalisasi model, penempelan hotspot
   ├─ ai/                  adapter provider, grounding, prompt
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

Tanpa kunci API terpasang, aplikasi tetap berfungsi penuh: jawaban dirakit
langsung dari basis pengetahuan dan ditandai sebagai mode luring.

---

## Aksesibilitas

- Penampil 3D bisa dikendalikan sepenuhnya dari papan ketik
- Penanda adalah tombol yang bisa difokus; anotasinya terbuka pada fokus, bukan hanya hover
- `prefers-reduced-motion` dihormati di CSS maupun di animasi kamera dan scroll
- Cincin fokus tidak pernah dihilangkan, hanya diberi bentuk
