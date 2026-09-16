import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { buttonClass } from "@/components/ui/button";

export default async function NotFound() {
  const { dict } = await getI18n();

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:py-32">
      <p className="kicker">404</p>
      <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{dict.common.notFound}</h1>
      <p className="mt-4 text-base leading-relaxed text-ink-muted">{dict.common.notFoundBody}</p>
      <Link
        href="/"
        className={buttonClass({ className: "mt-8" })}
      >
        {dict.common.backHome}
      </Link>
    </div>
  );
}
