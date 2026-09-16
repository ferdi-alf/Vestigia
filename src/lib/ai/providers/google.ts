/**
 * Penyedia Gemini.
 *
 * Dipanggil lewat REST, bukan lewat SDK Google. Alasannya sederhana: penyedia
 * ini adalah pilihan cadangan, dan menambah satu SDK penuh ke bundle untuk
 * sesuatu yang mungkin tidak pernah dipakai bertentangan dengan prinsip
 * menahan dependensi. Permukaan yang dipakai di sini hanya satu endpoint
 * streaming, dan itu tidak cukup untuk membayar biaya sebuah paket.
 */
import type { AiProvider, AiRequest } from "../types";
import {
  compareSystemPrompt,
  guideSystemPrompt,
  quizSystemPrompt,
  storySystemPrompt,
} from "../grounding";

const DEFAULT_MODEL = "gemini-2.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

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

interface GeminiChunk {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export function createGoogleProvider(apiKey: string): AiProvider {
  const model = process.env.GOOGLE_MODEL ?? DEFAULT_MODEL;

  return {
    id: "google",
    isOffline: false,

    async *stream(request, signal) {
      const response = await fetch(
        `${ENDPOINT}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemFor(request) }] },
            contents: request.messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
          }),
        },
      );

      if (!response.ok || !response.body) {
        throw new Error(`Gemini merespons ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE: peristiwa dipisah baris kosong, muatannya diawali "data: ".
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const line = event.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const chunk = JSON.parse(payload) as GeminiChunk;
            const text = chunk.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
            if (text) yield text;
          } catch {
            // Potongan JSON yang belum utuh; abaikan dan tunggu sisanya.
          }
        }
      }
    },
  };
}
