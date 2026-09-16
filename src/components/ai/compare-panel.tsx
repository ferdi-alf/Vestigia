"use client";

import { useCallback, useRef, useState } from "react";
import type { Heritage } from "@/data/types";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";

/**
 * Perbandingan dua situs.
 *
 * Nilai fitur ini bukan pada menampilkan dua kolom data berdampingan — itu
 * bisa dilakukan tanpa AI. Nilainya pada menjelaskan mengapa dua bangunan
 * dari peradaban yang tidak pernah bertemu bisa memecahkan masalah yang sama
 * dengan cara berbeda, atau masalah berbeda dengan cara yang mirip.
 */
/** Hanya tiga field ini yang dibaca. Menyempitkannya berarti landing tidak
    perlu mengirim lima belas record penuh ke peramban. */
export type CompareSite = Pick<Heritage, "slug" | "name" | "country">;

export function ComparePanel({ heritage }: { heritage: CompareSite[] }) {
  const { locale, dict } = useI18n();
  const [a, setA] = useState(heritage[0]?.slug ?? "");
  const [b, setB] = useState(heritage[1]?.slug ?? "");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!a || !b || a === b || busy) return;

    setBusy(true);
    setAnswer("");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ a, b, locale, level: "general" }),
      });

      setOffline(response.headers.get("x-ai-offline") === "true");
      if (!response.ok || !response.body) throw new Error(String(response.status));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAnswer(text);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") setAnswer(dict.ai.error);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [a, b, busy, dict.ai.error, locale]);

  const options = (exclude: string) =>
    heritage
      .filter((h) => h.slug !== exclude)
      .map((h) => (
        <option key={h.slug} value={h.slug}>
          {h.name[locale]} — {h.country[locale]}
        </option>
      ));

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        <label className="block">
          <span className="kicker">A</span>
          <select
            value={a}
            onChange={(event) => setA(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-line-strong focus:outline-none"
          >
            {options(b)}
          </select>
        </label>

        <span aria-hidden="true" className="hidden pb-3 text-center text-ink-dim sm:block">
          ·
        </span>

        <label className="block">
          <span className="kicker">B</span>
          <select
            value={b}
            onChange={(event) => setB(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-line-strong focus:outline-none"
          >
            {options(a)}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={busy || !a || !b || a === b}
        className={cn(
          buttonClass({ className: "mt-6" }),
          "hover:bg-gold-soft disabled:opacity-40",
        )}
      >
        {busy ? dict.ai.thinking : dict.ai.compareRun}
      </button>

      {answer ? (
        <div className="panel mt-8 p-6">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-ink-soft">{answer}</p>
          {offline ? (
            <p className="mt-5 border-t border-line pt-3 text-[0.7rem] leading-relaxed text-ink-dim">
              {dict.ai.offline} — {dict.ai.offlineNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
