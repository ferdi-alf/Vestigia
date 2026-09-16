/**
 * Penyedia luring — jawaban dirakit langsung dari basis pengetahuan.
 *
 * Ini bukan tiruan kosong. Ia mencocokkan pertanyaan pengguna dengan bagian
 * data situs yang relevan lalu menyusunnya menjadi jawaban yang terbaca.
 * Kalau tidak ada yang cocok, ia mengatakannya — perilaku yang sama persis
 * dengan yang diminta dari model sungguhan.
 *
 * Ada dua alasan penyedia ini dipertahankan meski nanti kunci API terpasang.
 * Pertama, aplikasi tetap berfungsi penuh tanpa layanan eksternal, sehingga
 * demo tidak pernah mati karena kuota habis atau jaringan lambat. Kedua, ia
 * menjadi tolok ukur: apa pun yang dikatakan model sungguhan seharusnya bisa
 * ditelusuri kembali ke data yang sama yang dipakai penyedia ini.
 */
import type { Heritage, Locale, LocalizedText } from "@/data/types";
import type { AiProvider, AiRequest } from "../types";

/**
 * `kind` menandai tiga potongan fakta dasar yang punya kata tanya sendiri.
 * Potongan lain tidak punya, dan memang tidak perlu.
 */
type SnippetKind = "period" | "location" | "civilization";
type Snippet = { title: string; body: string; weight: number; kind?: SnippetKind };
type Indexed = Snippet & { tokens: Set<string>; titleTokens: Set<string> };

/**
 * Kata yang tidak membedakan apa pun.
 *
 * Kata tanya termasuk di dalamnya, dan itu penting. "Kapan", "siapa", dan
 * "berapa" menyatakan *maksud* pertanyaan, bukan isinya — membiarkannya ikut
 * dinilai berarti "berapa jumlah pengunjung tahun lalu" mendapat nilai dari
 * kata yang tidak pernah bisa dijawab data mana pun.
 */
const STOPWORDS = new Set([
  "yang", "dan", "atau", "apa", "apakah", "kenapa", "mengapa", "bagaimana", "itu", "ini",
  "di", "ke", "dari", "untuk", "pada", "dengan", "adalah", "ada", "bisa", "saja", "nya",
  "kapan", "siapa", "berapa", "mana", "dimana", "kah", "tolong", "jelaskan", "ceritakan",
  "the", "and", "or", "what", "why", "how", "is", "are", "was", "were", "this", "that",
  "of", "to", "in", "on", "for", "with", "a", "an", "it", "its", "does", "do", "did",
  "when", "who", "where", "which", "many", "much", "tell", "explain", "about",
]);

/**
 * Kata tanya dibuang dari penilaian karena tidak membedakan isi — tetapi
 * maksudnya tetap terbaca di sini, sebelum dibuang.
 *
 * "Kapan dibangun" dan "siapa yang membangun" menyisakan kata isi yang sama
 * persis setelah imbuhan dipangkas: "bangun". Tanpa penanda ini keduanya
 * mendapat jawaban yang sama, dan salah satunya pasti menjawab pertanyaan yang
 * tidak diajukan.
 *
 * Penanda ini hanya **mengalikan** nilai yang sudah lolos ambang. Ia tidak bisa
 * menciptakan kecocokan dari nol, jadi "siapa nama arsiteknya" — yang tidak
 * punya satu pun kata isi di dalam data — tetap ditolak seperti sebelumnya.
 */
const INTENT: ReadonlyArray<{ kind: SnippetKind; pattern: RegExp }> = [
  { kind: "period", pattern: /\b(kapan|when|tahun berapa|abad berapa)\b/i },
  { kind: "civilization", pattern: /\b(siapa|who|oleh siapa)\b/i },
  { kind: "location", pattern: /\b(di\s?mana|dimana|where|letak|lokasi)\b/i },
];

const INTENT_BOOST = 1.5;

function intentOf(question: string): SnippetKind | null {
  for (const entry of INTENT) if (entry.pattern.test(question)) return entry.kind;
  return null;
}

