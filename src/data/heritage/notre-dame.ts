import type { HeritageMeta } from "../types";

export const notreDame: HeritageMeta = {
  slug: "notre-dame",
  name: { id: "Notre-Dame de Paris", en: "Notre-Dame de Paris" },
  country: { id: "Prancis", en: "France" },
  location: { id: "Île de la Cité, Paris", en: "Île de la Cité, Paris" },
  coordinates: [48.853, 2.3499],
  period: { id: "1163–1260, dengan perubahan berabad-abad", en: "1163–1260, altered over centuries" },
  civilization: { id: "Gotik Prancis", en: "French Gothic" },
  category: "temple",

  description: {
    id: "Katedral Gotik di pulau tempat Paris bermula. Dinding batunya ditipiskan sampai batas kemampuan abad pertengahan, ditopang dari luar oleh penopang layang, sehingga ruang yang tersisa bisa diisi kaca patri alih-alih batu.",
    en: "A Gothic cathedral on the island where Paris began. Its stone walls were thinned to the limit of medieval capability and braced from outside by flying buttresses, so that what remained could be filled with stained glass instead of masonry.",
  },

  significance: {
    id: "Notre-Dame adalah tempat teknik penopang layang dikembangkan menjadi sistem yang matang. Gagasannya sederhana dan mengubah segalanya: pindahkan beban atap ke luar bangunan, maka dinding tidak lagi perlu tebal, dan cahaya bisa masuk.",
    en: "Notre-Dame is where the flying buttress matured into a system. The idea is simple and it changed everything: move the roof's thrust outside the building, and the walls no longer need to be thick, and light can come in.",
  },

  keyFeatures: [
    {
      title: { id: "Penopang layang", en: "Flying buttresses" },
      body: {
        id: "Lengkung batu yang berdiri terpisah dari bangunan menyalurkan dorongan atap ke pilar luar. Tanpa itu, dinding setinggi tiga puluh meter dengan bukaan sebesar jendela mawar akan tertekan keluar dan runtuh.",
        en: "Stone arches standing clear of the building carry the roof's outward thrust to external piers. Without them, walls thirty metres high pierced by openings the size of the rose windows would be pushed out and fall.",
      },
    },
    {
      title: { id: "Tiga jendela mawar", en: "Three rose windows" },
      body: {
        id: "Jendela mawar utara, selatan, dan barat masing-masing berdiameter sekitar sepuluh meter. Yang utara mempertahankan porsi kaca abad ke-13 paling banyak, dan selamat dari kebakaran 2019.",
        en: "The north, south and west roses each measure about ten metres across. The north retains the most thirteenth-century glass, and survived the 2019 fire.",
      },
    },
    {
      title: { id: "Menara kembar barat", en: "The twin west towers" },
      body: {
        id: "Kedua menara setinggi 69 meter sengaja dibiarkan tanpa puncak runcing. Rencana awal menyertakan menara lancip, tetapi pekerjaan berhenti dan bentuk datar itu justru menjadi ciri katedral ini.",
        en: "The two 69-metre towers were deliberately left without spires. Spires were planned, but work stopped, and the flat profile became the cathedral's signature.",
      },
    },
    {
      title: { id: "Gargoyle dan chimera", en: "Gargoyles and chimeras" },
      body: {
        id: "Gargoyle adalah pancuran air yang membuang hujan jauh dari dinding. Chimera, patung makhluk aneh yang paling sering difoto, tidak berfungsi apa pun dan baru ditambahkan Viollet-le-Duc pada abad ke-19.",
        en: "Gargoyles are waterspouts that throw rain clear of the walls. The chimeras — the strange creatures most often photographed — serve no function and were added by Viollet-le-Duc in the nineteenth century.",
      },
    },
  ],

  hotspots: [
    {
      id: "menara",
      title: { id: "Menara Barat", en: "West Towers" },
      summary: { id: "Dua menara datar yang tidak pernah diberi puncak.", en: "Two flat towers that never received their spires." },
      detail: {
        id: "Menara utara dan selatan selesai sekitar 1250. Menara selatan menyimpan lonceng Emmanuel seberat lebih dari tiga belas ton, yang masih dibunyikan pada peristiwa besar.",
        en: "The north and south towers were finished around 1250. The south tower holds the Emmanuel bell, over thirteen tonnes, still rung on major occasions.",
      },
      anchor: [0.5, 0.95, 0.85],
      surface: "top",
    },
    {
      id: "fasad-barat",
      title: { id: "Fasad Barat", en: "West Front" },
      summary: { id: "Tiga portal, satu galeri raja, satu jendela mawar.", en: "Three portals, a gallery of kings, one rose window." },
      detail: {
        id: "Fasad ini disusun agar terbaca dari bawah ke atas seperti halaman: portal berpahat di ketinggian mata, dua puluh delapan patung raja Yudea di atasnya, lalu jendela mawar. Patung-patung itu dipenggal saat Revolusi dan diganti pada abad ke-19.",
        en: "The front is composed to read upward like a page: carved portals at eye level, twenty-eight kings of Judah above, then the rose. Those statues were beheaded during the Revolution and replaced in the nineteenth century.",
      },
      anchor: [0.5, 0.45, 0.98],
      surface: "face",
    },
    {
      id: "penopang",
      title: { id: "Penopang Layang", en: "Flying Buttresses" },
      summary: { id: "Kerangka luar yang memungkinkan dinding menipis.", en: "The external frame that let the walls thin out." },
      detail: {
        id: "Penopang di sekeliling apse adalah yang paling berani, membentang hampir lima belas meter dalam satu lengkung. Bagian inilah yang paling jelas menunjukkan bahwa struktur Gotik bekerja dari luar ke dalam.",
        en: "The buttresses around the apse are the boldest, spanning nearly fifteen metres in a single arch. This is where it shows most clearly that Gothic structure works from the outside in.",
      },
      anchor: [0.1, 0.45, 0.3],
      surface: "face",
    },
    {
      id: "parvis",
      title: { id: "Pelataran Parvis", en: "The Parvis" },
      summary: { id: "Alun-alun yang mengatur cara katedral dilihat.", en: "The square that governs how the cathedral is seen." },
      detail: {
        id: "Alun-alun di depan katedral diperluas besar-besaran pada abad ke-19. Jarak pandang yang kita anggap wajar hari ini adalah keputusan perencanaan kota Haussmann, bukan kondisi abad pertengahan.",
        en: "The square before the cathedral was greatly enlarged in the nineteenth century. The viewing distance we take for granted today is a decision of Haussmann's city planning, not a medieval condition.",
      },
      anchor: [0.5, 0.02, 0.95],
      surface: "ground",
    },
  ],

  timeline: [
    { year: "1163", event: { id: "Batu pertama diletakkan pada masa Uskup Maurice de Sully.", en: "The first stone is laid under Bishop Maurice de Sully." } },
    { year: "c. 1260", event: { id: "Bangunan utama pada dasarnya selesai.", en: "The main structure is substantially complete." } },
    { year: "1793", event: { id: "Revolusi Prancis merusak patung dan menjarah isi katedral.", en: "The French Revolution defaces the sculpture and strips the interior." } },
    { year: "1844–1864", event: { id: "Viollet-le-Duc memimpin pemugaran besar dan menambahkan menara lancip di persilangan.", en: "Viollet-le-Duc leads a major restoration and adds the crossing spire." } },
    { year: "15 April 2019", event: { id: "Kebakaran menghancurkan atap kayu dan menara lancip abad ke-19.", en: "Fire destroys the timber roof and the nineteenth-century spire." } },
    { year: "Desember 2024", event: { id: "Katedral dibuka kembali setelah pemugaran.", en: "The cathedral reopens after restoration." } },
  ],

  facts: [
    { label: { id: "Bahan", en: "Material" }, value: { id: "Batu kapur Lutetia", en: "Lutetian limestone" } },
    { label: { id: "Panjang", en: "Length" }, value: { id: "sekitar 128 meter", en: "about 128 metres" } },
    { label: { id: "Tinggi menara", en: "Tower height" }, value: { id: "69 meter", en: "69 metres" } },
    { label: { id: "Tinggi kubah nave", en: "Nave vault height" }, value: { id: "sekitar 33 meter", en: "about 33 metres" } },
  ],

  sources: [
    { title: "UNESCO World Heritage Centre — Paris, Banks of the Seine", url: "https://whc.unesco.org/en/list/600/" },
    { title: "Britannica — Notre-Dame de Paris", url: "https://www.britannica.com/topic/Notre-Dame-de-Paris" },
  ],

  keywords: ["notre-dame", "notre dame", "paris", "gotik", "gothic", "katedral", "cathedral", "prancis", "france"],
};
