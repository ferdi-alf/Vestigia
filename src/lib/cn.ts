import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan class Tailwind; yang belakangan menang saat bentrok. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