const PREFIX = /^(memper|menge|meny|meng|mem|men|peng|pem|pen|per|ber|ter|di|ke|se)/;
const SUFFIX = /(kannya|annya|nya|kan|an|i)$/;

/**
 * Pemangkasan imbuhan yang sengaja kasar.
 *
 * Tujuannya satu: "dibangun", "membangun", dan "pembangunan" harus bertemu di
 * kata yang sama. Tanpa itu, pertanyaan "kapan dibangun" tidak pernah cocok
 * dengan potongan data yang berbunyi "pembangunannya dimulai" — data yang
 * jelas-jelas menjawabnya.
 *
 * Hasilnya tidak selalu kata yang benar secara morfologis ("penting" jadi
 * "nting"), dan itu tidak masalah: pertanyaan dan data dipangkas dengan aturan
 * yang sama persis, jadi yang dibandingkan tetap setara.
 */
function stem(word: string): string {
  let w = word;
  const stripped = w.replace(PREFIX, "");
  if (stripped.length >= 4) w = stripped;
  const trimmed = w.replace(SUFFIX, "");
  if (trimmed.length >= 4) w = trimmed;
  return w;
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map(stem);
}

/**
 * Kata-kata yang menyebut situs itu sendiri, dan karena itu tidak membedakan
 * apa pun.
 *
 * Ini bukan penghalusan. Tanpa menyingkirkannya, setiap pertanyaan tentang
 * Borobudur cocok dengan setiap potongan teks tentang Borobudur — termasuk
 * pertanyaan yang datanya sama sekali tidak ada, seperti jumlah pengunjung
 * tahun tertentu. Sistem akan menjawab dengan paragraf yang kebetulan
 * menyebut nama itu, dan pembaca akan mengira pertanyaannya terjawab. Justru
 * kegagalan seperti itulah yang paling ingin dihindari rancangan ini.
 */
function identityTokens(heritage: Heritage, locale: Locale): Set<string> {
  const parts = [
    heritage.name[locale],
    heritage.name.en,
    heritage.country[locale],
    heritage.location[locale],
    heritage.civilization[locale],
  ];
  return new Set(parts.flatMap((p) => tokenise(p)));
}

/**
 * Bobot kelangkaan tiap kata pertanyaan, dihitung atas data situs itu sendiri.
 *
 * "Tahun" muncul di separuh potongan dan karena itu hampir tidak membuktikan
 * apa-apa; "drainase" muncul di satu dan sangat membuktikan. Tanpa pembobotan
 * ini, pertanyaan yang kata pentingnya tidak ada di data sama sekali tetap bisa
 * mengumpulkan nilai dari kata-kata sambungannya, lalu dijawab seolah terjawab.
 */
function rarity(tokens: string[], snippets: Indexed[]): Map<string, number> {
  const total = Math.max(1, snippets.length);
  const weights = new Map<string, number>();
  for (const token of tokens) {
    if (weights.has(token)) continue;
    let seen = 0;
    for (const snippet of snippets) if (snippet.tokens.has(token)) seen += 1;
    weights.set(token, Math.log(1 + total / (1 + seen)));
  }
  return weights;
}

/**
 * Kata yang cocok di **judul** potongan dihitung lebih berat daripada yang
 * cocok di badannya.
 *
 * Judul adalah pernyataan tentang apa potongan itu; badan teks bisa menyebut
 * sesuatu sambil lalu. "Relief" yang muncul sebagai judul "Panel relief"
 * menandakan potongan itu memang tentang relief — sementara "relief" yang
 * muncul di tengah paragraf tentang pemugaran tidak menandakan apa pun.
 */
const TITLE_BOOST = 1.6;

/** Bagian bobot pertanyaan yang benar-benar ditemukan di sebuah potongan. */
function overlap(
  queryTokens: string[],
  snippet: Indexed,
  weights: Map<string, number>,
  budget: number,
): number {
  if (budget <= 0) return 0;
  let found = 0;
  for (const token of queryTokens) {
    if (!snippet.tokens.has(token)) continue;
    const weight = weights.get(token) ?? 0;
    found += snippet.titleTokens.has(token) ? weight * TITLE_BOOST : weight;
  }
  return found / budget;
}

