"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Heritage } from "@/data/types";
import { installBVH } from "@/lib/three/bvh";
import { withKTX2 } from "@/lib/three/ktx2";
import { normalizeModel, prepareModel } from "@/lib/three/normalize";
import { snapHotspots } from "@/lib/three/snap-hotspot";

installBVH();

/**
 * Decoder Draco dilayani dari domain kita sendiri, bukan dari CDN Google yang
 * dipakai drei secara bawaan. Semua model di koleksi ini terkompresi Draco,
 * jadi decoder itu bukan pelengkap melainkan syarat: kalau permintaan ke CDN
 * gagal atau diblokir jaringan, tidak ada satu pun model yang tampil.
 */
const DRACO_PATH = "/draco/gltf/";

export interface ResolvedModel {
  radius: number;
  height: number;
  /** posisi dunia tiap hotspot, sudah menempel di permukaan */
  anchors: Map<string, THREE.Vector3>;
}

/**
 * Memuat, menormalkan, dan menyiapkan satu model heritage.
 *
 * Semua pekerjaan berat — normalisasi, pembangunan BVH, penempelan hotspot —
 * terjadi sekali setelah scene dimuat, bukan tiap frame. Hasilnya dilaporkan
 * ke atas lewat `onReady` supaya kamera dan lapisan penanda bisa menyesuaikan
 * diri dengan bentuk model yang sebenarnya.
 */
export function HeritageModel({
  heritage,
  onReady,
}: {
  heritage: Heritage;
  onReady: (result: ResolvedModel) => void;
}) {
  /* Parameter ketiga `true` adalah meshopt (nilai bawaan drei, ditulis eksplisit
     karena `extendLoader` menempati slot keempat). Yang keempat memasang
     KTX2Loader — sepuluh dari lima belas model membawa tekstur Basis. */
  const { scene } = useGLTF(heritage.modelPath, DRACO_PATH, true, withKTX2);
  const invalidate = useThree((state) => state.invalidate);
  const groupRef = useRef<THREE.Group>(null);

  /* Kloning: useGLTF membagikan satu scene ke semua pemakainya, dan
     normalisasi memodifikasi transform. Tanpa kloning, membuka situs kedua
     akan menggeser yang pertama. */
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const meshes = prepareModel(model);
    const bounds = normalizeModel(model);

    for (const mesh of meshes) {
      if (!mesh.geometry.boundsTree) mesh.geometry.computeBoundsTree();
    }

    const box = new THREE.Box3().setFromObject(model);
    const anchors = snapHotspots(heritage.hotspots, meshes, box);

    onReady({ radius: bounds.radius, height: bounds.size.y, anchors });
    invalidate();

    return () => {
      for (const mesh of meshes) {
        mesh.geometry.disposeBoundsTree?.();
      }
    };
  }, [model, heritage.hotspots, onReady, invalidate]);

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}
