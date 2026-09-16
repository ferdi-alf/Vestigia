import { cn } from "@/lib/cn";

/**
 * Kepala halaman untuk seluruh rute non-landing.
 *
 * Satu bentuk yang dipakai berulang, bukan satu per halaman: itu yang membuat
 * `/explore`, `/compare`, dan `/about` terbaca sebagai satu situs alih-alih tiga
 * halaman yang kebetulan berdekatan.
 *
 * Membawa dua motif. `coordinate-mark` sebagai centang kecil di kiri kicker —
 * penanda survei yang sama dengan yang ada di peta dunia. `carved-edge` sebagai
 * guratan emas di bawah judul, tempat cahaya menyentuh tepi pahatan.
 */
export function PageHeader({
  kicker,
  title,
  lead,
  className,
  children,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12",
        className,
      )}
    >
      <div className="max-w-2xl">
        {kicker ? (
          <p className="kicker flex items-center gap-2.5">
            <span aria-hidden="true" className="h-3 w-px shrink-0 bg-gold" />
            {kicker}
          </p>
        ) : null}

        <h1 className="mt-5 font-display text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
          {title}
        </h1>

        <span aria-hidden="true" className="carved-edge mt-6" />

        {lead ? (
          <p className="mt-6 text-base leading-relaxed text-ink-muted sm:text-lg">{lead}</p>
        ) : null}
      </div>

      {children ? <div className="flex-none">{children}</div> : null}
    </div>
  );
}
