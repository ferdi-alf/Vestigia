import { cn } from "@/lib/cn";

/**
 * Keadaan kosong yang disengaja.
 *
 * Koleksi berangkat dari nol dan bertambah seiring asset 3D masuk, jadi
 * "belum ada apa-apa" adalah keadaan normal yang harus terlihat rapi —
 * bukan halaman rusak.
 */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "panel flex flex-col items-center px-6 py-16 text-center sm:py-24",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-line-strong text-ink-dim"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.25">
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" strokeLinejoin="round" />
          <path d="M4 7.5l8 4.5 8-4.5M12 12v9" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
