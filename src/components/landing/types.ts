import type { Continent, LocalizedText } from "@/data/types";

/**
 * Bentuk ramping yang diturunkan server ke section klien.
 *
 * Record Heritage penuh memuat deskripsi, lini masa, fakta, dan hotspot —
 * puluhan kilobyte kalau kelima belasnya dikirim ke peramban untuk sesuatu
 * yang hanya butuh nama dan koordinat. Proyeksi ini yang dikirim.
 */
export interface MapPoint {
  slug: string;
  name: LocalizedText;
  country: LocalizedText;
  continent: Continent;
  lat: number;
  lon: number;
}
