import type { HeritageMeta } from "../types";

export const moai: HeritageMeta = {
  slug: "moai",
  name: { id: "Moai, Rapa Nui", en: "Moai, Rapa Nui" },
  country: { id: "Chili", en: "Chile" },
  location: { id: "Pulau Paskah, Samudra Pasifik", en: "Easter Island, Pacific Ocean" },
  coordinates: [-27.1127, -109.3497],
  period: { id: "sekitar 1250–1500 M", en: "c. 1250–1500 CE" },
  civilization: { id: "Rapa Nui", en: "Rapa Nui" },
  category: "monument",

  description: {
    id: "Pahatan monolitik berupa sosok manusia berkepala besar, dibuat masyarakat Rapa Nui di salah satu pulau berpenghuni paling terpencil di dunia. Hampir seribu buah dipahat dari tuf vulkanik di satu kawah, Rano Raraku, lalu dipindahkan ke seluruh pulau.",
    en: "Monolithic human figures with oversized heads, carved by the Rapa Nui on one of the most remote inhabited islands on earth. Nearly a thousand were cut from volcanic tuff in a single crater, Rano Raraku, then moved across the island.",
  },

  significance: {
    id: "Moai menghadap ke daratan, bukan ke laut. Mereka bukan penjaga yang mengawasi kedatangan dari luar melainkan leluhur yang mengawasi keturunannya. Membaca arah pandang mereka dengan benar mengubah seluruh tafsir tentang untuk apa patung-patung ini dibuat.",
    en: "The moai face inland, not out to sea. They are not sentinels watching for arrivals but ancestors watching over their descendants. Reading their gaze correctly changes the whole interpretation of what these figures were for.",
  },

  keyFeatures: [
    {
      title: { id: "Satu sumber batu untuk hampir semuanya", en: "One quarry for nearly all of them" },
      body: {
        id: "Sekitar sembilan puluh lima persen moai dipahat di kawah Rano Raraku. Hampir tiga ratus di antaranya masih berada di sana dalam berbagai tahap pengerjaan — tempat itu berhenti bekerja di tengah jalan dan tidak pernah dilanjutkan.",
        en: "About ninety-five per cent of the moai were cut at the Rano Raraku crater. Nearly three hundred remain there in various stages of work — the site stopped mid-task and was never resumed.",
      },
    },
    {
      title: { id: "Tubuh yang terkubur", en: "The buried bodies" },
      body: {
        id: "Moai yang tampak sebagai \"kepala\" di lereng Rano Raraku sebenarnya memiliki tubuh lengkap yang tertimbun sedimen selama berabad-abad. Penggalian menemukan lengan, tangan, dan ukiran pada punggungnya.",
        en: "The moai that appear as \"heads\" on the Rano Raraku slopes have full bodies buried by centuries of sediment. Excavation has found arms, hands and carving on their backs.",
      },
    },
    {
      title: { id: "Pukao dan mata karang", en: "Pukao and coral eyes" },
      body: {
        id: "Sebagian moai dimahkotai pukao, silinder batu merah dari sumber terpisah. Rongga matanya dulu diisi karang putih dan obsidian atau tuf merah — ketika mata dipasang, patung dianggap hidup dan memiliki kekuatan.",
        en: "Some moai were crowned with pukao, red stone cylinders from a separate quarry. Their eye sockets once held white coral with obsidian or red scoria — with the eyes set, the figure was considered alive and empowered.",
      },
    },
    {
      title: { id: "Berjalan, bukan diseret", en: "Walked, not dragged" },
      body: {
        id: "Tradisi lisan Rapa Nui mengatakan moai \"berjalan\" ke tempatnya. Percobaan modern memperlihatkan patung tegak bisa digoyang maju dengan tali oleh sedikit orang, yang cocok dengan bentuk dasar patung dan dengan kisah itu.",
        en: "Rapa Nui oral tradition says the moai \"walked\" to their places. Modern experiments show an upright figure can be rocked forward with ropes by a small team, which matches both the shape of the statue bases and the account.",
      },
    },
  ],

  hotspots: [
    {
      id: "kepala",
      title: { id: "Kepala", en: "The Head" },
      summary: { id: "Sepertiga tinggi tubuh, disengaja.", en: "A third of the body's height, by design." },
      detail: {
        id: "Kepala moai sengaja dibuat tidak proporsional besar, kira-kira sepertiga dari seluruh tinggi. Dalam budaya Polinesia, kepala adalah bagian tubuh yang paling sakral, dan skala itu menyatakan hal tersebut.",
        en: "The head is deliberately oversized, roughly a third of the total height. In Polynesian cultures the head is the most sacred part of the body, and the scale states that.",
      },
      anchor: [0.5, 0.95, 0.5],
      surface: "top",
    },
    {
      id: "wajah",
      title: { id: "Wajah", en: "The Face" },
      summary: { id: "Alis berat, hidung panjang, bibir tipis mengatup.", en: "Heavy brow, long nose, thin set lips." },
      detail: {
        id: "Ciri wajahnya sangat konsisten di hampir seribu patung: tonjolan alis yang berat, hidung panjang, dagu menonjol. Keseragaman ini menunjukkan pahatan mengikuti pakem, bukan menggambarkan individu tertentu.",
        en: "The facial features are remarkably consistent across nearly a thousand figures: heavy brow ridge, long nose, jutting chin. The uniformity indicates carving to a convention rather than portraits of individuals.",
      },
      anchor: [0.5, 0.75, 0.02],
      surface: "face",
    },
    {
      id: "tubuh",
      title: { id: "Tubuh dan Lengan", en: "Torso and Arms" },
      summary: { id: "Lengan menempel rapat, jari bertemu di perut.", en: "Arms held tight, fingers meeting at the belly." },
      detail: {
        id: "Lengan dipahat menempel pada sisi tubuh dengan jari-jari panjang bertemu di bawah perut. Bentuk yang rapat ini bukan sekadar gaya — ia menghindari bagian menonjol yang akan patah saat patung dipindahkan.",
        en: "The arms are carved tight against the body with long fingers meeting below the abdomen. The compact form is not only style — it avoids projections that would snap while the statue was being moved.",
      },
      anchor: [0.5, 0.4, 0.05],
      surface: "face",
    },
    {
      id: "dasar",
      title: { id: "Dasar", en: "The Base" },
      summary: { id: "Bidang datar tempat patung berdiri di atas ahu.", en: "The flat plane that stood the figure on its ahu." },
      detail: {
        id: "Bagian bawah moai diratakan agar bisa berdiri di atas ahu, panggung batu upacara. Kemiringan sedikit ke depan pada dasar inilah yang memungkinkan teknik menggoyang patung untuk memindahkannya.",
        en: "The underside is flattened so the figure could stand on an ahu, the ceremonial stone platform. A slight forward lean built into that base is what makes the rocking method of transport possible.",
      },
      anchor: [0.5, 0.06, 0.02],
      surface: "face",
    },
  ],

  timeline: [
    { year: "c. 1200", event: { id: "Pemukiman Rapa Nui berkembang dan pemahatan moai dimulai.", en: "Rapa Nui settlement grows and moai carving begins." } },
    { year: "c. 1250–1500", event: { id: "Masa puncak pemahatan dan pemindahan patung.", en: "The peak period of carving and transport." } },
    { year: "c. 1600", event: { id: "Pemahatan berhenti; hampir tiga ratus patung ditinggalkan di kawah.", en: "Carving ceases; nearly three hundred figures are left in the crater." } },
    { year: "1722", event: { id: "Jacob Roggeveen menjadi orang Eropa pertama yang mencatat pulau ini.", en: "Jacob Roggeveen becomes the first European to record the island." } },
    { year: "1995", event: { id: "Taman Nasional Rapa Nui ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Rapa Nui National Park is inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Tuf vulkanik dari Rano Raraku", en: "Volcanic tuff from Rano Raraku" } },
    { label: { id: "Jumlah", en: "Number" }, value: { id: "sekitar 900 patung", en: "about 900 figures" } },
    { label: { id: "Tinggi rata-rata", en: "Average height" }, value: { id: "sekitar 4 meter", en: "about 4 metres" } },
    { label: { id: "Arah pandang", en: "Orientation" }, value: { id: "Menghadap ke daratan", en: "Facing inland" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Rapa Nui National Park", url: "https://whc.unesco.org/en/list/715/" },
    { title: "Britannica — Easter Island", url: "https://www.britannica.com/place/Easter-Island" },
  ],

  keywords: ["moai", "rapa nui", "pulau paskah", "easter island", "chili", "chile", "polinesia", "ahu", "pukao"],
};
