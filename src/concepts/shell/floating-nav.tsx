"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/button";
import { LanguageToggle } from "@/components/shell/language-toggle";

/** Seberapa jauh halaman digulir sebelum navbar memadat. */
const SOLID_AFTER = 60;

export type NavVariant = "a" | "b" | "c";

/**
 * Dua anchor, ABSOLUT dari akar.
 *
 * Absolut dan bukan `#yang-hilang` telanjang karena navbar yang sama dipakai
 * `/heritage/[slug]`. Anchor relatif di sana menunjuk elemen di halaman ITU,
 * yang tidak ada — jadi tautannya mati justru di halaman tempat orang paling
 * mungkin ingin kembali.
 *
 * Tinggal dua karena landing tinggal tiga babak, dan babak pertama tidak butuh
 * tautan: ia yang sedang dilihat saat navbar pertama kali terbaca.
 */
const LINKS = [
  { href: "/#yang-hilang", key: "lost" },
  { href: "/#dunia", key: "explore" },
] as const;

/**
 * Navbar mengambang, dipakai ketiga konsep.
 *
 * Satu perilaku, tiga pakaian. Yang dibagikan cuma mekanismenya — lebar
 * `--shell` yang sama dengan isi halaman, dan keadaan padat yang ditulis
 * langsung ke atribut DOM. Sisanya berbeda per konsep, karena navbar adalah
 * hal PERTAMA yang dilihat penilai dan tiga navbar identik akan langsung
 * membocorkan bahwa ketiganya satu desain yang di-skin.
 *
 * Lebarnya `var(--shell)` — nilai yang sama persis dengan yang dipakai peta
 * dunia dan section "Penjelajah". Itulah "hubungan visual dengan container
 * utama" yang diminta: bukan kemiripan, melainkan tepi yang sama.
 *
 * `setState` tidak pernah dipanggil di dalam handler scroll. Satu boolean yang
 * berubah dua kali seumur halaman tidak layak merender ulang pohon komponen
 * setiap kali jari bergerak, jadi ia ditulis ke `dataset` lewat rAF.
 */
