import { getHeritage } from "@/data/registry";
import { isLocale } from "@/lib/i18n/dictionaries";
import { getProvider } from "@/lib/ai";
import { checkRateLimit, clientKey } from "@/lib/ai/rate-limit";
import type { KnowledgeLevel } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const LEVELS: KnowledgeLevel[] = ["child", "general", "deep"];

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  let body: { a?: string; b?: string; locale?: string; level?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const a = body.a ? getHeritage(body.a) : undefined;
  const b = body.b ? getHeritage(body.b) : undefined;
  if (!a || !b) return Response.json({ error: "unknown_heritage" }, { status: 404 });
  if (a.slug === b.slug) return Response.json({ error: "same_heritage" }, { status: 400 });

  const locale = isLocale(body.locale) ? body.locale : "id";
  const level = LEVELS.includes(body.level as KnowledgeLevel)
    ? (body.level as KnowledgeLevel)
    : "general";

  const question =
    locale === "id"
      ? `Bandingkan ${a.name.id} dan ${b.name.id}.`
      : `Compare ${a.name.en} and ${b.name.en}.`;

  const provider = await getProvider();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of provider.stream(
          {
            task: "compare",
            locale,
            heritage: [a, b],
            messages: [{ role: "user", content: question }],
            level,
          },
          request.signal,
        )) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        if (!request.signal.aborted) console.error("AI compare gagal:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-ai-provider": provider.id,
      "x-ai-offline": String(provider.isOffline),
    },
  });
}
