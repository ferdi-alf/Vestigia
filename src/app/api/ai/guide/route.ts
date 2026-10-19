import { getHeritage } from "@/data/registry";
import { isLocale } from "@/lib/i18n/dictionaries";
import { getProvider } from "@/lib/ai";
import { guardRequest, rateLimited } from "@/lib/ai/rate-limit";
import { screenInput, MAX_MESSAGE_CHARS } from "@/lib/ai/guard";
import type { AiMessage, KnowledgeLevel } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const LEVELS: KnowledgeLevel[] = ["child", "general", "deep"];

interface Body {
  slug?: string;
  locale?: string;
  level?: string;
  messages?: AiMessage[];
}

export async function POST(request: Request) {
  const guard = guardRequest(request);
  if (!guard.allowed) return rateLimited(guard);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const heritage = body.slug ? getHeritage(body.slug) : undefined;
  // Slug di luar koleksi aktif tidak punya konteks untuk menjawab, dan
  // menjawab tanpa konteks persis yang dihindari seluruh rancangan ini.
  if (!heritage) return Response.json({ error: "unknown_heritage" }, { status: 404 });

  const locale = isLocale(body.locale) ? body.locale : "id";
  const level = LEVELS.includes(body.level as KnowledgeLevel)
    ? (body.level as KnowledgeLevel)
    : "general";

  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .slice(-10);

  if (messages.length === 0 || messages.at(-1)?.role !== "user") {
    return Response.json({ error: "no_question" }, { status: 400 });
  }

  /* Penyaringan sebelum model dipanggil. Permintaan yang jelas di luar
     cakupan — pengambilalihan peran, tugas pemrograman — dijawab di sini,
     sehingga ia tidak bisa dibujuk dan tidak menghabiskan satu token pun.
     Lapisan utamanya tetap system prompt; lihat `lib/ai/guard.ts`. */
  const screened = screenInput(messages.at(-1)!.content, locale, heritage.name[locale]);
  if (!screened.ok) {
    return new Response(screened.reply, {
      headers: {
        ...guard.headers,
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-ai-refused": screened.reason,
      },
    });
  }

  const provider = await getProvider();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of provider.stream(
          { task: "guide", locale, heritage: [heritage], messages, level },
          request.signal,
        )) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        // Pembatalan oleh pengguna bukan kegagalan; jangan tulis pesan galat
        // ke dalam jawaban yang sudah tampil di layar.
        if (!request.signal.aborted) {
          controller.enqueue(
            encoder.encode(
              locale === "id"
                ? "\n\n[Jawaban terputus. Coba lagi.]"
                : "\n\n[The answer was interrupted. Try again.]",
            ),
          );
          console.error("AI guide gagal:", error);
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...guard.headers,
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-ai-provider": provider.id,
      "x-ai-offline": String(provider.isOffline),
    },
  });
}