export function FloatingNav({
  variant,
  ctaHref = "/#dunia",
}: {
  variant: NavVariant;
  /**
   * Tujuan tombol ajakan.
   *
   * Prop, bukan konstanta, karena tujuannya adalah halaman object warisan
   * unggulan — dan slug-nya datang dari registry lewat `featuredHeritage()`.
   * Memakunya di sini berarti navbar memutuskan situs mana yang unggulan, yang
   * bukan urusannya. Bawaannya section Dunia, supaya konsep B dan C yang tidak
   * mengirimnya tetap mendarat di suatu tempat yang nyata.
   */
  ctaHref?: string;
}) {
  const { dict } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let queued = false;
    let solid: boolean | null = null;

    const apply = () => {
      queued = false;

      const next = window.scrollY > SOLID_AFTER;
      if (next !== solid) {
        solid = next;
        node.dataset.solid = String(next);
      }

      /* Hanya konsep C yang menampilkan kemajuan, dan hanya C yang membayar
         pembacaannya. `scrollHeight` adalah pembacaan tata letak; melakukannya
         untuk dua konsep yang tidak menampilkannya adalah biaya murni. */
      const bar = progressRef.current;
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

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    /* `h-0` — navbar MENUMPANG, tidak memakan tinggi.

       Ini sibling sebelum `{children}` di `ConceptFrame`, dan elemen `sticky`
       tetap memakan ruang aliran. Akibatnya section pertama tiap konsep mulai
       sekitar 76px di bawah puncak halaman, dan panggung lengket setinggi
       `h-svh` di dalamnya duduk di posisi alaminya — menyisakan pita kosong di
       atas sampai pengunjung menggulir lewat 76px dan ia menempel ke `top: 0`.

       Dengan tinggi nol ia berhenti menggeser apa pun sementara jangkauan
       sticky-nya tidak berubah: ia tetap anak pertama `concept-ground`, jadi ia
       tetap menempel sepanjang halaman persis seperti sebelumnya.

       `data-nav-shell` adalah TITIK TAMBAT, bukan perilaku.

       Navbar tinggal di luar section mana pun — ia saudara `Dive` di dalam
       `ConceptFrame` — jadi film penyelaman tidak bisa menjangkaunya lewat
       selektor ber-scope. Atribut ini yang membuatnya bisa ditemukan, dan
       satu-satunya yang menganimasikan `transform`-nya adalah film itu.
       `data-solid` di bawah menulis `dataset`, bukan `transform`, jadi tidak
       ada dua sistem yang berebut properti yang sama. */
    <div data-nav-shell className="pointer-events-none sticky top-3 z-40 h-0 sm:top-5">
      <nav
        ref={ref}
        aria-label="Primary"
        data-solid="false"
        className={cn(
          "shell pointer-events-auto flex items-center gap-4",
          "transition-[background-color,border-color,box-shadow] duration-500",
          variant === "a" && [
            "h-14 rounded-full border border-transparent px-5",
            "data-[solid=true]:border-line data-[solid=true]:bg-surface/72 data-[solid=true]:backdrop-blur-lg",
          ],
          variant === "b" && [
            "h-16 rounded-lg border border-line-strong/45 bg-paper/92 px-5 backdrop-blur-sm",
            "data-[solid=true]:border-line-strong/70",
          ],
          variant === "c" && [
            "h-14 rounded-2xl border border-line bg-surface/90 px-4 backdrop-blur-md",
            "data-[solid=true]:border-line-strong/60",
          ],
        )}
      >
        <Brand variant={variant} label={dict.brand} />

        <ul
          className={cn(
            "ml-auto hidden items-center md:flex",
            variant === "a" && "gap-1",
            variant === "b" && "gap-7",
            variant === "c" && "gap-1",
          )}
        >
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "transition-colors",
                  variant === "a" &&
                    "rounded-full px-4 py-2 text-sm text-ink-muted hover:bg-raised/60 hover:text-ink",
                  variant === "b" &&
                    "text-[0.72rem] tracking-[0.16em] text-ink-muted uppercase hover:text-ink",
                  variant === "c" &&
                    "rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-raised hover:text-ink",
                )}
              >
                {dict.nav[link.key]}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 md:ml-6 md:gap-3">
          {/* Pindah ke sini dari `SiteHeader` yang dihapus. Tanpa kontrol ini,
              dwibahasa ID/EN — salah satu janji utama situs — tidak punya satu
              pun cara untuk dipakai. */}
          <LanguageToggle />
          {variant === "c" ? (
            /* Kemajuan baca sebagai instrumen, bukan garis rambut di tepi
               layar. C adalah atlas — pembacaan posisi memang bagian dari
               pakaiannya. */
            <span
              aria-hidden="true"
              className="hidden h-1 w-16 overflow-hidden rounded-full bg-raised sm:block"
            >
              <span ref={progressRef} className="block h-full w-full origin-left scale-x-0 bg-gold" />
            </span>
          ) : null}

          <Link
            href={ctaHref}
            className={cn(
              variant === "b"
                ? "text-[0.72rem] tracking-[0.16em] text-gold-dim underline-offset-4 uppercase hover:underline"
                : buttonClass({ size: "sm" }),
            )}
          >
            {dict.landing.heroPrimary}
          </Link>
        </div>
      </nav>
    </div>
  );
}

/**
 * Lockup merek, tiga perlakuan.
 *
 * Tanda koordinat di kiri nama adalah motif `coordinate-mark` yang sama dengan
 * penanda di peta — ia membuat namanya terbaca sebagai entri survei alih-alih
 * logo startup. Bentuknya berubah per konsep: garis tegak yang memanjang di A,
 * aturan cetak di bawah nama pada B, dan silang bidik pada C.
 */
function Brand({ variant, label }: { variant: NavVariant; label: string }) {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5">
      {variant === "a" ? (
        <span
          aria-hidden="true"
          className="h-4 w-px bg-gold transition-transform duration-500 group-hover:scale-y-150"
        />
      ) : null}

      {variant === "c" ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4 text-gold" aria-hidden="true" fill="none" stroke="currentColor">
          <circle cx="8" cy="8" r="3.4" strokeWidth="1.2" />
          <path d="M8 0v3M8 13v3M0 8h3M13 8h3" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ) : null}

      <span className="flex flex-col">
        <span
          className={cn(
            "font-display leading-none text-ink",
            variant === "b" ? "text-[1.7rem] tracking-[-0.01em]" : "text-2xl tracking-tight",
          )}
        >
          {label}
        </span>
        {variant === "b" ? (
          <span
            aria-hidden="true"
            className="mt-1 h-px w-full origin-left bg-gold-dim/70 transition-transform duration-500 group-hover:scale-x-50"
          />
        ) : null}
      </span>
    </Link>
  );
}
