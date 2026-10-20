# Daftar periksa pengumpulan

**Kelompok Malas Ngoding · Muhammad Ferdi Alfian · ferdialf.dev@gmail.com**
Diperiksa: **19 Oktober 2026**

Status diisi apa adanya. Yang belum selesai ditulis belum selesai — daftar periksa yang
semuanya tercentang padahal tidak, tidak berguna bagi siapa pun.

---

## Identitas

| | | |
|---|---|---|
| Nama kelompok | Malas Ngoding | ☑ |
| Nama lengkap peserta | Muhammad Ferdi Alfian | ☑ |
| Jumlah anggota | 1 (tunggal) | ☑ |
| Kontak | ferdialf.dev@gmail.com | ☑ |
| Institusi | tanpa institusi | ☑ |

## Karya

| | status | bukti |
|---|---|---|
| Situs dapat diakses publik | ☑ | https://vestigia-topaz.vercel.app — diperiksa membalas 200 pada `/`, `/about`, `/heritage/borobudur` |
| Kode sumber dapat diakses | ☑ | https://github.com/ferdi-alf/Vestigia — riwayat commit publik, termasuk perbaikan yang dicatat apa adanya |
| Berjalan tanpa kunci API | ☑ | mode luring terikat data situs yang sama |
| Fitur AI hidup di produksi | ☑ | diuji langsung pada situs yang sudah ter-deploy |
| AI menolak mengarang | ☑ | pertanyaan tanpa data dijawab *"tidak terdapat dalam data"* |
| AI menolak keluar cakupan | ☑ | dalih pemrograman ditolak, header `X-Ai-Refused: coding` |
| Kunci API tidak ada di kode | ☑ | hanya di `.env.local` dan environment Vercel; nol kecocokan di seluruh riwayat git |

## Dokumen

| | status | halaman |
|---|---|---|
| `pdf/01-DOKUMENTASI-KARYA.pdf` | ☑ | 16 |
| `pdf/02-AI-DEVELOPMENT-LOG.pdf` | ☑ | 19 |
| `pdf/03-KONSEP-KARYA.pdf` | ☑ | 11 |
| `README.md` — pintu masuk paket + peta bukti | ☑ | — |
| `RINGKASAN-FORM.md` — jawaban formulir, 259 kata | ☑ | — |
| Tangkapan layar | ☑ | 15 berkas di `screenshots/` |
| Bukti sesi pengembangan | ☑ | 2 berkas di `AI-screenshots-log/` |
| Teks PDF bisa diseleksi dan dicari | ☑ | bukan gambar; font tertanam |
| **Tidak ada teks tersembunyi di PDF mana pun** | ☑ | teks hasil ekstraksi sama dengan yang terlihat di halaman |

## Yang BELUM selesai

| | catatan |
|---|---|
| ☐ Video demo 2–5 menit | direkam sendiri oleh peserta; server lokal sudah disiapkan untuk perekaman |
| ☐ Tautan video pada formulir | menunggu videonya selesai |

## Catatan teknis yang diketahui dan diterima

- **`colosseum.glb` 11,7 MB**, melewati anggaran 4 MB per model yang ditulis di aturan
  engineering project sendiri. Diketahui, belum dioptimalkan ulang. Dicatat di sini
  daripada didiamkan.
- Total 15 model penuh **51,9 MB** ikut di dalam repository, ditambah 15 proxy ringan
  **1,03 MB** yang dimuat lebih dulu.
- **Versi PDF log pengembangan tidak dipublikasikan di repository.** Versi Markdown-nya
  lengkap dan ada di folder ini; PDF dokumen 1 dan 2 ikut di `pdf/`.
- **`.mcp.json` tidak lagi dilacak repository.** Ia konfigurasi perkakas penulis, bukan
  bagian dari produk, dan salinan lokalnya memuat kunci API perkakas pengembangan. Kunci
  itu nol kecocokan di seluruh riwayat git — diperiksa commit per commit, bukan diasumsikan.

## Setelah lomba selesai

- ☐ **Putar ulang `GROQ_API_KEY`.** Kunci yang dipakai sekarang pernah ditempel dalam
  bentuk polos selama pengembangan.
- ☐ Putar ulang kunci perkakas yang ada di `.mcp.json` lokal.
