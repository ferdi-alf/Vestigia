"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";

export function SiteFooter() {
  const { dict } = useI18n();
  const pathname = usePathname();

  /* Sama alasannya dengan SiteHeader: tiap konsep menutup halamannya dengan
     caranya sendiri, dan footer situs utama yang menempel di bawah ketiganya
     akan menyamarkan justru bagian yang paling harus dibandingkan. */
  if (pathname.startsWith("/concepts")) return null;

  return (
    <footer className="border-t border-line/70 bg-void">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md">
          <p className="font-display text-xl text-ink">{dict.brand}</p>
          <p className="mt-1 text-sm text-ink-muted">{dict.tagline}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/#peta" className="text-sm text-ink-muted transition-colors hover:text-ink">
            {dict.nav.explore}
          </Link>
          <Link href="/#pemandu" className="text-sm text-ink-muted transition-colors hover:text-ink">
            {dict.ai.guide}
          </Link>
          <Link href="/#tentang" className="text-sm text-ink-muted transition-colors hover:text-ink">
            {dict.nav.about}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
