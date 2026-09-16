import type { CSSProperties } from "react";
import Image from "next/image";
import { MEDIA_MANIFEST } from "@/data/generated/media-manifest";
import type { MediaSlot } from "@/data/landing-media";
import { cn } from "@/lib/cn";

/**
 * Gradien yang melarutkan bagian atas lapisan ke dalam kabut di belakangnya.
 *
 * Ini pengganti kanal alpha, dan bukan pengganti yang lebih buruk. Hampir semua
 * model gambar tidak menghasilkan alpha, sehingga menuntutnya berarti menambah
 * langkah hapus-latar yang rapuh pada setiap asset. Lagi pula batas yang
 * melarut memang lebih menyerupai kabut sungguhan daripada tepi hasil potongan.
 */
const MASK_UP =
  "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.28) 16%, rgba(0,0,0,0.82) 30%, #000 42%)";

/**
 * Apakah slot ini merender gambar sungguhan.
 *
 * Bendera `procedural` diperiksa lebih dulu, dan urutannya penting: slot yang
 * prosedural menjawab "tidak" meskipun berkasnya ada di manifest. Itu yang
 * membuat baris kredit "Ilustrasi suasana" ikut menghilang dengan benar — kalau
 * yang dilukis adalah CSS, menyebutnya ilustrasi adalah klaim yang tidak benar.
 */
export function hasMedia(slot: MediaSlot): boolean {
  return !slot.procedural && slot.file in MEDIA_MANIFEST;
}

/** True kalau ada satu saja gambar nyata di antara slot-slot ini. */
export function anyMedia(slots: readonly MediaSlot[]): boolean {
  return slots.some(hasMedia);
}

/**
 * Satu lapisan visual: gambar kalau berkasnya ada, komposisi CSS kalau tidak.
 *
 * Seluruh keputusan "ada atau tidak ada" tinggal di sini. Section tidak pernah
 * menanyakannya, sehingga halaman ini bisa dibangun, diperiksa, dan dikirim
 * jauh sebelum satu gambar pun digenerate.
 *
 * `data-layer` dan `data-depth` adalah pegangan bagi animasi scroll: koreografi
 * membaca kedalaman dari DOM, bukan dari angka yang ditulis ulang di dalam
 * berkas animasi. Mengubah rasa kedalaman cukup di src/data/landing-media.ts.
 */
export function MediaLayer({
  slot,
  className,
  sizes = "100vw",
}: {
  slot: MediaSlot;
  className?: string;
  sizes?: string;
}) {
  const file = hasMedia(slot) ? MEDIA_MANIFEST[slot.file] : undefined;

  const style: CSSProperties = { opacity: slot.opacity };

  /* Mode komposit hanya berlaku untuk gambar, tidak pernah untuk komposisi CSS.
     `composite` menjawab satu pertanyaan: bagaimana sebuah berkas yang
     digenerate tanpa kanal alpha menyatu dengan yang di belakangnya. Komposisi
     prosedural tidak punya pertanyaan itu — ia dilukis langsung untuk tema yang
     sedang berlaku, dengan transparansi sungguhan.

     Menerapkannya tetap akan merusak: `screen` hanya bisa menerangkan, jadi
     butiran debu yang sekarang dilukis lebih GELAP daripada kertas akan lenyap
     seluruhnya di bawahnya. */
  if (file) {
    if (slot.composite === "mask-up") {
      style.maskImage = MASK_UP;
      style.WebkitMaskImage = MASK_UP;
    }
    if (slot.composite === "screen") {
      style.mixBlendMode = "screen";
    }
    if (slot.composite === "multiply") {
      style.mixBlendMode = "multiply";
    }
  }

  return (
    <div
      data-layer={slot.id}
      data-depth={slot.depth}
      /* Lapisan ini atmosfer, bukan informasi. Membacakan "langit fajar
         berkabut" lima kali berturut-turut kepada pengguna pembaca layar tidak
         menambah apa pun — yang mereka butuhkan ada di judul dan teksnya.
         Deskripsi tiap slot tetap disimpan di landing-media.ts sebagai catatan
         asset, bukan sebagai teks alternatif. */
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={style}
    >
      {file ? (
        <Image
          src={file.src}
          alt=""
          fill
          /* `priority` sudah menyiratkan pemuatan eager plus tautan preload,
             dan ketiadaannya sudah menyiratkan lazy. Menyetel `loading` sendiri
             di sebelahnya tidak menambah apa pun dan justru bertabrakan dengan
             petunjuk prioritas yang dipasang Next. */
          priority={slot.priority}
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className={cn("h-full w-full", slot.fallback)} />
      )}
    </div>
  );
}

/**
 * Baris kredit. Hanya muncul kalau benar-benar ada gambar generate di section
 * ini — kalau yang tampil komposisi CSS, tidak ada ilustrasi untuk diakui.
 */
export function IllustrationNote({
  show,
  label,
  className,
}: {
  show: boolean;
  label: string;
  className?: string;
}) {
  if (!show) return null;
  return (
    <p className={cn("text-[0.65rem] tracking-[0.14em] text-ink-dim/70", className)}>
      {label}
    </p>
  );
}
