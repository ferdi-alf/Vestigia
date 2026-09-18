import type { HeritageMeta } from "../types";

export const stonehenge: HeritageMeta = {
  slug: "stonehenge",
  name: { id: "Stonehenge", en: "Stonehenge" },
  country: { id: "Inggris", en: "England" },
  location: { id: "Wiltshire", en: "Wiltshire" },
  coordinates: [51.1789, -1.8262],
  period: { id: "sekitar 3000–1520 SM, dalam beberapa tahap", en: "c. 3000–1520 BCE, in phases" },
  civilization: { id: "Neolitikum dan Zaman Perunggu Britania", en: "Neolithic and Bronze Age Britain" },
  category: "monument",

  description: {
    id: "Lingkaran batu berdiri di dataran Salisbury, disusun bertahap selama hampir seribu lima ratus tahun. Batu sarsen raksasa membentuk cincin luar dengan ambang melintang di atasnya, mengelilingi susunan batu biru yang lebih kecil.",
    en: "A ring of standing stones on Salisbury Plain, assembled in stages across nearly fifteen hundred years. Giant sarsens form an outer circle with lintels laid across their tops, enclosing an arrangement of smaller bluestones.",
  },

  significance: {
    id: "Stonehenge memaksa kita mengoreksi anggapan tentang masyarakat prasejarah. Membawa batu biru sejauh dua ratus lima puluh kilometer dari Wales, lalu memasang ambang batu dengan sambungan pen dan lubang, menuntut perencanaan, pengetahuan, dan koordinasi lintas generasi.",
    en: "Stonehenge forces a correction to assumptions about prehistoric society. Bringing bluestones some two hundred and fifty kilometres from Wales, then fitting lintels with mortise-and-tenon joints, demanded planning, knowledge and coordination across generations.",
  },

  keyFeatures: [
    {
      title: { id: "Sambungan kayu pada batu", en: "Carpentry joints cut in stone" },
      body: {
        id: "Ambang batu dikunci ke tiang penyangga dengan sambungan pen dan lubang, dan saling dikunci satu sama lain dengan sambungan lidah dan alur. Teknik ini dipinjam dari pertukangan kayu — bukti bahwa pembangunnya berpikir dalam kerangka konstruksi, bukan penumpukan.",
        en: "Lintels are locked to their uprights by mortise-and-tenon joints, and to each other by tongue-and-groove. The technique is borrowed from woodworking — evidence that the builders thought in terms of construction, not stacking.",
      },
    },
    {
      title: { id: "Batu biru dari Wales", en: "Bluestones from Wales" },
      body: {
        id: "Batu-batu yang lebih kecil berasal dari Perbukitan Preseli di Wales barat, sekitar dua ratus lima puluh kilometer jauhnya. Mengapa batu tertentu ini yang dipilih, dan bagaimana dipindahkan, masih menjadi salah satu pertanyaan terbuka arkeologi Britania.",
        en: "The smaller stones come from the Preseli Hills in west Wales, some two hundred and fifty kilometres away. Why those particular stones, and how they were moved, remain among the open questions of British archaeology.",
      },
    },
    {
      title: { id: "Penjajaran matahari", en: "Solar alignment" },
      body: {
        id: "Sumbu utama monumen mengarah ke terbit matahari titik balik musim panas di satu ujung dan terbenam matahari titik balik musim dingin di ujung lain. Bukti arkeologi menunjukkan pertemuan besar justru terjadi pada musim dingin.",
        en: "The monument's main axis points to midsummer sunrise at one end and midwinter sunset at the other. Archaeological evidence suggests the great gatherings actually took place in winter.",
      },
    },
    {
      title: { id: "Batu sarsen yang dibentuk", en: "Shaped sarsens" },
      body: {
        id: "Tiang-tiang sarsen tidak lurus melainkan sedikit meruncing ke atas, dan ambangnya melengkung mengikuti lingkaran. Penyesuaian halus ini membuat cincin terbaca rata dari tanah, koreksi optis yang juga dipakai kuil Yunani seribu tahun kemudian.",
        en: "The sarsen uprights are not straight but taper slightly upward, and the lintels curve to follow the circle. These refinements make the ring read as level from the ground — an optical correction Greek temples would use a thousand years later.",
      },
    },
  ],

  hotspots: [
    {
      id: "ambang",
      title: { id: "Ambang Batu", en: "The Lintels" },
      summary: { id: "Cincin melayang yang mengunci dirinya sendiri.", en: "A floating ring that locks itself together." },
      detail: {
        id: "Ambang-ambang di atas cincin sarsen membentuk lingkaran menerus, masing-masing dilengkungkan agar mengikuti kurva. Mengangkatnya ke ketinggian lebih dari empat meter tanpa derek adalah bagian tersulit dari seluruh proyek.",
        en: "The lintels above the sarsen circle form a continuous ring, each curved to follow the arc. Raising them more than four metres without cranes was the hardest part of the entire project.",
      },
      anchor: [0.53, 0.95, 0.42],
      surface: "top",
    },
    {
      id: "trilithon",
      title: { id: "Trilithon", en: "The Trilithons" },
      summary: { id: "Lima gerbang batu di jantung monumen.", en: "Five stone gateways at the monument's heart." },
      detail: {
        id: "Lima pasang tiang bertutup ambang disusun membentuk tapal kuda yang terbuka ke arah terbit matahari musim panas. Trilithon terbesar dulu menjulang lebih dari tujuh meter; salah satu tiangnya kini sudah tumbang.",
        en: "Five pairs of uprights capped by lintels form a horseshoe opening toward midsummer sunrise. The largest trilithon once stood over seven metres; one of its uprights has since fallen.",
      },
      anchor: [0.6, 0.75, 0.47],
      surface: "top",
    },
    {
      id: "sarsen",
      title: { id: "Tiang Sarsen", en: "Sarsen Uprights" },
      summary: { id: "Batu pasir keras dari Marlborough Downs.", en: "Hard sandstone from the Marlborough Downs." },
      detail: {
        id: "Batu sarsen berasal dari sekitar dua puluh lima kilometer di utara. Permukaannya dikerjakan dengan palu batu untuk diratakan — pekerjaan yang meninggalkan bekas pukulan yang masih bisa dilihat dari dekat.",
        en: "The sarsens come from about twenty-five kilometres to the north. Their faces were dressed flat with stone mauls — work that left percussion marks still visible up close.",
      },
      anchor: [0.15, 0.38, 0.42],
      surface: "face",
    },
    {
      id: "lingkaran-tanah",
      title: { id: "Parit dan Tanggul", en: "Ditch and Bank" },
      summary: { id: "Bagian tertua, dan yang paling mudah terlewat.", en: "The oldest part, and the easiest to miss." },
      detail: {
        id: "Sebelum ada satu batu pun berdiri, tempat ini sudah berupa lingkaran parit dan tanggul yang digali sekitar 3000 SM dengan tanduk rusa. Susunan batu yang kita kenal datang berabad-abad kemudian ke dalam ruang yang sudah dikeramatkan.",
        en: "Before a single stone stood, the site was a circular ditch and bank dug around 3000 BCE with antler picks. The stone settings we know arrived centuries later, into ground already made sacred.",
      },
      anchor: [0.5, 0.02, 0.85],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "c. 3000 SM", event: { id: "Parit dan tanggul melingkar digali dengan tanduk rusa.", en: "The circular ditch and bank are dug with antler picks." } },
    { year: "c. 2500 SM", event: { id: "Batu sarsen didirikan dan ambangnya dipasang.", en: "The sarsens are raised and their lintels set." } },
    { year: "c. 2300 SM", event: { id: "Batu biru dari Wales disusun ulang di dalam cincin sarsen.", en: "The Welsh bluestones are rearranged within the sarsen circle." } },
    { year: "c. 1520 SM", event: { id: "Pekerjaan besar terakhir di lokasi berhenti.", en: "The last major work at the site ceases." } },
    { year: "1986", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Sarsen dan batu biru", en: "Sarsen and bluestone" } },
    { label: { id: "Berat sarsen terbesar", en: "Heaviest sarsen" }, value: { id: "sekitar 25 ton", en: "about 25 tonnes" } },
    { label: { id: "Diameter cincin sarsen", en: "Sarsen circle diameter" }, value: { id: "sekitar 33 meter", en: "about 33 metres" } },
    { label: { id: "Jarak asal batu biru", en: "Bluestone source distance" }, value: { id: "sekitar 250 kilometer", en: "about 250 kilometres" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Stonehenge, Avebury and Associated Sites", url: "https://whc.unesco.org/en/list/373/" },
    { title: "English Heritage — Stonehenge", url: "https://www.english-heritage.org.uk/visit/places/stonehenge/" },
  ],

  keywords: ["stonehenge", "wiltshire", "inggris", "england", "neolitikum", "neolithic", "sarsen", "bluestone", "megalit"],
};
