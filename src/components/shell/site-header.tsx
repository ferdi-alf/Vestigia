"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { LanguageToggle } from "./language-toggle";
import { NavPill } from "./nav-pill";

/**
 * Navigasi anchor, bukan lintas-halaman.
 *
 * Situs ini kini dua halaman: landing yang memuat seluruh cerita, dan
 * workspace 3D. Jadi "Jelajahi" tidak lagi menunjuk halaman lain — ia menunjuk
 * bagian dari halaman yang sedang dibaca. Prefiks `/` tetap ada supaya tautan
 * ini juga benar ketika diklik dari `/heritage/[slug]`.
 *
 * "Bandingkan" hilang dari sini karena ia bukan halaman lagi melainkan tab di
 * dalam Pemandu Budaya. Fiturnya tidak hilang; tempatnya yang berubah.
 */
const LINKS = [
  { href: "/#peta", key: "explore" },
  { href: "/#pemandu", key: "guide" },
  { href: "/#tentang", key: "about" },
] as const;

/** Seberapa jauh halaman digulir sebelum header memadat. */
const SOLID_AFTER = 80;

export function SiteHeader() {
  const { dict } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  /* Di landing, header mengambang di atas hero sampai halaman digulir; garis
     dan blur yang permanen akan memotong lanskap tepat di sepertiga atasnya.
     Keadaan itu ditulis langsung ke atribut DOM alih-alih ke state React:
     setState di dalam handler scroll berarti merender ulang pohon komponen
     setiap kali jari bergerak, untuk satu boolean yang berubah dua kali. */
  const overlay = pathname === "/";

  useEffect(() => {
    const node = headerRef.current;
    const bar = progressRef.current;
    if (!node) return;

    let queued = false;
    let solid: boolean | null = null;

    const apply = () => {
      queued = false;

      if (overlay) {
        const next = window.scrollY > SOLID_AFTER;
        if (next !== solid) {
          solid = next;
          node.dataset.solid = String(next);
        }
      }

      /* Garis kemajuan baca. Ditulis sebagai `scaleX` ke gaya inline, bukan
         lewat state — sama alasannya dengan keadaan padat di atas. `transform`
         juga satu-satunya properti yang boleh disentuh di jalur panas; menggeser
         `width` di sini berarti tata letak dihitung ulang tiap frame scroll. */
      if (bar) {
        const span = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0;
        bar.style.transform = `scaleX(${ratio})`;
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    if (!overlay) node.dataset.solid = "true";
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [overlay]);

  /* Route konsep membawa navbar mengambangnya sendiri — tiga versi berbeda,
     dan membandingkannya adalah seluruh maksud halaman-halaman itu. Dua
     navbar bertumpuk akan membuat perbandingan itu mustahil.

     Ditaruh setelah SELURUH hook di atas, bukan di awal komponen: urutan
     pemanggilan hook tidak boleh berubah antar render, dan `pathname` berubah
     saat navigasi. */
  if (pathname.startsWith("/concepts")) return null;

  /* Menu ponsel ditutup di `onClick` tiap tautannya, bukan lewat efek yang
     memantau `pathname`. Efek yang memanggil `setOpen` di badannya memicu
     render bertingkat, dan React memperingatkannya — sementara penutupannya
     memang sudah terjadi tepat di tempat kejadiannya. */

  return (
    <header
      ref={headerRef}
      data-solid={overlay ? "false" : "true"}
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500",
        "border-b border-transparent data-[solid=true]:border-line/70",
        "data-[solid=true]:bg-paper/85 data-[solid=true]:backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Lockup merek. Tanda koordinat kecil di kiri nama — motif
            `coordinate-mark`, yang sama dengan yang menandai titik di peta
            dunia. Ia membuat namanya terbaca sebagai entri survei, bukan
            sebagai logo startup. */}
        <Link href="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span
            aria-hidden="true"
            className="h-4 w-px bg-gold transition-transform duration-500 group-hover:scale-y-150"
          />
          <span className="font-display text-2xl font-normal tracking-tight text-ink">
            {dict.brand}
          </span>
          <span className="hidden text-[0.7rem] tracking-[0.18em] text-ink-dim transition-colors group-hover:text-ink-muted sm:inline">
            3D
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <NavPill key={link.href} href={link.href} active={isActive(link.href)}>
              {link.key === "guide" ? dict.ai.guide : dict.nav[link.key]}
            </NavPill>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? dict.nav.closeMenu : dict.nav.menu}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-line-strong text-ink-muted transition-colors hover:border-ink-dim hover:text-ink md:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Kemajuan baca. Satu garis rambut emas, `origin-left`, dan skalanya
          ditulis handler scroll di atas. Ia menceritakan sesuatu — seberapa
          jauh halaman sudah ditempuh — jadi ia bukan animasi dekoratif. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden"
      >
        <div ref={progressRef} className="h-full w-full origin-left scale-x-0 bg-gold" />
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-t border-line bg-surface md:hidden"
        >
          <ul className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors",
                    isActive(link.href) ? "text-gold" : "text-ink-muted hover:text-ink",
                  )}
                >
                  {/* carved-edge yang memanjang pada halaman yang sedang dibuka.
                      Di layar sempit tidak ada hover untuk menandai apa pun, jadi
                      penanda "di sini" harus terbaca tanpa disentuh. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-px w-6 origin-left bg-gold transition-transform duration-300",
                      /* Panjangnya lewat `scaleX`, bukan lewat `w-`: dua kelas
                         lebar yang bertukar adalah properti layout yang
                         dianimasikan, dan itu dilarang. */
                      isActive(link.href) ? "scale-x-100" : "scale-x-[0.33] opacity-40",
                    )}
                  />
                  {link.key === "guide" ? dict.ai.guide : dict.nav[link.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
