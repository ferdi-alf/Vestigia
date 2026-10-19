import { HERITAGE, getHeritage } from "@/data/registry";
import { isLocale } from "@/lib/i18n/dictionaries";
import { getProvider } from "@/lib/ai";
import { buildOfflineQuiz } from "@/lib/ai/providers/grounded";
import { guardRequest, rateLimited } from "@/lib/ai/rate-limit";
import type { QuizQuestion } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Kuis dikembalikan sebagai JSON sekaligus, bukan sebagai aliran.
 *
 * Soal pilihan ganda tidak ada gunanya ditampilkan setengah jadi — pengguna
 * tidak bisa menjawab pertanyaan yang pilihannya belum lengkap. Jadi jawaban
 * model ditunggu utuh, divalidasi bentuknya, baru dikirim.
 */

/** Bentuk yang dikembalikan model belum tentu benar; periksa sebelum dipakai. */
function parseQuiz(raw: string): QuizQuestion[] | null {
  // Model kadang membungkus JSON dalam pagar kode meski diminta tidak.
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { questions?: unknown };
    if (!Array.isArray(parsed.questions)) return null;

    const questions = parsed.questions.filter((q): q is QuizQuestion => {
      if (!q || typeof q !== "object") return false;
      const c = q as Partial<QuizQuestion>;
      return (
        typeof c.question === "string" &&
        Array.isArray(c.choices) &&
        c.choices.length >= 2 &&
        c.choices.every((choice) => typeof choice === "string") &&
        typeof c.answer === "number" &&
        c.answer >= 0 &&
        c.answer < c.choices.length &&
        typeof c.explanation === "string"
      );
    });

    return questions.length > 0 ? questions.slice(0, 5) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const guard = guardRequest(request);
  if (!guard.allowed) return rateLimited(guard);

  let body: { slug?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const heritage = body.slug ? getHeritage(body.slug) : undefined;
  if (!heritage) return Response.json({ error: "unknown_heritage" }, { status: 404 });

  const locale = isLocale(body.locale) ? body.locale : "id";
  const others = HERITAGE.filter((h) => h.slug !== heritage.slug);
  const provider = await getProvider();

  // Kuis luring dirakit dari basis pengetahuan, dengan pengecoh diambil dari
  // situs lain sehingga pilihannya sama-sama masuk akal.
  const fallback = () =>
    Response.json(
      { questions: buildOfflineQuiz(heritage, others, locale), offline: true },
      { headers: { ...guard.headers, "cache-control": "no-store" } },
    );

  if (provider.isOffline) return fallback();

  try {
    let raw = "";
    for await (const chunk of provider.stream(
      {
        task: "quiz",
        locale,
        heritage: [heritage],
        messages: [{ role: "user", content: locale === "id" ? "Buat kuisnya." : "Write the quiz." }],
        level: "general",
      },
      request.signal,
    )) {
      raw += chunk;
    }

    const questions = parseQuiz(raw);
    // Keluaran model yang tidak sesuai bentuk lebih baik diganti kuis yang
    // pasti benar daripada ditampilkan rusak.
    if (!questions) return fallback();

    return Response.json(
      { questions, offline: false },
      { headers: { ...guard.headers, "cache-control": "no-store", "x-ai-provider": provider.id } },
    );
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("AI quiz gagal:", error);
    return fallback();
  }
}
