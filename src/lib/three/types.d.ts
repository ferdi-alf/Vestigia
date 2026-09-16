/**
 * three-mesh-bvh menempelkan anggota tambahan ke prototipe three.js saat
 * runtime. Deklarasi ini memberitahu TypeScript bahwa anggota itu ada,
 * sehingga pemanggilnya tidak perlu di-cast.
 */
import "three";

declare module "three" {
  interface BufferGeometry {
    computeBoundsTree: (options?: object) => void;
    disposeBoundsTree: () => void;
    boundsTree?: unknown;
  }

  interface Raycaster {
    /** Ditambahkan three-mesh-bvh: berhenti pada perpotongan pertama. */
    firstHitOnly?: boolean;
  }
}
