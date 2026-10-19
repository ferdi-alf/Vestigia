/**
 * Penyedia Groq.
 *
 * Endpoint Groq setara OpenAI, dan protokolnya SSE biasa di atas HTTP — jadi
 * `fetch` sudah cukup dan tidak ada SDK yang perlu dipasang. Itu bukan
 * penghematan: aturan project melarang dependency baru selama yang terpasang
 * masih menjawab kebutuhannya, dan di sini ia menjawab penuh.
 *
 * Dua hal yang membedakan berkas ini dari penyedia lain, dan keduanya penting:
 *
 * 1. **Hanya `delta.content` yang diteruskan.** Model gpt-oss mengalirkan
 *    penalarannya pada `delta.reasoning`, bidang yang berbeda. Meneruskan
 *    keduanya akan menumpahkan proses berpikir model ke dalam jawaban yang
 *    dibaca pengunjung — bocoran yang terlihat seperti kerusakan, dan pada
 *    aplikasi warisan budaya ia juga menampilkan dugaan sebagai keterangan.
 * 2. **Kegagalan HTTP dibaca dan dilaporkan apa adanya.** Kunci yang kedaluwarsa
 *    atau kuota yang habis mengembalikan 4xx dengan badan JSON; tanpa dibaca,
 *    gejalanya di layar hanya "jawaban kosong" tanpa sebab yang terlihat.
 */
import type { AiProvider, AiRequest } from "../types";
import {
  compareSystemPrompt,
  guideSystemPrompt,
  quizSystemPrompt,
  storySystemPrompt,
} from "../grounding";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

function systemFor(request: AiRequest): string {
  const [a, b] = request.heritage;
  switch (request.task) {
    case "compare":
      return b
        ? compareSystemPrompt(a, b, request.locale, request.level)
        : guideSystemPrompt(a, request.locale, request.level);
    case "story":
      return storySystemPrompt(a, request.locale);
    case "quiz":
      return quizSystemPrompt(a, request.locale);
    default:
      return guideSystemPrompt(a, request.locale, request.level);
  }
}

export function createGroqProvider(apiKey: string): AiProvider {
  const model = process.env.GROQ_MODEL ?? DEFAULT_MODEL;

  return {
    id: "groq",
    isOffline: false,

    async *stream(request, signal) {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          /* Jawaban di sini dirakit dari konteks yang sudah disediakan, bukan
             dari penalaran panjang. Effort rendah menjaganya cepat tanpa
             kehilangan apa pun yang berarti. */
          reasoning_effort: "low",
          temperature: 0.3,
          max_completion_tokens: 2048,
          messages: [
            { role: "system", content: systemFor(request) },
            ...request.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Groq menolak permintaan: ${response.status} ${response.statusText} ${detail.slice(0, 400)}`,
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        /* SSE dipisah baris. Potongan terakhir disimpan karena ia bisa
           terbelah di tengah antara dua paket jaringan. */
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (payload === "[DONE]") return;

          try {
            const parsed = JSON.parse(payload);
            /* Sengaja HANYA content. `reasoning` tidak pernah diteruskan. */
            const text = parsed?.choices?.[0]?.delta?.content;
            if (typeof text === "string" && text) yield text;
          } catch {
            /* Baris keep-alive atau komentar SSE — bukan kegagalan. */
          }
        }
      }
    },
  };
}
