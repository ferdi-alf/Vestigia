import { getHeritage } from "@/data/registry";
import { isLocale } from "@/lib/i18n/dictionaries";
import { getProvider } from "@/lib/ai";
import { checkRateLimit, clientKey } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );
  }

  let body: { slug?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const heritage = body.slug ? getHeritage(body.slug) : undefined;
  if (!heritage) return Response.json({ error: "unknown_heritage" }, { status: 404 });

  const locale = isLocale(body.locale) ? body.locale : "id";
  const provider = await getProvider();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of provider.stream(
          {
            task: "story",
            locale,
            heritage: [heritage],
            messages: [
              {
                role: "user",
                content:
                  locale === "id"
                    ? `Tulis paragraf pembuka untuk ${heritage.name.id}.`
                    : `Write the opening paragraph for ${heritage.name.en}.`,
              },
            ],
            level: "general",
          },
          request.signal,
        )) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        if (!request.signal.aborted) console.error("AI story gagal:", error);
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
