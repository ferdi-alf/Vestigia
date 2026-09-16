import type { HeritageMeta } from "../types";

export const colosseum: HeritageMeta = {
  slug: "colosseum",
  name: { id: "Colosseum", en: "Colosseum" },
  country: { id: "Italia", en: "Italy" },
  location: { id: "Roma", en: "Rome" },
  coordinates: [41.8902, 12.4922],
  period: { id: "72–80 M", en: "72–80 CE" },
  civilization: { id: "Kekaisaran Romawi", en: "Roman Empire" },
  category: "monument",

  description: {
    id: "Amfiteater terbesar yang pernah dibangun Roma, berbentuk elips sepanjang 189 meter dengan empat tingkat lengkung. Dibangun dari travertin, tuf, dan beton berlapis bata, ia mampu memasukkan dan mengeluarkan puluhan ribu penonton dalam hitungan menit.",
    en: "The largest amphitheatre Rome ever built, an ellipse 189 metres long rising in four tiers of arches. Built of travertine, tuff and brick-faced concrete, it could fill and empty tens of thousands of spectators in minutes.",
  },

  significance: {
    id: "Colosseum adalah mesin kerumunan sebelum ada kata untuk itu. Delapan puluh pintu lengkung bernomor, tiket bertanda lorong dan baris, serta tangga terpisah untuk tiap kelas sosial — pola yang masih dipakai stadion modern hampir dua ribu tahun kemudian.",
    en: "The Colosseum is a crowd machine before there was a word for one. Eighty numbered arched entrances, tokens marking corridor and row, and separate stairs for each social class — a pattern modern stadiums still follow almost two thousand years later.",
  },

  keyFeatures: [
    {
      title: { id: "Delapan puluh pintu lengkung", en: "Eighty arched entrances" },
      body: {
        id: "Setiap lengkung di tingkat dasar bernomor, dan setiap penonton membawa tanda yang menyebut nomor pintu, lorong, dan barisnya. Gedung sebesar itu bisa dikosongkan dalam waktu yang sangat singkat.",
        en: "Each ground-level arch was numbered, and every spectator carried a token naming their gate, corridor and row. A building that size could be cleared in a very short time.",
      },
    },
    {
      title: { id: "Hipogeum di bawah arena", en: "The hypogeum beneath the arena" },
      body: {
        id: "Dua tingkat lorong, kandang, dan lift bertenaga manusia berada di bawah lantai kayu arena. Hewan dan perlengkapan panggung muncul lewat pintu jebakan, sehingga pertunjukan seolah datang dari ketiadaan.",
        en: "Two levels of corridors, cages and human-powered lifts lay beneath the wooden arena floor. Animals and scenery rose through trapdoors, so the spectacle seemed to come from nowhere.",
      },
    },
    {
      title: { id: "Tiga tatanan pilar bertumpuk", en: "Three stacked column orders" },
      body: {
        id: "Dorik di bawah, Ionik di tengah, Korintus di atas — dari yang paling tegap ke yang paling ringan. Susunan ini bukan sekadar selera: ia membuat massa bangunan tampak semakin ringan ke arah atas.",
        en: "Doric below, Ionic in the middle, Corinthian above — heaviest to lightest. The order is not merely taste: it makes the building's mass appear to lighten as it rises.",
      },
    },
    {
      title: { id: "Velarium", en: "The velarium" },
      body: {
        id: "Kanopi kain raksasa yang bisa ditarik menaungi penonton dari matahari, dioperasikan oleh pelaut dari armada Romawi. Tiang penopangnya masih terlihat sebagai lubang pada cincin batu teratas.",
        en: "A vast retractable fabric canopy shaded spectators from the sun, worked by sailors from the Roman fleet. Its mast sockets are still visible as holes in the topmost stone ring.",
      },
    },
  ],

  hotspots: [
    {
      id: "cincin-atas",
      title: { id: "Cincin Teratas", en: "The Upper Ring" },
      summary: { id: "Tingkat keempat, tempat tiang velarium bertumpu.", en: "The fourth storey, where the velarium masts were braced." },
      detail: {
        id: "Tingkat teratas berupa dinding pejal berjendela persegi, bukan lengkung. Di situlah tiang-tiang kayu penopang kanopi dipasang, dan di situ pula penonton berkelas paling rendah duduk.",
        en: "The topmost storey is solid wall with square windows rather than arches. Here the wooden masts of the canopy were seated, and here the lowest-status spectators sat.",
      },
      anchor: [0.5, 0.95, 0.35],
      surface: "top",
    },
    {
      id: "fasad-lengkung",
      title: { id: "Fasad Berlengkung", en: "Arcaded Facade" },
      summary: { id: "Empat tingkat yang menghitung dirinya sendiri.", en: "Four tiers that number themselves." },
      detail: {
        id: "Lengkung-lengkung di tingkat dasar masih menyimpan angka Romawi yang terpahat di atasnya. Penomoran ini adalah bagian dari sistem tempat duduk, bukan hiasan.",
        en: "The ground-tier arches still carry Roman numerals cut above them. The numbering was part of the seating system, not ornament.",
      },
      anchor: [0.5, 0.5, 0.02],
      surface: "face",
    },
    {
      id: "arena",
      title: { id: "Lantai Arena", en: "The Arena Floor" },
      summary: { id: "Papan kayu berlapis pasir, kini hilang.", en: "Sand-covered timber, now gone." },
      detail: {
        id: "Kata \"arena\" berasal dari harena, bahasa Latin untuk pasir — lapisan yang ditaburkan untuk menyerap darah. Lantai kayunya sudah lama lenyap, memperlihatkan hipogeum yang dulu tersembunyi di bawahnya.",
        en: "The word \"arena\" comes from harena, Latin for sand — the layer strewn to absorb blood. The timber floor is long gone, exposing the hypogeum that once lay hidden below.",
      },
      anchor: [0.5, 0.06, 0.5],
      surface: "ground",
    },
    {
      id: "dinding-runtuh",
      title: { id: "Sisi yang Runtuh", en: "The Collapsed Side" },
      summary: { id: "Kerusakan gempa, lalu dua abad penjarahan batu.", en: "Earthquake damage, then two centuries of quarrying." },
      detail: {
        id: "Sisi selatan runtuh pada gempa 1349 karena berdiri di atas endapan aluvial yang lebih lunak. Batunya kemudian diangkut untuk membangun gereja dan istana Roma — bangunan ini menjadi tambang bagi kotanya sendiri.",
        en: "The southern side fell in the earthquake of 1349 because it stood on softer alluvial ground. Its stone was then carted off to build Rome's churches and palaces — the building became a quarry for its own city.",
      },
      anchor: [0.15, 0.55, 0.6],
      surface: "face",
    },
  ],

  timeline: [
    { year: "72 M", event: { id: "Vespasianus memulai pembangunan di bekas danau buatan istana Nero.", en: "Vespasian begins construction on the drained lake of Nero's palace." } },
    { year: "80 M", event: { id: "Titus meresmikannya dengan seratus hari pertunjukan.", en: "Titus inaugurates it with a hundred days of games." } },
    { year: "abad ke-6", event: { id: "Pertunjukan berhenti; bangunan beralih fungsi menjadi bengkel dan tempat tinggal.", en: "The games cease; the building is turned to workshops and housing." } },
    { year: "1349", event: { id: "Gempa besar meruntuhkan sisi selatan.", en: "A major earthquake brings down the southern side." } },
    { year: "1749", event: { id: "Paus Benediktus XIV menyatakannya tempat suci, menghentikan penjarahan batu.", en: "Pope Benedict XIV declares it a sacred site, ending the quarrying." } },
    { year: "1980", event: { id: "Termasuk dalam Situs Warisan Dunia UNESCO Pusat Sejarah Roma.", en: "Included in the UNESCO World Heritage Site of the Historic Centre of Rome." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Travertin, tuf, beton berlapis bata", en: "Travertine, tuff, brick-faced concrete" } },
    { label: { id: "Ukuran", en: "Dimensions" }, value: { id: "189 × 156 meter, tinggi 48 meter", en: "189 × 156 metres, 48 metres tall" } },
    { label: { id: "Perkiraan kapasitas", en: "Estimated capacity" }, value: { id: "50.000–80.000 penonton", en: "50,000–80,000 spectators" } },
    { label: { id: "Pintu masuk", en: "Entrances" }, value: { id: "80 lengkung bernomor", en: "80 numbered arches" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Historic Centre of Rome", url: "https://whc.unesco.org/en/list/91/" },
    { title: "Britannica — Colosseum", url: "https://www.britannica.com/topic/Colosseum" },
  ],

  keywords: ["colosseum", "koloseum", "roma", "rome", "romawi", "roman", "amfiteater", "amphitheatre", "flavian"],
};