function collectSnippets(heritage: Heritage, locale: Locale): Snippet[] {
  const t = (v: LocalizedText) => v[locale];
  const id = locale === "id";

  /* Periode, lokasi, dan peradaban sebelumnya tidak pernah masuk ke sini —
     sehingga pertanyaan paling mendasar tentang sebuah situs ("kapan
     dibangun?") tidak punya apa pun untuk dicocokkan, dan jatuh ke paragraf
     signifikansi yang kebetulan menyebut kata "dibangun". Bobotnya sedikit di
     atas yang lain karena inilah yang paling sering ditanyakan lebih dulu. */
  const snippets: Snippet[] = [
    { title: id ? "Sekilas" : "Overview", body: t(heritage.description), weight: 1 },
    { title: id ? "Mengapa penting" : "Why it matters", body: t(heritage.significance), weight: 1 },
    {
      title: id ? "Periode pembangunan" : "Period of construction",
      body: id ? `Dibangun ${t(heritage.period)}.` : `Built ${t(heritage.period)}.`,
      weight: 1.3,
      kind: "period",
    },
    {
      title: id ? "Lokasi" : "Location",
      body: id
        ? `Terletak di ${t(heritage.location)}, ${t(heritage.country)}.`
        : `Located in ${t(heritage.location)}, ${t(heritage.country)}.`,
      weight: 1.3,
      kind: "location",
    },
    {
      title: id ? "Peradaban" : "Civilisation",
      body: id
        ? `Dibangun oleh ${t(heritage.civilization)}.`
        : `Built by ${t(heritage.civilization)}.`,
      weight: 1.3,
      kind: "civilization",
    },
  ];

  for (const f of heritage.keyFeatures) {
    snippets.push({ title: t(f.title), body: t(f.body), weight: 1.2 });
  }
  for (const h of heritage.hotspots) {
    snippets.push({ title: t(h.title), body: t(h.detail), weight: 1.2 });
  }
  for (const e of heritage.timeline) {
    snippets.push({ title: e.year, body: t(e.event), weight: 0.9 });
  }
  for (const f of heritage.facts) {
    snippets.push({ title: t(f.label), body: t(f.value), weight: 0.8 });
  }

  return snippets;
}

function answerGuide(request: AiRequest): string {
  const { locale, heritage } = request;
  const site = heritage[0];
  if (!site) {
    return locale === "id" ? "Situs tidak ditemukan." : "Site not found.";
  }

  const question = request.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const identity = identityTokens(site, locale);
  const allTokens = tokenise(question);
  const tokens = allTokens.filter((t) => !identity.has(t));
  const snippets = collectSnippets(site, locale);
  const name = site.name[locale];

  // Pertanyaan yang isinya hanya nama situs — "Borobudur?", "ceritakan tentang
  // Angkor Wat" — memang meminta gambaran umum, bukan sesuatu yang spesifik.
  if (tokens.length === 0) {
    return `${site.description[locale]}\n\n${site.significance[locale]}`;
  }

  const indexed: Indexed[] = snippets.map((s) => ({
    ...s,
    tokens: new Set(tokenise(`${s.title} ${s.body}`)),
    titleTokens: new Set(tokenise(s.title)),
  }));

  const weights = rarity(tokens, indexed);
  const budget = tokens.reduce((n, t) => n + (weights.get(t) ?? 0), 0);

  const intent = intentOf(question);

  const scored = indexed
    .map((s) => ({
      s,
      score:
        overlap(tokens, s, weights, budget) *
        s.weight *
        (intent && s.kind === intent ? INTENT_BOOST : 1),
    }))
    // Setengah bobot pertanyaan harus benar-benar ditemukan. Ambang setinggi
    // ini sengaja condong ke arah menolak: menolak menjawab itu jujur dan bisa
    // diperbaiki pengguna dengan bertanya lain; menjawab hal yang salah tidak.
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score);

  // Hanya potongan yang sekelas dengan yang terbaik. Kalau satu potongan
  // menjawab telak, dua potongan setengah-relevan di bawahnya hanya mengaburkan.
  const best = scored[0]?.score ?? 0;
  const ranked = scored.filter((r) => r.score >= best * 0.8).slice(0, 3);

  if (ranked.length === 0) {
    // Tidak ada yang cocok. Katakan begitu, lalu tunjukkan apa yang memang
    // tersedia — sama seperti yang diperintahkan kepada model sungguhan.
    const available = snippets
      .filter((s) => s.weight >= 1.2 && s.title !== (locale === "id" ? "Lokasi" : "Location"))
      .slice(0, 5)
      .map((s) => `· ${s.title}`)
      .join("\n");

    return locale === "id"
      ? `Informasi itu tidak ada dalam data ${name} yang tersedia di sini.\n\nYang bisa saya jelaskan tentang situs ini:\n\n${available}\n\nCoba tanyakan salah satu dari itu.`
      : `That information is not in the available data for ${name}.\n\nWhat I can explain about this site:\n\n${available}\n\nTry asking about one of those.`;
  }

  const body = ranked.map((r) => `${r.s.title} — ${r.s.body}`).join("\n\n");
  const sourceLine = site.sources.length
    ? locale === "id"
      ? `\n\nSumber: ${site.sources.map((s) => s.title).join("; ")}`
      : `\n\nSources: ${site.sources.map((s) => s.title).join("; ")}`
    : "";

  return `${body}${sourceLine}`;
}

