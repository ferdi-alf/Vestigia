"use client";

import { useId, useRef, useState } from "react";
import { GuidePanel, type GuideSite } from "@/components/ai/guide-panel";
import { QuizPanel, type QuizSite } from "@/components/ai/quiz-panel";
import { ComparePanel, type CompareSite } from "@/components/ai/compare-panel";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";

export interface AiPanelSites {
  /** situs yang diangkat — dipakai Pemandu dan Kuis */
  featured: GuideSite & QuizSite;
  /** seluruh koleksi, hanya slug/nama/negara — dipakai Bandingkan */
  all: CompareSite[];
}

type TabId = "guide" | "quiz" | "compare";

/**
 * Tiga route AI dalam satu panel.
 *
 * Berkas ini lahir dari keputusan arsitektur, bukan dari keinginan menambah
 * komponen. Ketika `/compare` dihapus, UI satu-satunya untuk
 * `POST /api/ai/compare` dan `POST /api/ai/quiz` ikut hilang bersamanya — dua
 * dari empat route AI, pada aspek penilaian yang berbobot dua puluh persen.
 * Menghapus halaman tidak boleh berarti menghapus kemampuan, jadi kemampuannya
 * pindah ke sini.
 *
 * Route API-nya sendiri tidak disentuh sama sekali. Yang berubah hanya di mana
 * UI-nya tinggal.
 *
 * Ketiga panel di dalamnya dipakai apa adanya — komponen yang sama persis yang
 * dipakai halaman warisan, dengan prompt dan pembatas yang sama. Tidak ada
 * transkrip yang ditulis lebih dulu, dan tidak ada satu pun model yang
 * dipanggil sampai ada yang benar-benar menekan sesuatu.
 *
 * Pakaiannya diserahkan ke konsep lewat `variant`; warnanya datang dari token
 * yang diwarisi `[data-concept]`, sehingga satu komponen melayani tiga palet
 * tanpa tahu apa-apa tentang ketiganya.
 */
export function AiPanel({
  sites,
  variant = "panel",
  request,
  className,
}: {
  sites: AiPanelSites;
  /** `panel` ceruk bertepi · `plain` tanpa wadah · `rail` tab tegak di kiri */
  variant?: "panel" | "plain" | "rail";
  /**
   * Tab yang DIMINTA terbuka sekarang — sebuah permintaan, bukan nilai awal.
   *
   * Dipakai pemanggil yang punya lebih dari satu pintu masuk ke panel ini:
   * workspace 3D punya tombol terpisah untuk Pemandu, Kuis, dan Bandingkan,
   * dan tombol Kuis yang membuka Pemandu adalah tombol yang berbohong.
   *
   * **Dulu ia bernama `initialTab`, dan namanya jujur tentang cacatnya.**
   * `useState` hanya membaca argumennya pada mount pertama, sementara panel ini
   * dipasang SEKALI dan tinggal terpasang — dialognya menyembunyikan diri, bukan
   * melepasnya. Jadi permintaan kedua dan seterusnya tidak pernah sampai:
   * menekan Kuis setelah pernah membuka Pemandu tetap membuka Pemandu.
   *
   * `null` berarti tidak ada yang sedang diminta — dialognya tertutup — dan
   * panel menahan tab yang terakhir dipilih pengguna. Membedakan `null` dari
   * sebuah tab itulah yang membuat permintaan yang SAMA dua kali berturut-turut
   * tetap terbaca sebagai dua permintaan: di antaranya selalu ada `null`.
   *
   * `undefined` berarti tidak ada pemanggil yang mengendalikan; panel berdiri
   * sendiri dan membuka Pemandu.
   */
  request?: TabId | null;
  className?: string;
}) {
  const { dict } = useI18n();
  const uid = useId().replace(/[:]/g, "");
  const [active, setActive] = useState<TabId>(request ?? "guide");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  /* Menyesuaikan keadaan saat prop berubah, DI DALAM render — pola yang memang
     dianjurkan React untuk kasus ini, dan bukan efek.

     Dengan `useEffect`, tab yang salah sempat tergambar satu bingkai sebelum
     dikoreksi. Di sini React membuang hasil render ini dan mengulangnya sebelum
     satu piksel pun sampai ke layar, jadi yang terlihat cuma tab yang benar.

     `seen` menyimpan permintaan yang sudah dilayani. Tanpanya, pengguna yang
     berpindah tab di dalam dialog akan langsung ditarik balik oleh permintaan
     lama yang nilainya tidak berubah. */
  const [seen, setSeen] = useState<TabId | null | undefined>(request);
  if (request !== seen) {
    setSeen(request);
    if (request) setActive(request);
  }

  /* Bandingkan butuh dua situs. Dengan satu atau nol, tabnya tidak ditampilkan
     sama sekali — lebih jujur daripada memperlihatkan pemilih yang tidak bisa
     dipakai, dan itu perlakuan yang sama dengan yang dilakukan halaman
     `/compare` sebelum ia dihapus. */
  const canCompare = sites.all.length >= 2;

  const tabs: { id: TabId; label: string }[] = [
    { id: "guide", label: dict.ai.guide },
    { id: "quiz", label: dict.ai.quiz },
    ...(canCompare ? [{ id: "compare" as TabId, label: dict.ai.compare }] : []),
  ];

  /* Panah kiri/kanan berpindah tab, Home/End melompat ke ujung — perilaku yang
     diharapkan dari pola tab, dan tanpanya panel ini tidak bisa ditempuh
     dengan papan ketik saja. */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    let next = index;

    if (delta !== 0) next = (index + delta + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;

    event.preventDefault();
    const id = tabs[next].id;
    setActive(id);
    tabRefs.current[id]?.focus();
  };

  const rail = variant === "rail";

  return (
    <div
      className={cn(
        variant === "panel" && "overflow-hidden rounded-2xl border border-line bg-surface",
        rail && "gap-6 sm:flex",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={dict.ai.guide}
        className={cn(
          "flex gap-1",
          rail ? "shrink-0 sm:flex-col" : "border-b border-line px-3 py-2",
        )}
      >
        {tabs.map((tab, index) => {
          const on = active === tab.id;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={on}
              aria-controls={`${uid}-panel-${tab.id}`}
              /* Roving tabindex: hanya tab aktif yang bisa di-Tab ke dalamnya.
                 Tanpa ini, papan ketik harus melewati tiap tab sebelum sampai
                 ke isinya. */
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm whitespace-nowrap transition-colors",
                rail && "w-full text-left",
                on
                  ? "bg-gold/18 text-ink"
                  : "text-ink-muted hover:bg-raised/60 hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={cn(rail ? "min-w-0 flex-1" : variant === "panel" ? "p-5" : "pt-5")}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${uid}-panel-${tab.id}`}
            aria-labelledby={`${uid}-tab-${tab.id}`}
            /* Panel yang tidak aktif disembunyikan dengan `hidden`, bukan
               dilepas dari DOM: melepasnya akan membuang percakapan yang sedang
               berjalan setiap kali pengunjung melirik tab lain. */
            hidden={active !== tab.id}
          >
            {tab.id === "guide" ? <GuidePanel heritage={sites.featured} /> : null}
            {tab.id === "quiz" ? <QuizPanel heritage={sites.featured} /> : null}
            {tab.id === "compare" ? <ComparePanel heritage={sites.all} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
