import type { HeritageMeta } from "../types";

export const angkorWat: HeritageMeta = {
  slug: "angkor-wat",
  name: { id: "Angkor Wat", en: "Angkor Wat" },
  country: { id: "Kamboja", en: "Cambodia" },
  location: { id: "Siem Reap", en: "Siem Reap" },
  coordinates: [13.4125, 103.867],
  period: { id: "paruh pertama abad ke-12", en: "first half of the 12th century" },
  civilization: { id: "Kekaisaran Khmer", en: "Khmer Empire" },
  category: "temple",

  description: {
    id: "Bangunan keagamaan terluas di dunia, dibangun Suryawarman II sebagai kuil negara sekaligus makamnya. Lima menaranya berdiri di tengah halaman berlapis yang dikelilingi parit selebar hampir dua ratus meter — sebuah gunung batu yang dikelilingi lautan buatan.",
    en: "The largest religious structure in the world, raised by Suryavarman II as a state temple and his own mausoleum. Five towers stand at the centre of concentric enclosures ringed by a moat nearly two hundred metres wide — a stone mountain surrounded by a made sea.",
  },

  significance: {
    id: "Angkor Wat memperlihatkan sebuah negara yang mampu mengerahkan tenaga, batu, dan air dalam skala benua kecil. Ia juga satu dari sedikit monumen besar yang tidak pernah benar-benar ditinggalkan: dari kuil Wisnu menjadi biara Buddha, lalu menjadi lambang di bendera nasional Kamboja.",
    en: "Angkor Wat shows a state able to marshal labour, stone and water on the scale of a small continent. It is also one of the few great monuments never truly abandoned: from a temple to Vishnu it became a Buddhist monastery, and then the emblem on Cambodia's national flag.",
  },

  keyFeatures: [
    {
      title: { id: "Lima menara sebagai Gunung Meru", en: "Five towers as Mount Meru" },
      body: {
        id: "Susunan quincunx — empat menara sudut mengelilingi satu menara pusat — melambangkan puncak Gunung Meru, kediaman para dewa. Dari sisi barat, kelimanya sengaja tampak menyatu menjadi tiga.",
        en: "The quincunx arrangement — four corner towers around one central peak — represents the summits of Mount Meru, home of the gods. Seen from the west, the five are deliberately read as three.",
      },
    },
    {
      title: { id: "Parit dan pengelolaan air", en: "The moat and water management" },
      body: {
        id: "Parit selebar sekitar 190 meter bukan sekadar pertahanan atau simbol samudra kosmis. Ia menstabilkan muka air tanah di bawah pondasi pasir, yang mencegah bangunan seberat itu tenggelam tidak rata.",
        en: "The moat, about 190 metres across, is not only defence or a symbol of the cosmic ocean. It stabilises the water table beneath the sand foundations, which is what keeps a structure of this weight from settling unevenly.",
      },
    },
    {
      title: { id: "Relief galeri sepanjang 600 meter", en: "Six hundred metres of gallery relief" },
      body: {
        id: "Galeri tingkat pertama dipahat menerus dengan adegan Mahabharata, Ramayana, barisan tentara Suryawarman II, dan Pengadukan Lautan Susu — panel terakhir sepanjang hampir lima puluh meter.",
        en: "The first-level gallery is carved continuously with scenes from the Mahabharata and Ramayana, Suryavarman II's army on the march, and the Churning of the Sea of Milk — that last panel running nearly fifty metres.",
      },
    },
    {
      title: { id: "Menghadap barat", en: "Facing west" },
      body: {
        id: "Hampir semua candi Khmer menghadap timur. Angkor Wat menghadap barat, arah yang diasosiasikan dengan Wisnu dan dengan kematian — salah satu alasan kuat mengapa bangunan ini dibaca sebagai kuil pemakaman.",
        en: "Almost every Khmer temple faces east. Angkor Wat faces west, a direction associated with Vishnu and with death — one of the strongest reasons the building is read as a funerary temple.",
      },
    },
  ],

  hotspots: [
    {
      id: "menara-pusat",
      title: { id: "Menara Pusat", en: "Central Tower" },
      summary: { id: "Puncak tertinggi, tempat arca utama pernah berdiri.", en: "The highest peak, where the principal image once stood." },
      detail: {
        id: "Menara pusat menjulang sekitar 65 meter di atas permukaan tanah. Tangga menuju ke sana sengaja dibuat sangat curam sehingga pendaki harus menunduk — kerendahan hati yang dipaksakan oleh arsitektur, bukan diminta.",
        en: "The central tower rises about 65 metres above ground. The stairs to it are deliberately steep enough that a climber must bend forward — humility imposed by the architecture rather than requested.",
      },
      anchor: [0.5, 0.95, 0.5],
      surface: "top",
    },
    {
      id: "menara-sudut",
      title: { id: "Menara Sudut", en: "Corner Towers" },
      summary: { id: "Empat puncak yang membingkai yang kelima.", en: "Four peaks framing the fifth." },
      detail: {
        id: "Keempat menara sudut lebih rendah dari menara pusat dan berbentuk kuncup teratai bersusun. Jaraknya diatur agar dari jalan masuk barat hanya tiga menara yang terlihat, dan kelimanya baru terbaca dari sudut serong.",
        en: "The four corner towers stand lower than the centre and take the form of tiered lotus buds. Their spacing is set so that only three read from the western causeway; all five appear only from an oblique angle.",
      },
      anchor: [0.38, 0.8, 0.42],
      surface: "top",
    },
    {
      id: "galeri-relief",
      title: { id: "Galeri Relief", en: "Relief Gallery" },
      summary: { id: "Dinding luar yang bercerita tanpa putus.", en: "An outer wall that tells its story without a break." },
      detail: {
        id: "Galeri terluar mengelilingi bangunan sepanjang lebih dari enam ratus meter, dipahat sedalam beberapa sentimeter saja. Kedangkalan itu disengaja: pahatan dalam akan kehilangan bentuk di bawah cahaya tropis yang keras.",
        en: "The outermost gallery wraps the building for more than six hundred metres, carved only a few centimetres deep. The shallowness is deliberate: deeper cutting would lose its form under harsh tropical light.",
      },
      anchor: [0.5, 0.25, 0.03],
      surface: "face",
    },
    {
      id: "jalan-masuk",
      title: { id: "Jalan Lintas Barat", en: "Western Causeway" },
      summary: { id: "Dua ratus meter pendekatan yang diatur.", en: "Two hundred metres of managed approach." },
      detail: {
        id: "Jalan batu yang melintasi parit menahan pengunjung pada satu jalur pandang selama beberapa menit sebelum bangunan utama tercapai. Waktu itu bagian dari rancangannya — bangunan ini dimaksudkan untuk didekati, bukan dijumpai.",
        en: "The stone causeway across the moat holds a visitor on a single sightline for several minutes before the main building is reached. That time is part of the design — this building was meant to be approached, not come upon.",
      },
      anchor: [0.5, 0.03, 0.95],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "c. 1113", event: { id: "Suryawarman II naik takhta dan pembangunan dimulai.", en: "Suryavarman II takes the throne and construction begins." } },
    { year: "c. 1150", event: { id: "Suryawarman II wafat; sebagian pekerjaan pahat tidak pernah dirampungkan.", en: "Suryavarman II dies; some carving is never finished." } },
    { year: "1177", event: { id: "Angkor diserbu armada Cham; ibu kota kemudian dipindahkan ke Angkor Thom.", en: "Cham forces sack Angkor; the capital later moves to Angkor Thom." } },
    { year: "abad ke-14", event: { id: "Beralih fungsi menjadi tempat ibadah Buddha Theravada dan tetap dipakai.", en: "Converted to Theravada Buddhist use and remains in service." } },
    { year: "1992", event: { id: "Kawasan Angkor ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "The Angkor complex is inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Batu pasir dan laterit", en: "Sandstone and laterite" } },
    { label: { id: "Luas kawasan", en: "Enclosure area" }, value: { id: "sekitar 162 hektar", en: "about 162 hectares" } },
    { label: { id: "Lebar parit", en: "Moat width" }, value: { id: "sekitar 190 meter", en: "about 190 metres" } },
    { label: { id: "Tinggi menara pusat", en: "Central tower height" }, value: { id: "sekitar 65 meter", en: "about 65 metres" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Angkor", url: "https://whc.unesco.org/en/list/668/" },
    { title: "Britannica — Angkor Wat", url: "https://www.britannica.com/topic/Angkor-Wat" },
  ],

  keywords: ["angkor", "angkor wat", "khmer", "kamboja", "cambodia", "suryavarman", "wisnu", "vishnu", "siem reap"],
};
