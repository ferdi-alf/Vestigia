/**
 * Registrasi metadata heritage.
 *
 * Menambah heritage baru: salin _template.ts menjadi <slug>.ts, isi datanya,
 * lalu tambahkan satu impor dan satu entri di sini. Registry yang mencocokkan
 * metadata ini dengan asset 3D yang benar-benar ada di /3d-object.
 *
 * Slug harus sama persis dengan slug di scripts/heritage-slugs.json, yang
 * pada gilirannya memetakan nama file GLB sumber. Entri yang slug-nya tidak
 * punya GLB tidak akan tampil di web — dan itu perilaku yang benar, bukan bug.
 */
import type { HeritageMeta } from "../types";

import { abuSimbel } from "./abu-simbel";
import { angkorWat } from "./angkor-wat";
import { borobudur } from "./borobudur";
import { chichenItza } from "./chichen-itza";
import { colosseum } from "./colosseum";
import { greatPyramidOfGiza } from "./great-pyramid-of-giza";
import { lalibela } from "./lalibela";
import { machuPicchu } from "./machu-picchu";
import { moai } from "./moai";
import { notreDame } from "./notre-dame";
import { petra } from "./petra";
import { statueOfLiberty } from "./statue-of-liberty";
import { stonehenge } from "./stonehenge";
import { sydneyOperaHouse } from "./sydney-opera-house";
import { terracottaArmy } from "./terracotta-army";

const modules: HeritageMeta[] = [
  abuSimbel,
  angkorWat,
  borobudur,
  chichenItza,
  colosseum,
  greatPyramidOfGiza,
  lalibela,
  machuPicchu,
  moai,
  notreDame,
  petra,
  statueOfLiberty,
  stonehenge,
  sydneyOperaHouse,
  terracottaArmy,
];

/** Metadata terindeks berdasarkan slug. */
export const HERITAGE_META: Record<string, HeritageMeta> = Object.fromEntries(
  modules.map((m) => [m.slug, m]),
);
