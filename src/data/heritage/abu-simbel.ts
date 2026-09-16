import type { HeritageMeta } from "../types";

export const abuSimbel: HeritageMeta = {
  slug: "abu-simbel",
  name: { id: "Abu Simbel", en: "Abu Simbel" },
  country: { id: "Mesir", en: "Egypt" },
  location: { id: "Kegubernuran Aswan", en: "Aswan Governorate" },
  coordinates: [22.3372, 31.6258],
  period: { id: "sekitar 1264 SM", en: "c. 1264 BCE" },
  civilization: { id: "Dinasti Kesembilan Belas Mesir Kuno", en: "Nineteenth Dynasty of ancient Egypt" },
  category: "temple",

  description: {
    id: "Dua kuil yang dipahat langsung ke dalam tebing batu pasir atas perintah Ramses II, dijaga empat patung duduk setinggi sekitar dua puluh meter. Kuil ini menghadap ke selatan, ke arah Nubia — sebuah pernyataan kekuasaan yang ditujukan kepada siapa pun yang datang dari hulu sungai.",
    en: "Two temples cut directly into a sandstone cliff on the orders of Ramesses II, guarded by four seated colossi some twenty metres tall. They face south toward Nubia — a statement of power addressed to anyone arriving from upriver.",
  },

  significance: {
    id: "Abu Simbel dikenal dua kali: sekali sebagai karya Mesir kuno, sekali lagi sebagai karya penyelamatan abad ke-20. Ketika Bendungan Aswan hendak menenggelamkannya, seluruh kuil dipotong menjadi lebih dari seribu blok dan dipasang ulang di tebing buatan yang lebih tinggi.",
    en: "Abu Simbel is known twice over: once as a work of ancient Egypt, and again as a twentieth-century rescue. When the Aswan High Dam was to drown it, the entire temple was cut into more than a thousand blocks and reassembled on an artificial cliff above.",
  },

  keyFeatures: [
    {
      title: { id: "Empat patung kolosal", en: "Four colossal figures" },
      body: {
        id: "Keempatnya menggambarkan Ramses II sendiri, duduk dan menatap lurus ke depan. Satu patung sudah runtuh sejak zaman kuno akibat gempa, dan bagian atasnya sengaja dibiarkan tergeletak saat pemindahan.",
        en: "All four depict Ramesses II himself, seated and staring straight ahead. One collapsed in antiquity after an earthquake, and its upper portion was deliberately left lying where it fell during the relocation.",
      },
    },
    {
      title: { id: "Penjajaran matahari", en: "The solar alignment" },
      body: {
        id: "Dua kali setahun, matahari terbit menembus lorong sepanjang enam puluh meter dan menerangi tiga dari empat arca di ruang terdalam. Amun, Ra-Horakhty, dan Ramses tersinari; Ptah, dewa dunia bawah, tetap dalam gelap.",
        en: "Twice a year the rising sun reaches sixty metres down the axis and lights three of the four figures in the innermost sanctuary. Amun, Ra-Horakhty and Ramesses are illuminated; Ptah, god of the underworld, stays in darkness.",
      },
    },
    {
      title: { id: "Pemindahan 1964–1968", en: "The 1964–1968 relocation" },
      body: {
        id: "Kuil digergaji menjadi blok-blok seberat sampai tiga puluh ton, diangkat 65 meter ke atas dan 200 meter ke belakang, lalu disusun kembali di dalam kubah beton yang ditutup bukit buatan. Sambungan antar-blok masih bisa dilihat kalau diperhatikan.",
        en: "The temple was sawn into blocks weighing up to thirty tonnes, lifted 65 metres up and 200 metres back, then reassembled inside a concrete dome buried under an artificial hill. The joints between blocks are still visible if you look.",
      },
    },
    {
      title: { id: "Kuil kecil untuk Nefertari", en: "The small temple for Nefertari" },
      body: {
        id: "Di sebelahnya berdiri kuil kedua untuk permaisuri Nefertari, dengan patung ratu dibuat setinggi patung raja. Kesetaraan ukuran ini sangat jarang dalam seni kerajaan Mesir.",
        en: "Beside it stands a second temple for the queen Nefertari, with her statues carved the same height as the king's. That equality of scale is very rare in Egyptian royal art.",
      },
    },
  ],

  hotspots: [
    {
      id: "mahkota",
      title: { id: "Mahkota dan Kepala", en: "Crowns and Heads" },
      summary: { id: "Mahkota ganda Mesir Hulu dan Hilir.", en: "The double crown of Upper and Lower Egypt." },
      detail: {
        id: "Setiap patung mengenakan mahkota ganda yang menyatakan kekuasaan atas kedua wilayah Mesir. Kepala-kepala ini dipahat agar proporsinya benar ketika dilihat dari bawah, bukan dari ketinggian yang sama.",
        en: "Each figure wears the double crown asserting rule over both lands of Egypt. The heads are carved so their proportions read correctly from below, not from the same height.",
      },
      anchor: [0.5, 0.9, 0.2],
      surface: "top",
    },
    {
      id: "patung",
      title: { id: "Patung Kolosal", en: "The Colossi" },
      summary: { id: "Empat sosok yang sama, satu di antaranya patah.", en: "Four identical figures, one of them broken." },
      detail: {
        id: "Keempat patung berdiri berpasangan mengapit pintu masuk. Patung kedua dari kiri kehilangan bagian atas tubuhnya sejak gempa zaman kuno — kerusakan yang dipertahankan apa adanya sebagai bagian dari sejarah bangunan.",
        en: "The four figures flank the entrance in pairs. The second from the left lost its upper body to an earthquake in antiquity — damage preserved as it was, as part of the building's history.",
      },
      anchor: [0.25, 0.5, 0.05],
      surface: "face",
    },
    {
      id: "pintu",
      title: { id: "Pintu Kuil", en: "Temple Doorway" },
      summary: { id: "Awal lorong sepanjang enam puluh meter.", en: "The start of a sixty-metre axis." },
      detail: {
        id: "Pintu di tengah fasad membuka jalan lurus jauh ke dalam tebing. Seluruh geometri kuil disusun mengikuti garis ini, karena garis inilah yang harus dilalui cahaya matahari dua kali setahun.",
        en: "The central doorway opens a straight path deep into the cliff. The whole geometry of the temple is set to this line, because this is the line the sunlight must travel twice a year.",
      },
      anchor: [0.5, 0.28, 0.05],
      surface: "face",
    },
    {
      id: "teras",
      title: { id: "Teras Depan", en: "The Terrace" },
      summary: { id: "Tempat berdiri untuk melihat seluruh fasad.", en: "The standing ground from which the whole facade reads." },
      detail: {
        id: "Teras di depan kuil memberi jarak yang cukup agar keempat patung terlihat sekaligus. Pada lokasi aslinya, teras ini berbatasan langsung dengan Sungai Nil, sehingga kuil menyapa pendatang dari air.",
        en: "The terrace before the temple gives enough distance for all four colossi to be seen at once. At the original site it met the Nile directly, so the temple addressed arrivals from the water.",
      },
      anchor: [0.5, 0.03, 0.9],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "c. 1264 SM", event: { id: "Pemahatan dimulai pada masa Ramses II.", en: "Carving begins under Ramesses II." } },
    { year: "c. 1244 SM", event: { id: "Kedua kuil selesai setelah sekitar dua puluh tahun.", en: "Both temples are completed after some twenty years." } },
    { year: "c. 27 SM", event: { id: "Gempa merobohkan bagian atas salah satu patung kolosal.", en: "An earthquake brings down the upper body of one colossus." } },
    { year: "1813", event: { id: "Johann Ludwig Burckhardt melihat fasad yang hampir tertimbun pasir.", en: "Johann Ludwig Burckhardt sights the facade, nearly buried in sand." } },
    { year: "1964–1968", event: { id: "Kuil dipotong dan dipindahkan ke tebing buatan di atas garis genangan bendungan.", en: "The temples are cut apart and moved to an artificial cliff above the dam's waterline." } },
    { year: "1979", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Batu pasir, dipahat di tempat", en: "Sandstone, carved in situ" } },
    { label: { id: "Tinggi patung", en: "Colossi height" }, value: { id: "sekitar 20 meter", en: "about 20 metres" } },
    { label: { id: "Kedalaman kuil", en: "Temple depth" }, value: { id: "sekitar 60 meter ke dalam tebing", en: "about 60 metres into the cliff" } },
    { label: { id: "Dipindahkan", en: "Relocated" }, value: { id: "65 meter ke atas, 200 meter ke belakang", en: "65 metres up, 200 metres back" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Nubian Monuments from Abu Simbel to Philae", url: "https://whc.unesco.org/en/list/88/" },
    { title: "Britannica — Abu Simbel", url: "https://www.britannica.com/place/Abu-Simbel" },
  ],

  keywords: ["abu simbel", "ramses", "ramesses", "nefertari", "mesir", "egypt", "nubia", "aswan", "kuil"],
};
