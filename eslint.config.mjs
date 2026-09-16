import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Perkakas penulis, bukan bagian dari produk. Folder ini sudah di-gitignore
    // dan tidak pernah ikut dibundel; melintasinya hanya menghasilkan 20 error
    // tentang `require()` di skrip .cjs orang lain, dan error itu menenggelamkan
    // temuan yang benar-benar ada di kode kita.
    ".claude/**",

    // Dekoder Draco, disalin apa adanya dari distribusi three.js dan sengaja
    // di-host sendiri supaya tidak ada CDN pihak ketiga di jalur kritis. Ia
    // kode mesin yang diminifikasi — mengeluhkan `this` yang di-alias di
    // dalamnya tidak pernah menghasilkan perbaikan.
    "public/draco/**",

    // Transcoder Basis/KTX2, alasan yang sama persis: berkas vendor three.js
    // yang di-host sendiri. Ia memakai `require()` di dalam glue Emscripten —
    // dua error yang tidak akan pernah kita perbaiki, dan yang menenggelamkan
    // temuan nyata di kode kita.
    "public/basis/**",
  ]),
]);

export default eslintConfig;
