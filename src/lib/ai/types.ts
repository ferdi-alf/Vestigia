/**
 * Kontrak lapisan AI.
 *
 * Seluruh fitur AI berbicara ke antarmuka ini, bukan ke satu penyedia tertentu.
 * Konsekuensinya: memasang kunci API baru, atau berpindah penyedia, tidak
 * menyentuh satu pun komponen antarmuka atau route handler.
 */
import type { Heritage, Locale } from "@/data/types";

/** Kedalaman penjelasan yang diminta pengguna. */
export type KnowledgeLevel = "child" | "general" | "deep";

export type AiTask = "guide" | "quiz" | "compare" | "story";

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiRequest {
  task: AiTask;
  locale: Locale;
  /** situs yang sedang dilihat; dua situs untuk perbandingan */
  heritage: Heritage[];
  /** riwayat percakapan, terbaru terakhir */
  messages: AiMessage[];
  level: KnowledgeLevel;
}

export interface AiProvider {
  /** nama yang ditampilkan di antarmuka, mis. "offline" */
  readonly id: string;
  /** true kalau jawaban dirakit tanpa layanan AI eksternal */
  readonly isOffline: boolean;
  stream(request: AiRequest, signal?: AbortSignal): AsyncIterable<string>;
}

/** Soal kuis, bentuknya sama baik digenerate model maupun dirakit basis pengetahuan. */
export interface QuizQuestion {
  question: string;
  choices: string[];
  /** indeks jawaban benar pada `choices` */
  answer: number;
  explanation: string;
}