function answerCompare(request: AiRequest): string {
  const { locale, heritage } = request;
  const [a, b] = heritage;
  if (!a || !b) {
    return locale === "id" ? "Perbandingan membutuhkan dua situs." : "A comparison needs two sites.";
  }

  const rows: [string, string, string][] = [
    [locale === "id" ? "Periode" : "Period", a.period[locale], b.period[locale]],
    [locale === "id" ? "Peradaban" : "Civilisation", a.civilization[locale], b.civilization[locale]],
    [locale === "id" ? "Lokasi" : "Location", `${a.location[locale]}, ${a.country[locale]}`, `${b.location[locale]}, ${b.country[locale]}`],
    [locale === "id" ? "Kategori" : "Category", a.category, b.category],
  ];

  const table = rows.map(([label, left, right]) => `${label}\n  ${a.name[locale]}: ${left}\n  ${b.name[locale]}: ${right}`).join("\n\n");

  const heading =
    locale === "id"
      ? `${a.name[locale]} dan ${b.name[locale]}, berdampingan:`
      : `${a.name[locale]} and ${b.name[locale]}, side by side:`;

  const closing =
    locale === "id"
      ? `\n\n${a.name[locale]}: ${a.significance.id}\n\n${b.name[locale]}: ${b.significance.id}`
      : `\n\n${a.name.en}: ${a.significance.en}\n\n${b.name.en}: ${b.significance.en}`;

  return `${heading}\n\n${table}${closing}`;
}

function answerStory(request: AiRequest): string {
  const { locale, heritage } = request;
  const site = heritage[0];
  if (!site) return "";
  // Tanpa model, narasi terbaik yang jujur adalah deskripsi dan signifikansi
  // yang memang sudah ditulis untuk situs itu.
  return `${site.description[locale]}\n\n${site.significance[locale]}`;
}

/** Potong teks menjadi serpihan supaya antarmuka streaming berperilaku sama. */
async function* emit(text: string, signal?: AbortSignal): AsyncIterable<string> {
  const chunks = text.match(/[^\s]+\s*/g) ?? [text];
  for (const chunk of chunks) {
    if (signal?.aborted) return;
    yield chunk;
  }
}

export const groundedProvider: AiProvider = {
  id: "grounded",
  isOffline: true,

  stream(request, signal) {
    let text: string;
    switch (request.task) {
      case "compare":
        text = answerCompare(request);
        break;
      case "story":
        text = answerStory(request);
        break;
      case "quiz":
        // Kuis dirakit oleh route handler-nya sendiri, bukan lewat aliran teks.
        text = "";
        break;
      default:
        text = answerGuide(request);
    }
    return emit(text, signal);
  },
};

