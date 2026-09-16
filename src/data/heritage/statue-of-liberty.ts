import type { HeritageMeta } from "../types";

export const statueOfLiberty: HeritageMeta = {
  slug: "statue-of-liberty",
  name: { id: "Patung Liberty", en: "Statue of Liberty" },
  country: { id: "Amerika Serikat", en: "United States" },
  location: { id: "Liberty Island, New York", en: "Liberty Island, New York" },
  coordinates: [40.6892, -74.0445],
  period: { id: "diresmikan 1886", en: "dedicated 1886" },
  civilization: { id: "Prancis dan Amerika abad ke-19", en: "Nineteenth-century France and America" },
  category: "monument",

  description: {
    id: "Sosok perempuan setinggi 46 meter yang mengangkat obor, hadiah Prancis kepada Amerika Serikat. Kulitnya lembaran tembaga setebal sekitar 2,4 milimeter — kira-kira setebal dua keping uang logam — digantung pada rangka besi rancangan Gustave Eiffel.",
    en: "A 46-metre female figure raising a torch, a gift from France to the United States. Her skin is copper sheet about 2.4 millimetres thick — roughly two coins — hung on an iron framework designed by Gustave Eiffel.",
  },

  significance: {
    id: "Patung ini menyelesaikan masalah yang belum pernah dihadapi sebelumnya: bagaimana membuat patung raksasa yang bisa bergerak. Kulit tembaganya tidak menahan beban dan tidak menempel kaku pada rangka; ia digantung pada pegas datar sehingga bisa memuai, menyusut, dan bergoyang tanpa retak.",
    en: "The statue solved a problem nobody had faced before: how to make a colossus that can move. Its copper skin carries no load and is not rigidly fixed to the frame; it hangs on flat springs so it can expand, contract and sway without tearing.",
  },

  keyFeatures: [
    {
      title: { id: "Repoussé — tembaga yang dipalu", en: "Repoussé — hammered copper" },
      body: {
        id: "Setiap lembar tembaga dibentuk dengan memalunya dari sisi dalam ke atas cetakan kayu. Teknik ini menghasilkan kulit yang sangat ringan untuk ukurannya: seluruh tembaganya hanya sekitar 31 ton.",
        en: "Each copper sheet was shaped by hammering it from the inside over a wooden mould. The technique yields a skin remarkably light for its size: all the copper together weighs only about 31 tonnes.",
      },
    },
    {
      title: { id: "Rangka besi Eiffel", en: "Eiffel's iron frame" },
      body: {
        id: "Tiang pusat besi setinggi hampir dua puluh sembilan meter menahan seluruh beban, dikelilingi jaringan rusuk sekunder. Rancangan ini memungkinkan patung bergoyang beberapa sentimeter dalam angin kencang alih-alih melawan angin dan patah.",
        en: "A central iron pylon nearly twenty-nine metres tall carries the whole load, surrounded by a web of secondary ribs. The design lets the statue sway several centimetres in high wind rather than resisting it and failing.",
      },
    },
    {
      title: { id: "Patina hijau", en: "The green patina" },
      body: {
        id: "Patung ini dulu berwarna cokelat tembaga mengilap. Lapisan hijau terbentuk secara alami dalam kira-kira tiga dasawarsa dan justru melindungi logam di bawahnya — usulan untuk mengecatnya kembali ditolak karena alasan itu.",
        en: "The statue was once bright copper brown. The green layer formed naturally over roughly three decades and actually protects the metal beneath — proposals to repaint it were rejected for that reason.",
      },
    },
    {
      title: { id: "Tujuh jari mahkota", en: "Seven rays" },
      body: {
        id: "Tujuh jari pada mahkotanya lazim dibaca sebagai tujuh benua dan tujuh samudra. Di kakinya terdapat rantai yang terputus, detail yang sengaja ditempatkan agar hampir tidak terlihat dari permukaan tanah.",
        en: "The seven rays of the crown are commonly read as the seven continents and seven seas. At her feet lies a broken chain, a detail deliberately placed where it is nearly invisible from ground level.",
      },
    },
  ],

  hotspots: [
    {
      id: "obor",
      title: { id: "Obor", en: "The Torch" },
      summary: { id: "Bagian tertinggi, dan yang paling sering diganti.", en: "The highest point, and the most often replaced." },
      detail: {
        id: "Obor asli sudah beberapa kali diubah dan akhirnya diganti seluruhnya pada pemugaran 1984–1986 dengan salinan berlapis daun emas. Obor lama kini dipajang di museum di pulau yang sama.",
        en: "The original torch was altered several times and finally replaced entirely in the 1984–1986 restoration with a gold-leafed copy. The old torch is now displayed in a museum on the same island.",
      },
      anchor: [0.65, 0.98, 0.5],
      surface: "top",
    },
    {
      id: "mahkota",
      title: { id: "Mahkota", en: "The Crown" },
      summary: { id: "Dua puluh lima jendela dan tujuh jari.", en: "Twenty-five windows and seven rays." },
      detail: {
        id: "Mahkota memiliki dua puluh lima jendela dan tujuh jari yang memancar. Ruang di dalamnya dapat dimasuki lewat tangga spiral sempit dengan 162 anak tangga dari puncak alas.",
        en: "The crown has twenty-five windows and seven radiating rays. Its interior is reached by a narrow spiral stair of 162 steps from the top of the pedestal.",
      },
      anchor: [0.5, 0.82, 0.4],
      surface: "top",
    },
    {
      id: "jubah",
      title: { id: "Lipatan Jubah", en: "The Robe" },
      summary: { id: "Permukaan tembaga yang dipalu satu per satu.", en: "Copper surface, hammered sheet by sheet." },
      detail: {
        id: "Lipatan jubah dibentuk dari sekitar tiga ratus lembar tembaga terpisah yang disambung dengan paku keling. Garis sambungnya masih terlihat dari dekat, dan itulah peta cara patung ini dirakit.",
        en: "The robe's folds are formed from some three hundred separate copper sheets joined by rivets. The seams are still visible up close, and they are the map of how the statue was assembled.",
      },
      anchor: [0.5, 0.35, 0.05],
      surface: "face",
    },
    {
      id: "alas",
      title: { id: "Alas", en: "The Pedestal" },
      summary: { id: "Separuh dari total tinggi monumen.", en: "Half of the monument's total height." },
      detail: {
        id: "Alas granit dan betonnya dirancang Richard Morris Hunt dan dibiayai lewat penggalangan dana publik yang dipimpin Joseph Pulitzer. Dengan alas ini, tinggi keseluruhan mencapai sekitar 93 meter.",
        en: "The granite and concrete pedestal was designed by Richard Morris Hunt and paid for by a public fundraising campaign led by Joseph Pulitzer. With it, the full height reaches about 93 metres.",
      },
      anchor: [0.5, 0.05, 0.85],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "1875", event: { id: "Pengerjaan dimulai di Paris di bawah Frédéric Auguste Bartholdi.", en: "Work begins in Paris under Frédéric Auguste Bartholdi." } },
    { year: "1884", event: { id: "Patung selesai di Paris, lalu dibongkar menjadi 350 bagian dalam 214 peti.", en: "The statue is completed in Paris, then dismantled into 350 pieces in 214 crates." } },
    { year: "28 Oktober 1886", event: { id: "Diresmikan di Bedloe's Island, kini Liberty Island.", en: "Dedicated on Bedloe's Island, now Liberty Island." } },
    { year: "1984–1986", event: { id: "Pemugaran besar: rangka besi diganti baja tahan karat dan obor dibuat baru.", en: "Major restoration: the iron frame is replaced with stainless steel and a new torch is made." } },
    { year: "1984", event: { id: "Ditetapkan sebagai Situs Warisan Dunia UNESCO.", en: "Inscribed as a UNESCO World Heritage Site." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Lembaran tembaga pada rangka besi", en: "Copper sheet on an iron frame" } },
    { label: { id: "Tinggi patung", en: "Statue height" }, value: { id: "46 meter", en: "46 metres" } },
    { label: { id: "Tinggi dengan alas", en: "Height with pedestal" }, value: { id: "sekitar 93 meter", en: "about 93 metres" } },
    { label: { id: "Tebal kulit tembaga", en: "Copper thickness" }, value: { id: "sekitar 2,4 milimeter", en: "about 2.4 millimetres" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Statue of Liberty", url: "https://whc.unesco.org/en/list/307/" },
    { title: "US National Park Service — Statue of Liberty", url: "https://www.nps.gov/stli/index.htm" },
  ],

  keywords: ["liberty", "patung liberty", "statue of liberty", "new york", "bartholdi", "eiffel", "tembaga", "amerika"],
};
