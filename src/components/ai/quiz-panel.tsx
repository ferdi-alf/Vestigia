"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Heritage } from "@/data/types";
import { useI18n } from "@/lib/i18n/client";
import type { QuizQuestion } from "@/lib/ai/types";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { readTokens } from "@/lib/read-tokens";

type Phase = "idle" | "loading" | "playing" | "done";

/**
 * Kuis.
 *
 * Soal digenerate dari basis pengetahuan situs, bukan disimpan statis. Dua
 * alasan: konten tidak terduplikasi antara data dan bank soal, dan kuis tidak
 * mengulang soal yang sama pada percobaan kedua.
 */
/** Soal disusun di server dari `slug`. */
export type QuizSite = Pick<Heritage, "slug">;

export function QuizPanel({ heritage }: { heritage: QuizSite }) {
  const { locale, dict } = useI18n();
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [offline, setOffline] = useState(false);

  /* Warna konfeti dibaca dari token yang berlaku pada panel INI, bukan
     ditulis sebagai hex. Kanvas tidak mengerti `var(--color-gold)`, jadi
     nilainya harus diselesaikan lebih dulu — pola yang sama dengan globe dan
     latar strata. */
  const panel = useRef<HTMLElement>(null);
  const [festive, setFestive] = useState<string[]>([]);

  useEffect(() => {
    const node = panel.current;
    if (!node) return;
    const t = readTokens(node, {
      gold: "--color-gold",
      bronze: "--color-bronze",
      ember: "--color-ember",
      line: "--color-line-strong",
    });
    setFestive([t.gold, t.bronze, t.ember, t.line].filter(Boolean));
  }, []);

  const start = useCallback(async () => {
    setPhase("loading");
    try {
      const response = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: heritage.slug, locale }),
      });
      const data = (await response.json()) as { questions?: QuizQuestion[]; offline?: boolean };
      if (!data.questions?.length) throw new Error("kosong");

      setQuestions(data.questions);
      setOffline(Boolean(data.offline));
      setIndex(0);
      setPicked(null);
      setCorrect(0);
      setPhase("playing");
    } catch {
      setPhase("idle");
    }
  }, [heritage.slug, locale]);

  const choose = (choice: number) => {
    if (picked !== null) return;
    setPicked(choice);
    if (choice === questions[index].answer) setCorrect((n) => n + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const question = questions[index];

  return (
    <section ref={panel} className="panel relative p-5" aria-label={dict.ai.quiz}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl text-ink">{dict.ai.quiz}</h2>
        {phase === "playing" ? (
          <p className="text-xs text-ink-dim">
            {index + 1} / {questions.length}
          </p>
        ) : null}
      </div>

      {phase === "idle" ? (
        <button
          type="button"
          onClick={start}
          className={buttonClass({ className: "mt-4" })}
        >
          {dict.ai.quizStart}
        </button>
      ) : null}

      {phase === "loading" ? (
        <p className="mt-4 text-sm text-ink-dim" role="status">
          {dict.common.loading}
        </p>
      ) : null}

      {phase === "playing" && question ? (
        <div className="mt-4">
          <p className="text-base leading-relaxed text-ink">{question.question}</p>

          <ul className="mt-4 space-y-2">
            {question.choices.map((choice, choiceIndex) => {
              const isAnswer = choiceIndex === question.answer;
              const isPicked = choiceIndex === picked;
              const revealed = picked !== null;

              return (
                <li key={choice}>
                  <button
                    type="button"
                    onClick={() => choose(choiceIndex)}
                    disabled={revealed}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      !revealed && "border-line text-ink-soft hover:border-line-strong hover:text-ink",
                      revealed && isAnswer && "border-gold bg-gold/18 text-ink",
                      revealed && isPicked && !isAnswer && "border-ember/70 bg-ember/15 text-ink-muted",
                      revealed && !isAnswer && !isPicked && "border-line text-ink-dim",
                    )}
                  >
                    {choice}
                  </button>
                </li>
              );
            })}
          </ul>

          {picked !== null ? (
            <div className="mt-4">
              <p className="text-sm leading-relaxed text-ink-muted">{question.explanation}</p>
              <button
                type="button"
                onClick={next}
                className={buttonClass({ variant: "secondary", className: "mt-4" })}
              >
                {index + 1 >= questions.length ? dict.common.close : dict.ai.quizNext}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="relative mt-4">
          {/* Konfeti hanya saat ada yang benar. Merayakan nol jawaban benar
              terbaca sebagai ejekan, bukan sebagai perayaan.

              Kanvasnya `fixed` seukuran jendela — lihat catatan di komponennya.
              Ia tetap dirender dari sini supaya ikut naik ke top layer bersama
              dialognya. */}
          {correct > 0 && festive.length > 0 ? <Confetti colors={festive} /> : null}

          <p className="font-display text-3xl text-gold">
            {dict.ai.quizScore(correct, questions.length)}
          </p>

          {/* Benar dan SALAH, berdampingan.

              Skor tunggal "3 dari 5" sudah memuat keduanya secara aritmetika,
              tetapi memaksa pembacanya mengurangi sendiri. Yang ingin diketahui
              orang setelah kuis adalah berapa yang meleset, dan angka itu layak
              berdiri sendiri. */}
          <dl className="relative z-20 mt-4 flex gap-3">
            <div className="flex-1 rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-2.5">
              <dt className="text-[0.58rem] leading-none tracking-[0.18em] text-ink-dim uppercase">
                {dict.ai.quizCorrect}
              </dt>
              <dd className="mt-1.5 font-display text-2xl leading-none tabular-nums text-ink">
                {correct}
              </dd>
            </div>
            <div className="flex-1 rounded-xl border border-line px-3.5 py-2.5">
              <dt className="text-[0.58rem] leading-none tracking-[0.18em] text-ink-dim uppercase">
                {dict.ai.quizWrong}
              </dt>
              <dd className="mt-1.5 font-display text-2xl leading-none tabular-nums text-ink-muted">
                {questions.length - correct}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={start}
            className={buttonClass({ variant: "secondary", className: "relative z-20 mt-4" })}
          >
            {dict.ai.quizRestart}
          </button>
        </div>
      ) : null}

      {offline && phase !== "idle" ? (
        <p className="mt-4 border-t border-line pt-3 text-[0.7rem] leading-relaxed text-ink-dim">
          {dict.ai.offline} — {dict.ai.offlineNote}
        </p>
      ) : null}
    </section>
  );
}