/**
 * Kuis luring: soal dirakit dari fakta dan fitur situs, dengan pengecoh
 * diambil dari situs lain sehingga pilihannya masuk akal dan bukan asal salah.
 */
export function buildOfflineQuiz(
  site: Heritage,
  others: Heritage[],
  locale: Locale,
): { question: string; choices: string[]; answer: number; explanation: string }[] {
  const t = (v: LocalizedText) => v[locale];
  const id = locale === "id";
  const questions: { question: string; choices: string[]; answer: number; explanation: string }[] = [];

  const pickDistractors = (correct: string, pool: string[], n: number) => {
    const unique = [...new Set(pool.filter((p) => p && p !== correct))];
    return unique.slice(0, n);
  };

  const shuffleWithAnswer = (correct: string, distractors: string[]) => {
    const choices = [correct, ...distractors];
    // Urutan tetap tapi tidak selalu di posisi pertama: geser berdasarkan
    // panjang teks, supaya jawabannya tidak selalu pilihan A.
    const shift = correct.length % choices.length;
    const rotated = [...choices.slice(shift), ...choices.slice(0, shift)];
    return { choices: rotated, answer: rotated.indexOf(correct) };
  };

  // 1. Periode
  {
    const correct = t(site.period);
    const distractors = pickDistractors(correct, others.map((o) => t(o.period)), 3);
    if (distractors.length === 3) {
      const { choices, answer } = shuffleWithAnswer(correct, distractors);
      questions.push({
        question: id ? `Kapan ${t(site.name)} dibangun?` : `When was ${t(site.name)} built?`,
        choices,
        answer,
        explanation: id
          ? `${t(site.name)} berasal dari ${correct}.`
          : `${t(site.name)} dates from ${correct}.`,
      });
    }
  }

  // 2. Negara
  {
    const correct = t(site.country);
    const distractors = pickDistractors(correct, others.map((o) => t(o.country)), 3);
    if (distractors.length === 3) {
      const { choices, answer } = shuffleWithAnswer(correct, distractors);
      questions.push({
        question: id ? `Di negara mana ${t(site.name)} berada?` : `In which country does ${t(site.name)} stand?`,
        choices,
        answer,
        explanation: id
          ? `${t(site.name)} berada di ${t(site.location)}, ${correct}.`
          : `${t(site.name)} stands at ${t(site.location)}, ${correct}.`,
      });
    }
  }

  // 3. Peradaban
  {
    const correct = t(site.civilization);
    const distractors = pickDistractors(correct, others.map((o) => t(o.civilization)), 3);
    if (distractors.length === 3) {
      const { choices, answer } = shuffleWithAnswer(correct, distractors);
      questions.push({
        question: id ? `Peradaban mana yang membangun ${t(site.name)}?` : `Which civilisation built ${t(site.name)}?`,
        choices,
        answer,
        explanation: id
          ? `${t(site.name)} adalah karya ${correct}.`
          : `${t(site.name)} is the work of the ${correct}.`,
      });
    }
  }

  // 4 dan 5. Fitur utama — pengecoh diambil dari fitur situs lain, sehingga
  // pilihannya sama-sama masuk akal sebagai fitur arsitektur.
  const featurePool = others.flatMap((o) => o.keyFeatures.map((f) => t(f.title)));
  for (const feature of site.keyFeatures.slice(0, 2)) {
    const correct = t(feature.title);
    const distractors = pickDistractors(correct, featurePool, 3);
    if (distractors.length < 3) continue;
    const { choices, answer } = shuffleWithAnswer(correct, distractors);
    questions.push({
      question: id
        ? `Mana yang merupakan fitur ${t(site.name)}?`
        : `Which of these is a feature of ${t(site.name)}?`,
      choices,
      answer,
      explanation: t(feature.body),
    });
  }

  return questions.slice(0, 5);
}
