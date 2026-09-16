import type { HeritageMeta } from "../types";

export const lalibela: HeritageMeta = {
  slug: "lalibela",
  name: { id: "Bete Giyorgis, Lalibela", en: "Bete Giyorgis, Lalibela" },
  country: { id: "Etiopia", en: "Ethiopia" },
  location: { id: "Lalibela, Amhara", en: "Lalibela, Amhara" },
  coordinates: [12.0317, 39.0413],
  period: { id: "abad ke-12–13", en: "12th–13th century" },
  civilization: { id: "Dinasti Zagwe", en: "Zagwe dynasty" },
  category: "temple",

  description: {
    id: "Gereja berbentuk salib yang dipahat ke bawah dari satu bongkah batu tuf vulkanik, berdiri sendiri di dalam lubang sedalam sekitar lima belas meter. Ia bukan dibangun ke atas melainkan digali ke dalam — bangunan yang dibuat dengan cara membuang, bukan menumpuk.",
    en: "A cross-shaped church cut downward from a single mass of volcanic tuff, standing free inside a pit some fifteen metres deep. It was not raised upward but excavated inward — a building made by removal rather than accumulation.",
  },

  significance: {
    id: "Lalibela membalik logika arsitektur. Karena tidak ada satu pun sambungan, tidak ada pula titik lemah struktural; tetapi juga tidak ada ruang untuk salah, sebab setiap pahatan bersifat final. Sebelas gereja di kawasan ini masih menjadi tempat ibadah aktif setelah delapan ratus tahun.",
    en: "Lalibela inverts the logic of architecture. With no joints anywhere, there are no structural weak points; but there is also no room for error, since every cut is final. The eleven churches here remain active places of worship after eight hundred years.",
  },

  keyFeatures: [
    {
      title: { id: "Dipahat dari satu bongkah", en: "Cut from a single mass" },
      body: {
        id: "Pemahat pertama-tama menggali parit persegi mengelilingi blok batu, memisahkannya dari lereng. Baru setelah blok itu berdiri sendiri, bagian luar dan dalamnya dibentuk — dinding, jendela, pilar, dan atap, semuanya dari batu yang sama.",
        en: "The carvers first cut a rectangular trench around the block, freeing it from the hillside. Only once it stood alone were exterior and interior shaped — walls, windows, columns and roof, all from the same stone.",
      },
    },
    {
      title: { id: "Denah salib Yunani", en: "Greek cross plan" },
      body: {
        id: "Dari atas, gereja ini berbentuk salib sama sisi yang sempurna. Bentuk itu diulang tiga kali sebagai relief cekung pada atapnya, sehingga terbaca jelas justru dari sudut pandang yang tidak dimiliki siapa pun pada abad ke-13.",
        en: "From above, the church is a perfect equal-armed cross. The shape is repeated three times as recessed relief on the roof, so it reads most clearly from a vantage point nobody had in the thirteenth century.",
      },
    },
    {
      title: { id: "Saluran air keliling", en: "Perimeter drainage" },
      body: {
        id: "Parit di sekeliling gereja dilengkapi saluran yang mengalirkan air hujan menjauh. Tanpa itu, lubang sedalam lima belas meter di dataran tinggi Etiopia akan menjadi kolam pada setiap musim hujan.",
        en: "The trench around the church carries channels that lead rainwater away. Without them, a fifteen-metre pit in the Ethiopian highlands would become a pool every wet season.",
      },
    },
    {
      title: { id: "Masih dipakai beribadah", en: "Still in use" },
      body: {
        id: "Bete Giyorgis bukan reruntuhan. Gereja ini tetap melayani jemaat Ortodoks Tewahedo Etiopia, dengan pendeta, ritual, dan peziarah — konteks yang membuatnya berbeda dari kebanyakan situs warisan dunia.",
        en: "Bete Giyorgis is not a ruin. It still serves the Ethiopian Orthodox Tewahedo congregation, with priests, liturgy and pilgrims — a context that sets it apart from most world heritage sites.",
      },
    },
  ],

  hotspots: [
    {
      id: "atap-salib",
      title: { id: "Atap Bersalib", en: "The Cross Roof" },
      summary: { id: "Tiga salib cekung yang hanya terbaca dari atas.", en: "Three recessed crosses, legible only from above." },
      detail: {
        id: "Atapnya rata dengan permukaan tanah di sekitarnya, dipahat dengan tiga salib bersarang. Karena atap ini setinggi tanah, pengunjung berjalan mendekat dan tiba-tiba melihat seluruh gereja terletak di bawah kakinya.",
        en: "The roof lies flush with the surrounding ground, carved with three nested crosses. Because it sits at ground level, a visitor walks up and suddenly finds the whole church below their feet.",
      },
      anchor: [0.5, 0.95, 0.5],
      surface: "top",
    },
    {
      id: "dinding",
      title: { id: "Dinding Luar", en: "Outer Walls" },
      summary: { id: "Jendela dan cetakan yang dipahat, bukan dipasang.", en: "Windows and mouldings cut, not fitted." },
      detail: {
        id: "Jendela berbentuk lengkung dan salib, serta pita cetakan horizontal, semuanya dipahat dari massa batu yang sama. Tidak ada satu blok pun yang ditambahkan ke bangunan ini.",
        en: "Arched and cross-shaped windows and horizontal moulding bands are all cut from the same mass. Not one block was ever added to this building.",
      },
      anchor: [0.5, 0.5, 0.05],
      surface: "face",
    },
    {
      id: "parit",
      title: { id: "Parit Keliling", en: "The Surrounding Trench" },
      summary: { id: "Ruang kosong yang membuat gereja berdiri sendiri.", en: "The void that makes the church free-standing." },
      detail: {
        id: "Parit inilah pekerjaan pertama dan terberat: memisahkan blok batu dari lereng di keempat sisinya. Dindingnya juga menyimpan gua-gua pertapaan dan makam yang dipahat belakangan.",
        en: "The trench was the first and heaviest work: freeing the block from the hillside on all four sides. Its walls also hold hermit caves and tombs cut later.",
      },
      anchor: [0.5, 0.05, 0.9],
      surface: "ground",
    },
    {
      id: "pintu",
      title: { id: "Pintu Masuk", en: "The Entrance" },
      summary: { id: "Dicapai lewat terowongan, bukan tangga terbuka.", en: "Reached by tunnel, not open stair." },
      detail: {
        id: "Jalan masuk ke dasar parit melewati terowongan yang juga dipahat di batu. Peralihan dari terang ke gelap lalu terang lagi adalah bagian dari pengalaman ziarah, bukan sekadar persoalan akses.",
        en: "The way down to the trench floor runs through a tunnel, also cut in the rock. The passage from light to dark and back is part of the pilgrimage experience, not merely a question of access.",
      },
      anchor: [0.15, 0.2, 0.5],
      surface: "face",
    },
  ],

  timeline: [
    { year: "abad ke-12", event: { id: "Raja Gebre Mesqel Lalibela memerintahkan pembangunan kompleks gereja.", en: "King Gebre Mesqel Lalibela orders the church complex begun." } },
    { year: "abad ke-13", event: { id: "Sebelas gereja monolitik selesai dipahat.", en: "Eleven monolithic churches are completed." } },
    { year: "1520", event: { id: "Pendeta Portugis Francisco Álvares menjadi orang Eropa pertama yang mencatat keberadaannya.", en: "The Portuguese priest Francisco Álvares becomes the first European to record them." } },
    { year: "1978", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Tuf vulkanik, dipahat monolitik", en: "Volcanic tuff, carved monolithic" } },
    { label: { id: "Kedalaman", en: "Depth" }, value: { id: "sekitar 15 meter", en: "about 15 metres" } },
    { label: { id: "Denah", en: "Plan" }, value: { id: "Salib sama sisi, sekitar 12 × 12 meter", en: "Equal-armed cross, about 12 × 12 metres" } },
    { label: { id: "Jumlah gereja di kawasan", en: "Churches in the complex" }, value: { id: "11", en: "11" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Rock-Hewn Churches, Lalibela", url: "https://whc.unesco.org/en/list/18/" },
    { title: "Britannica — Lalibela", url: "https://www.britannica.com/place/Lalibela" },
  ],

  keywords: ["lalibela", "bete giyorgis", "etiopia", "ethiopia", "zagwe", "gereja", "church", "monolitik", "ortodoks"],
};
