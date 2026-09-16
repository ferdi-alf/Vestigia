/**
 * Pemilihan penyedia AI.
 *
 * Aplikasi tidak pernah menyebut penyedia tertentu. Ia meminta penyedia yang
 * aktif, dan lapisan ini memutuskannya dari variabel lingkungan. Tanpa kunci
 * apa pun, aplikasi jatuh ke penyedia luring yang merakit jawaban langsung
 * dari basis pengetahuan — tetap berfungsi penuh, hanya lebih sederhana.
 */
import type { AiProvider } from "./types";
import { groundedProvider } from "./providers/grounded";

let cached: AiProvider | null = null;

/**
 * Asinkron karena impor penyedianya dinamis, dan itu disengaja: SDK Anthropic
 * hanya diunduh dan dieksekusi kalau kuncinya benar-benar dipasang. Instalasi
 * tanpa kunci tidak pernah menyentuhnya sama sekali.
 */
export async function getProvider(): Promise<AiProvider> {
  if (cached) return cached;

  const requested = process.env.AI_PROVIDER;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;

  // Permintaan eksplisit menang, selama kuncinya benar-benar ada.
  if (requested === "grounded") {
    cached = groundedProvider;
  } else if ((requested === "anthropic" || !requested) && anthropicKey) {
    const { createAnthropicProvider } = await import("./providers/anthropic");
    cached = createAnthropicProvider(anthropicKey);
  } else if ((requested === "google" || !requested) && googleKey) {
    const { createGoogleProvider } = await import("./providers/google");
    cached = createGoogleProvider(googleKey);
  } else {
    cached = groundedProvider;
  }

  return cached;
}

export { groundedProvider };
export type { AiProvider, AiRequest, KnowledgeLevel } from "./types";
