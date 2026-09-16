import type { HeritageMeta } from "../types";

export const greatPyramidOfGiza: HeritageMeta = {
  slug: "great-pyramid-of-giza",
  name: { id: "Piramida Agung Giza", en: "Great Pyramid of Giza" },
  country: { id: "Mesir", en: "Egypt" },
  location: { id: "Giza, dekat Kairo", en: "Giza, near Cairo" },
  coordinates: [29.9792, 31.1342],
  period: { id: "sekitar 2560 SM", en: "c. 2560 BCE" },
  civilization: { id: "Dinasti Keempat Mesir Kuno", en: "Fourth Dynasty of ancient Egypt" },
  category: "tomb",

  description: {
    id: "Makam Firaun Khufu, dan satu-satunya dari Tujuh Keajaiban Dunia Kuno yang masih berdiri. Disusun dari sekitar 2,3 juta balok batu, ia menjadi bangunan tertinggi buatan manusia selama lebih dari tiga ribu delapan ratus tahun.",
    en: "The tomb of the pharaoh Khufu, and the only one of the Seven Wonders of the Ancient World still standing. Built from some 2.3 million blocks, it remained the tallest structure made by human hands for over three thousand eight hundred years.",
  },

  significance: {
    id: "Yang paling sulit dipercaya dari piramida ini bukan ukurannya melainkan ketelitiannya. Sisi-sisinya sejajar arah mata angin dengan simpangan kurang dari seperlima belas derajat, dan alasnya rata dalam selisih beberapa sentimeter saja — dikerjakan tanpa besi, tanpa roda, tanpa alat optik.",
    en: "The hardest thing to believe about this pyramid is not its size but its precision. Its sides align to the cardinal directions within a fifteenth of a degree, and its base is level to within a few centimetres — achieved without iron, without the wheel, without optical instruments.",
  },

  keyFeatures: [
    {
      title: { id: "Ketepatan arah mata angin", en: "Cardinal precision" },
      body: {
        id: "Keempat sisinya menghadap utara, selatan, timur, dan barat dengan simpangan rata-rata sekitar tiga menit busur. Penjajaran seteliti ini kemungkinan besar dicapai dengan mengamati bintang, bukan matahari.",
        en: "The four faces address north, south, east and west with an average deviation of about three arcminutes. Alignment this fine was most likely achieved by observing stars rather than the sun.",
      },
    },
    {
      title: { id: "Selubung batu kapur yang hilang", en: "The lost casing" },
      body: {
        id: "Piramida dulu dilapisi batu kapur Tura yang dipoles halus sehingga permukaannya rata dan memantulkan cahaya. Lapisan itu dilucuti selama berabad-abad untuk membangun Kairo; yang kita lihat sekarang adalah struktur intinya.",
        en: "The pyramid was once sheathed in finely polished Tura limestone, giving smooth, light-reflecting faces. That layer was stripped over centuries to build Cairo; what we see now is the core structure.",
      },
    },
    {
      title: { id: "Galeri Agung", en: "The Grand Gallery" },
      body: {
        id: "Lorong menanjak setinggi hampir sembilan meter dengan dinding bertingkat yang semakin merapat ke atas. Teknik corbel ini memindahkan beban ke samping, memungkinkan ruang setinggi itu ada di dalam massa batu pejal.",
        en: "An ascending corridor almost nine metres high with corbelled walls that step inward as they rise. The technique moves load sideways, allowing a space of that height to exist inside a solid mass of stone.",
      },
    },
    {
      title: { id: "Poros yang mengarah ke bintang", en: "Star-aligned shafts" },
      body: {
        id: "Poros-poros sempit dari kamar dalam menembus ke luar dengan sudut yang, pada masa pembangunannya, mengarah ke bintang tertentu. Fungsinya masih diperdebatkan: ventilasi, jalur ritual bagi jiwa, atau keduanya.",
        en: "Narrow shafts run from the inner chambers to the exterior at angles that, at the time of building, pointed toward particular stars. Their purpose is still debated: ventilation, a ritual path for the soul, or both.",
      },
    },
  ],

  hotspots: [
    {
      id: "puncak",
      title: { id: "Puncak", en: "The Apex" },
      summary: { id: "Sekitar delapan meter yang sudah hilang.", en: "Some eight metres that are no longer there." },
      detail: {
        id: "Tinggi asli piramida sekitar 146,6 meter; kini tinggal sekitar 138,5 meter. Batu puncaknya, yang mungkin dilapisi logam, sudah lama hilang dan puncaknya kini datar.",
        en: "The original height was about 146.6 metres; today it stands around 138.5. The capstone, possibly sheathed in metal, is long gone and the summit is now flat.",
      },
      anchor: [0.5, 0.98, 0.5],
      surface: "top",
    },
    {
      id: "sisi",
      title: { id: "Muka Bertangga", en: "The Stepped Face" },
      summary: { id: "Lapisan balok yang seharusnya tidak terlihat.", en: "Courses of block that were never meant to show." },
      detail: {
        id: "Tangga-tangga besar yang kini terlihat adalah struktur inti yang dulu tersembunyi di balik selubung halus. Kita sedang melihat kerangka bangunan ini, bukan permukaan yang dimaksudkan pembangunnya.",
        en: "The great steps now visible are the core structure once hidden behind a smooth casing. We are looking at this building's skeleton, not the surface its builders intended.",
      },
      anchor: [0.5, 0.5, 0.02],
      surface: "face",
    },
    {
      id: "pintu",
      title: { id: "Pintu Masuk Utara", en: "North Entrance" },
      summary: { id: "Lorong asli, dan lubang yang dibuat paksa.", en: "The original passage, and a forced hole." },
      detail: {
        id: "Pintu masuk asli berada sekitar tujuh belas meter di atas dasar pada sisi utara. Di bawahnya ada lubang yang lebih besar, dibuka paksa pada abad ke-9 oleh rombongan Khalifah al-Ma'mun, dan itulah jalur yang dipakai pengunjung hari ini.",
        en: "The original entrance sits about seventeen metres above the base on the north face. Below it is a larger opening forced in the ninth century by Caliph al-Ma'mun's party, and that is the route visitors use today.",
      },
      anchor: [0.5, 0.15, 0.02],
      surface: "face",
    },
    {
      id: "dataran",
      title: { id: "Dataran Batu", en: "The Bedrock Platform" },
      summary: { id: "Alas yang diratakan sebelum balok pertama diletakkan.", en: "Ground levelled before the first block was laid." },
      detail: {
        id: "Batuan dasar di bawah piramida diratakan lebih dulu, dengan selisih tinggi hanya beberapa sentimeter di seluruh area seluas lebih dari lima hektar. Tanpa dasar sedatar itu, kesalahan akan menumpuk dan puncaknya tidak akan bertemu di satu titik.",
        en: "The bedrock beneath was levelled first, varying by only a few centimetres across more than five hectares. Without a base that flat, error would accumulate and the sides would never meet at a point.",
      },
      anchor: [0.5, 0.01, 0.9],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "c. 2589 SM", event: { id: "Khufu naik takhta sebagai firaun Dinasti Keempat.", en: "Khufu takes the throne as a Fourth Dynasty pharaoh." } },
    { year: "c. 2560 SM", event: { id: "Piramida selesai setelah kira-kira dua dasawarsa pengerjaan.", en: "The pyramid is completed after roughly two decades of work." } },
    { year: "abad ke-9 M", event: { id: "Rombongan Khalifah al-Ma'mun membuka paksa jalan masuk ke dalam.", en: "Caliph al-Ma'mun's party forces an entrance into the interior." } },
    { year: "abad ke-13–14", event: { id: "Selubung batu kapur dilucuti untuk bahan bangunan Kairo.", en: "The limestone casing is stripped for building material in Cairo." } },
    { year: "1979", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO bersama nekropolis Memphis.", en: "Inscribed as a UNESCO World Heritage Site with the Memphis necropolis." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Batu kapur, granit pada kamar dalam", en: "Limestone, granite in the inner chambers" } },
    { label: { id: "Tinggi asli", en: "Original height" }, value: { id: "sekitar 146,6 meter", en: "about 146.6 metres" } },
    { label: { id: "Panjang sisi dasar", en: "Base side length" }, value: { id: "sekitar 230,3 meter", en: "about 230.3 metres" } },
    { label: { id: "Perkiraan jumlah balok", en: "Estimated blocks" }, value: { id: "sekitar 2,3 juta", en: "about 2.3 million" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Memphis and its Necropolis", url: "https://whc.unesco.org/en/list/86/" },
    { title: "Britannica — Pyramids of Giza", url: "https://www.britannica.com/topic/Pyramids-of-Giza" },
  ],

  keywords: ["piramida", "pyramid", "giza", "khufu", "cheops", "mesir", "egypt", "makam", "firaun", "pharaoh"],
};
