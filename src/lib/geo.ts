import { Vector3 } from "three";

/**
 * [lintang, bujur] → titik di permukaan bola.
 *
 * Angka-angka di bawah bukan pilihan gaya; mereka diturunkan dari cara
 * `SphereGeometry` three.js memetakan UV-nya, supaya penanda mendarat persis
 * di texel tempat daratannya digambar. `u` berjalan mengelilingi khatulistiwa
 * dari tepi kiri tekstur, dan tekstur kita equirectangular dengan
 * `x = bujur + 180` — jadi `u = (bujur + 180) / 360` mencocokkan keduanya
 * tanpa offset koreksi apa pun.
 *
 * Tanda minus pada `x` juga datang dari sana, bukan dari percobaan: three.js
 * menulis `x = -cos(phi) * sin(theta)`. Menghilangkannya akan mencerminkan
 * seluruh dunia, dan cerminnya hanya ketahuan pada benua yang tidak simetris.
 *
 * Sumber lintang-bujurnya sama persis dengan yang dipakai peta datar
 * (`coordinates` di tiap berkas heritage), sehingga globe dan peta tidak
 * pernah bisa berbeda pendapat tentang letak sebuah situs.
 */
export function latLonToVector3(latitude: number, longitude: number, radius = 1): Vector3 {
  const theta = ((90 - latitude) / 180) * Math.PI;
  const phi = ((longitude + 180) / 360) * Math.PI * 2;
  const sinTheta = Math.sin(theta);

  return new Vector3(
    -radius * Math.cos(phi) * sinTheta,
    radius * Math.cos(theta),
    radius * Math.sin(phi) * sinTheta,
  );
}

/** Fraksi 0..1 melintasi tekstur equirectangular — dipakai saat menggambar. */
export function latLonToUv(latitude: number, longitude: number): { u: number; v: number } {
  return { u: (longitude + 180) / 360, v: (90 - latitude) / 180 };
}

/**
 * Varian yang menulis ke vektor yang sudah ada.
 *
 * `latLonToVector3` mengalokasikan, dan itu benar untuk perhitungan yang
 * dilakukan sekali. Di dalam loop render ia salah: satu alokasi per frame per
 * pemanggil adalah tekanan pada garbage collector, dan tekanan itu muncul di
 * layar sebagai sentakan berkala — bukan sebagai frame rate yang rendah.
 */
export function latLonInto(
  target: Vector3,
  latitude: number,
  longitude: number,
  radius = 1,
): Vector3 {
  const theta = ((90 - latitude) / 180) * Math.PI;
  const phi = ((longitude + 180) / 360) * Math.PI * 2;
  const sinTheta = Math.sin(theta);

  return target.set(
    -radius * Math.cos(phi) * sinTheta,
    radius * Math.cos(theta),
    radius * Math.sin(phi) * sinTheta,
  );
}
