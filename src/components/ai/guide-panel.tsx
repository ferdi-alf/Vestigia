"use client";

import { useCallback, useRef, useState } from "react";
import type { Heritage } from "@/data/types";
import { useI18n } from "@/lib/i18n/client";
import type { KnowledgeLevel } from "@/lib/ai/types";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import { RichText } from "@/components/ai/rich-text";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const LEVELS: KnowledgeLevel[] = ["child", "general", "deep"];

/**
 * Pemandu budaya.
 *
 * Yang membedakannya dari kotak obrolan biasa ada dua. Pertama, ia terikat
 * pada satu situs: pertanyaan dijawab dari data situs yang sedang dilihat,
 * dan pertanyaan di luar itu dijawab dengan "tidak ada dalam data" alih-alih
 * ditebak. Kedua, kedalaman penjelasan bisa dipilih — halaman yang sama
 * melayani anak sepuluh tahun dan orang yang sudah membaca tentang situs itu.
 */
/** Grounding terjadi di server dari `slug`; klien hanya butuh saran pertanyaan. */
export type GuideSite = Pick<Heritage, "slug" | "keyFeatures">;

export function GuidePanel({ heritage }: { heritage: GuideSite }) {
  const { locale, dict } = useI18n();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<KnowledgeLevel>("general");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || busy) return;

      const history = [...turns, { role: "user" as const, content: trimmed }];
      setTurns([...history, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/ai/guide", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ slug: heritage.slug, locale, level, messages: history }),
        });

        setOffline(response.headers.get("x-ai-offline") === "true");

        if (!response.ok || !response.body) throw new Error(String(response.status));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          // Tulis ke giliran terakhir saja; giliran sebelumnya tidak berubah.
          setTurns([...history, { role: "assistant", content: answer }]);
          logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setTurns([...history, { role: "assistant", content: dict.ai.error }]);
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, dict.ai.error, heritage.slug, level, locale, turns],
  );

  /* Pertanyaan pembuka diambil dari fitur situs itu sendiri, bukan daftar
     umum — jadi ia selalu relevan dan selalu terjawab oleh data. */
  const starters = heritage.keyFeatures.slice(0, 3).map((f) =>
    locale === "id"
      ? `Jelaskan ${f.title.id.toLowerCase()}`
      : `Explain the ${f.title.en.toLowerCase()}`,
  );

  return (
    <section className="panel flex flex-col overflow-hidden" aria-label={dict.ai.guide}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-xl text-ink">{dict.ai.guide}</h2>
          <p className="mt-0.5 text-xs text-ink-dim">{dict.ai.guideLead}</p>
        </div>

        <div role="group" aria-label={dict.ai.level} className="flex rounded-full border border-line p-0.5">
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLevel(option)}
              aria-pressed={level === option}
              className={cn(
                "flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-xs transition-colors",
                level === option ? "bg-gold text-on-gold" : "text-ink-muted hover:text-ink",
              )}
            >
              {dict.ai.levels[option]}
            </button>
          ))}
        </div>
      </header>

      <div ref={logRef} className="max-h-96 min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {turns.length === 0 ? (
          <div className="space-y-2">
            {starters.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => ask(starter)}
                className="block w-full rounded-lg border border-line px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                {starter}
              </button>
            ))}
          </div>
        ) : (
          turns.map((turn, index) => (
            <div key={index} className={turn.role === "user" ? "text-right" : ""}>
              {/* Yang diketik pengunjung tampil apa adanya — ia tidak menulis
                  Markdown, dan menafsirkannya hanya akan memakan tanda bintang
                  yang memang ia maksudkan. Balasan model yang dirender. */}
              {turn.role === "user" ? (
                <p className="inline-block max-w-[90%] whitespace-pre-wrap rounded-lg bg-raised px-3 py-2 text-sm leading-relaxed text-ink">
                  {turn.content}
                </p>
              ) : turn.content ? (
                <div className="max-w-[90%] px-3 py-2 text-sm">
                  <RichText text={turn.content} />
                </div>
              ) : busy && index === turns.length - 1 ? (
                <p className="px-3 py-2 text-sm leading-relaxed text-ink-dim">{dict.ai.thinking}</p>
              ) : null}
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask(input);
        }}
        className="flex items-center gap-2 border-t border-line px-5 py-3"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={dict.ai.placeholder}
          aria-label={dict.ai.placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            className={buttonClass({ variant: "secondary", size: "sm", className: "px-4 text-xs" })}
          >
            {dict.ai.stop}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className={buttonClass({ size: "sm", className: "px-4 text-xs" })}
          >
            {dict.ai.ask}
          </button>
        )}
      </form>

      {offline ? (
        <p className="border-t border-line px-5 py-2 text-[0.7rem] leading-relaxed text-ink-dim">
          {dict.ai.offline} — {dict.ai.offlineNote}
        </p>
      ) : null}
    </section>
  );
}
