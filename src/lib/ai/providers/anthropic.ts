/**
 * Penyedia Claude.
 *
 * Menggunakan SDK resmi Anthropic. Model bawaan bisa ditimpa lewat
 * `ANTHROPIC_MODEL` kalau nanti Anda ingin menukar biaya dengan kedalaman.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider, AiRequest } from "../types";
import {
  compareSystemPrompt,
  guideSystemPrompt,
  quizSystemPrompt,
  storySystemPrompt,
} from "../grounding";

const DEFAULT_MODEL = "claude-opus-5";

function systemFor(request: AiRequest): string {
  const [a, b] = request.heritage;
  switch (request.task) {
    case "compare":
      return b ? compareSystemPrompt(a, b, request.locale, request.level) : guideSystemPrompt(a, request.locale, request.level);
    case "story":
      return storySystemPrompt(a, request.locale);
    case "quiz":
      return quizSystemPrompt(a, request.locale);
    default:
      return guideSystemPrompt(a, request.locale, request.level);
  }
}

export function createAnthropicProvider(apiKey: string): AiProvider {
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  return {
    id: "anthropic",
    isOffline: false,

    async *stream(request, signal) {
      const stream = client.messages.stream(
        {
          model,
          max_tokens: 2048,
          system: [
            {
              type: "text",
              text: systemFor(request),
              // Konteks situs identik untuk setiap pertanyaan tentang situs
              // yang sama, jadi ia layak di-cache: percakapan lanjutan hanya
              // membayar penuh untuk pertanyaan barunya.
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          // Pertanyaan di sini dijawab dari konteks yang sudah disediakan,
          // bukan dari penalaran panjang. Effort rendah menjaga jawaban tetap
          // cepat dan murah tanpa kehilangan apa pun yang berarti.
          output_config: { effort: "low" },
        },
        { signal },
      );

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }

      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") {
        yield request.locale === "id"
          ? "\n\n[Permintaan ini tidak dapat dijawab.]"
          : "\n\n[This request could not be answered.]";
      }
    },
  };
}
