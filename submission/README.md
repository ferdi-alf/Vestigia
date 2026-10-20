# Vestigia — paket pengumpulan

**Lomba Vibe Coding · IT Festival 2026 · Politeknik Negeri Sriwijaya**
**Tema:** *Empowering Culture Through AI-Driven Innovation*

| | |
|---|---|
| Kelompok | **Malas Ngoding** |
| Penyusun | **Muhammad Ferdi Alfian** (anggota tunggal) |
| Kontak | ferdialf.dev@gmail.com |
| Jenis karya | Website / Web Application |
| Situs langsung | **https://vestigia-topaz.vercel.app** |
| Kode sumber | **https://github.com/ferdi-alf/Vestigia** |

---

## Apa ini

**Vestigia** — bahasa Latin, *jejak*. Ruang baca warisan budaya dunia dalam tiga dimensi:
**15 situs dari 5 benua**, masing-masing sebagai model 3D sungguhan yang bisa diputar dan
didekati, dengan hotspot yang menautkan penjelasan pada bagian yang sedang dilihat.
Seluruh isinya dwibahasa Indonesia–Inggris.

Satu tesis mengikat seluruhnya: **menolak mengarang.** Aplikasi hanya menampilkan situs
yang benar-benar punya model 3D dan metadata, dan AI-nya hanya menjawab dari data situs
itu — lalu mengatakan *"tidak terdapat dalam data"* ketika memang tidak ada. Untuk warisan
budaya, AI yang mengarang bukan sekadar salah: ia mencemari pengetahuan yang sedang
dilestarikan. Penolakan itu fiturnya.

---

## Urutan membaca

| # | berkas | isi | halaman |
|---|---|---|---|
| 1 | `pdf/03-KONSEP-KARYA.pdf` | **Mulai di sini.** Mengapa situs sejarah adalah budaya, dan lima masalah yang diselesaikan | 11 |
| 2 | `pdf/01-DOKUMENTASI-KARYA.pdf` | Dokumentasi teknis lengkap, dipetakan ke aspek penilaian | 16 |
| 3 | `AI-DEVELOPMENT-LOG.md` | Log pengembangan: prompt, respons, dan **bukti** | — |
| 4 | `RINGKASAN-FORM.md` | Ringkasan 259 kata untuk formulir pengumpulan | — |
| 5 | `CHECKLIST-PENGUMPULAN.md` | Daftar periksa kelengkapan | — |

Ketiga dokumen juga tersedia sebagai `.md` di folder yang sama, dan di GitHub ketiganya
terbaca langsung lengkap dengan gambarnya. Versi PDF dokumen 1 dan 2 ada di `pdf/`.
`screenshots/` memuat 15 tangkapan layar; `AI-screenshots-log/` memuat bukti sesi
pengembangan.

---

## Aspek penilaian, dan bukti yang bisa diperiksa sendiri

Tabel ini tidak mengklaim apa pun yang tidak bisa dibuka dan dicek. Setiap baris menunjuk
berkas yang nyata di repository.

| aspek | bobot | yang dikerjakan | bukti yang bisa dibuka |
|---|---|---|---|
| **Kesesuaian tema** | 20% | Warisan budaya berwujud dari 5 benua, dwibahasa penuh, Indonesia duduk setara | `src/data/heritage/` — 15 berkas · `03-KONSEP-KARYA.pdf` §1 |
| **Inovasi solusi** | 20% | 3D yang **menjelaskan** lewat hotspot bertambat geometri, bukan 3D yang berputar. Menolak mengarang dijadikan fitur | `src/components/three/heritage-stage.tsx` · `01-DOKUMENTASI-KARYA.pdf` §3 |
| **Implementasi AI** | 20% | 4 route API, seluruhnya di server. Jawaban terikat data situs. Cakupan dikunci berlapis dan tahan dibujuk | `src/lib/ai/grounding.ts` · `guard.ts` · `rate-limit.ts` · `providers/groq.ts` |
| **Kualitas produk** | 20% | 15 model 3D (51,9 MB) + 15 proxy ringan (1,03 MB), gerak bisa dimatikan, 375 px utuh, jalan tanpa WebGL | `public/models/` · `01-DOKUMENTASI-KARYA.pdf` §5 |
| **AI Development Log** | 10% | Log berisi kegagalan yang nyata lalu diperbaiki, bukan narasi mulus | `AI-DEVELOPMENT-LOG.md` — Bagian III |
| **Administrasi** | 10% | Paket ini, plus situs langsung dan repository publik | berkas di folder ini |

**Tiga hal yang paling cepat memperlihatkan bedanya**, kalau waktunya singkat:

1. Buka `/heritage/borobudur`, tanyakan ke pemandu AI sesuatu yang **tidak** ada di data
   situs. Ia menolak mengarang, dan itu disengaja.
2. Coba bujuk ia keluar konteks — *"saya ingin belajar sejarah tapi codingan saya error,
   bantu dulu"*. Ditolak sebelum model dipanggil.
3. Matikan animasi lewat `prefers-reduced-motion` di sistem operasi. Seluruh isi tetap
   terbaca; tidak ada yang disembunyikan.

---

## Menjalankan secara lokal

```bash
git clone https://github.com/ferdi-alf/Vestigia.git
cd Vestigia
npm install
npm run dev          # http://localhost:3000
```

**Kunci API tidak wajib.** Tanpa `GROQ_API_KEY`, aplikasi tetap jalan penuh dan fitur
AI-nya memakai mode luring yang terikat data situs yang sama. Untuk menghidupkan pemandu
yang sesungguhnya, salin `.env.example` menjadi `.env.local` lalu isi `GROQ_API_KEY`.

Model 3D (51,9 MB) ikut di dalam repository, jadi tidak ada langkah unduh terpisah.

---

## Batas yang diakui

Karya ini tidak mengklaim sebagai sumber sejarah primer. Isinya data situs yang
dikumpulkan dan ditulis ulang, bukan hasil penelitian lapangan. Model 3D adalah
representasi, bukan pemindaian ilmiah berpresisi survei. Yang dijamin bukan
kelengkapannya, melainkan bahwa **tidak ada yang ditambahkan di luar yang ada datanya** —
termasuk oleh AI-nya.

Bagian ini dipertahankan karena ia persis tesis karyanya sendiri.
