"use client";

import { useCallback, useRef, useState } from "react";
import { SECTION_MEDIA } from "@/data/landing-media";
import type { Heritage } from "@/data/types";
import { useI18n } from "@/lib/i18n/client";
import { useSectionReveal } from "@/lib/motion/use-section-reveal";
import { cn } from "@/lib/cn";
import { MediaLayer, IllustrationNote, hasMedia } from "./media-layer";

const BACKDROP = SECTION_MEDIA.find((slot) => slot.id === "ai-backdrop")!;

export type ShowcaseSite = Pick<Heritage, "slug" | "name" | "sources">;

/**
 * Peragaan Pemandu Budaya.
 *
 * Jawabannya sungguhan: route yang sama, prompt yang sama, dan pembatas yang
 * sama dengan yang dipakai halaman warisan. Tidak ada transkrip yang ditulis
 * lebih dulu.
 *
 * Pertanyaan ketiga sengaja tidak punya jawaban di dalam data, dan itulah
 * peragaan yang sebenarnya. Mengaku "AI kami tidak mengarang" mudah; menaruh
 * tombol yang membuktikannya di depan penilai adalah hal yang berbeda.
 *
 * Tidak pernah berjalan sendiri. Membuka landing tidak memanggil model apa pun —
 * kuota dan tagihan hanya bergerak kalau ada yang benar-benar bertanya.
 */
export function AiShowcase({ site }: { site: ShowcaseSite }) {
  const { locale, dict } = useI18n();
  const root = useRef<HTMLElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [asked, setAsked] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useSectionReveal(root, [site.slug]);

  const questions = dict.landing.aiQuestions(site.name[locale]);

  const ask = useCallback(
    async (index: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setAsked(index);
      setAnswer("");
      setFailed(false);
      setBusy(true);

      try {
        const response = await fetch("/api/ai/guide", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            slug: site.slug,
            locale,
            level: "general",
            messages: [{ role: "user", content: questions[index] }],
          }),
        });

        if (!response.ok || !response.body) throw new Error(String(response.status));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let text = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setAnswer(text);
        }
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") setFailed(true);
      } finally {
        setBusy(false);
      }
    },
    [locale, questions, site.slug],
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      <MediaLayer slot={BACKDROP} sizes="100vw" />
      <div
        aria-hidden="true"
        className="scrim-spread pointer-events-none absolute inset-0"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-28">
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p data-reveal className="kicker">
              {dict.landing.aiKicker}
            </p>
            <h2
              data-reveal
              className="mt-6 font-display text-4xl leading-[1.08] text-ink sm:text-5xl"
            >
              {dict.landing.aiTitle}
            </h2>
            <p data-reveal className="mt-6 text-base leading-relaxed text-ink-muted">
              {dict.landing.aiLead}
            </p>
            <p
              data-reveal
              className="mt-8 border-l border-gold-dim pl-5 text-sm leading-relaxed text-ink-soft"
            >
              {dict.landing.aiHonestNote}
            </p>
          </div>

          <div data-reveal className="lg:col-span-6 lg:col-start-7">
            <p className="text-xs tracking-[0.14em] text-ink-dim uppercase">
              {dict.landing.aiTryTitle}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {questions.map((question, index) => {
                const outOfScope = index === questions.length - 1;
                return (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void ask(index)}
                    disabled={busy}
                    aria-pressed={asked === index}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:opacity-60",
                      asked === index
                        ? "border-gold-dim bg-gold/18 text-ink"
                        : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
                    )}
                  >
                    <span className="flex-1">{question}</span>
                    {outOfScope ? (
                      <span className="shrink-0 rounded-full border border-ember/60 px-2 py-0.5 text-[0.6rem] tracking-wide text-ember">
                        {dict.landing.aiHonestLabel}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="panel mt-4 min-h-40 p-5">
              <div aria-live="polite" aria-atomic="false">
                {failed ? (
                  <p className="text-sm text-ember">{dict.ai.error}</p>
                ) : answer ? (
                  <p className="text-sm leading-[1.75] whitespace-pre-wrap text-ink-soft">
                    {answer}
                  </p>
                ) : busy ? (
                  <p className="text-sm text-ink-dim">{dict.ai.thinking}</p>
                ) : (
                  <p className="text-sm text-ink-dim">{dict.landing.aiIdle}</p>
                )}
              </div>

              {answer && !busy ? (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-[0.65rem] tracking-[0.14em] text-ink-dim uppercase">
                    {dict.landing.aiSources}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {site.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-ink-muted underline-offset-4 transition-colors hover:text-gold hover:underline"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <IllustrationNote
              show={hasMedia(BACKDROP)}
              label={dict.landing.illustration}
              className="mt-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
