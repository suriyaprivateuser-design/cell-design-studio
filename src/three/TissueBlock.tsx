"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { hasSecondaryWall, type CellDesign } from "@/simulation/design";
import { CELL_COLORS as C } from "./palette";
import { BLOCK_SIZE, type TissueBlockParts } from "./tissueBlock";

interface Props {
  design: CellDesign;
  parts: TissueBlockParts;
  showLayers?: boolean;
}

/** Renders a TissueBlockParts: merged wall / protoplast meshes, nuclei and plastids. */
export function TissueBlock({ design, parts, showLayers = true }: Props) {
  useEffect(() => () => Object.values(parts.meshes).forEach((g) => g?.dispose()), [parts]);
  const lignified = design.lignified && hasSecondaryWall(design);
  const { meshes } = parts;

  return (
    <group>
      {/* Floor under the block: what you see down through the intercellular spaces */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BLOCK_SIZE * 0.995, BLOCK_SIZE * 0.995]} />
        <meshStandardMaterial color={C.space} roughness={0.95} />
      </mesh>
      {meshes.ml && (
        <mesh geometry={meshes.ml}>
          <meshStandardMaterial color={showLayers ? C.middleLamella : C.wallPlain} roughness={0.6} />
        </mesh>
      )}
      {meshes.pw && (
        <mesh geometry={meshes.pw}>
          <meshStandardMaterial color={C.primaryWall} roughness={0.5} />
        </mesh>
      )}
      {meshes.sw && (
        <mesh geometry={meshes.sw}>
          <meshStandardMaterial color={lignified ? C.lignin : C.secondaryWall} roughness={0.55} />
        </mesh>
      )}
      {meshes.cytoplasm && (
        <mesh geometry={meshes.cytoplasm}>
          <meshStandardMaterial color={C.cytoplasm} roughness={0.7} />
        </mesh>
      )}
      {meshes.vacuole && (
        <mesh geometry={meshes.vacuole}>
          <meshPhysicalMaterial color={C.vacuole} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} transparent opacity={0.92} />
        </mesh>
      )}
      {meshes.lumenFloor && (
        <mesh geometry={meshes.lumenFloor}>
          <meshStandardMaterial color={C.lumen} roughness={0.9} />
        </mesh>
      )}
      {parts.nuclei.map((n, i) => (
        <group key={i} position={n.position}>
          <mesh>
            <sphereGeometry args={[n.radius, 32, 20]} />
            <meshPhysicalMaterial color={C.nucleus} roughness={0.35} clearcoat={0.6} />
          </mesh>
          <mesh position={[n.radius * 0.15, n.radius * 0.45, n.radius * 0.1]}>
            <sphereGeometry args={[n.radius * 0.42, 20, 14]} />
            <meshStandardMaterial color={C.nucleolus} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <Plastids design={design} parts={parts} />
    </group>
  );
}

/** All plastids in one instanced mesh. */
function Plastids({ design, parts }: { design: CellDesign; parts: TissueBlockParts }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = parts.plastids.length;
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 14, 10), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const amyloplast = design.plastids === "amyloplast";
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    parts.plastids.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rotation);
      // Chloroplasts are flat lenses along the wall; starch grains are rounder beads.
      scale.set(p.rx, Math.min(p.rx, p.ry) * (amyloplast ? 0.95 : 0.6), p.ry);
      m.compose(p.position, q, scale);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [parts, amyloplast]);
  if (count === 0) return null;
  return (
    <instancedMesh key={count} ref={ref} args={[geometry, undefined, count]}>
      <meshStandardMaterial color={amyloplast ? C.amyloplast : C.chloroplast} roughness={amyloplast ? 0.6 : 0.45} />
    </instancedMesh>
  );
}
