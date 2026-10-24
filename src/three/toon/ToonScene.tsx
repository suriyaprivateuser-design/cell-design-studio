"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Outlines } from "@react-three/drei";
import { inkOf, type ToonInstances, type ToonModel } from "./kit";

let gradient: THREE.DataTexture | null = null;

/** Three hard light bands: shadow, mid, lit (the cel-shaded look). */
export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  gradient = new THREE.DataTexture(new Uint8Array([118, 190, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

interface MatProps {
  color: string;
  opacity?: number;
  doubleSide?: boolean;
  backSide?: boolean;
  flat?: boolean;
  clippingPlanes?: THREE.Plane[];
}

/** Cel-shaded material (or an unlit flat one for highlights and dark gaps). */
export function ToonMat({ color, opacity = 1, doubleSide, backSide, flat, clippingPlanes }: MatProps) {
  const side = backSide ? THREE.BackSide : doubleSide ? THREE.DoubleSide : THREE.FrontSide;
  const transparent = opacity < 1;
  if (flat) return <meshBasicMaterial color={color} side={side} transparent={transparent} opacity={opacity} clippingPlanes={clippingPlanes} />;
  return (
    <meshToonMaterial
      color={color}
      gradientMap={toonGradient()}
      side={side}
      transparent={transparent}
      opacity={opacity}
      depthWrite={!transparent}
      clippingPlanes={clippingPlanes}
    />
  );
}

/** Ink outline: inverted hull in a darker shade of the part colour. */
export function Ink({ color, thickness, clippingPlanes }: { color: string; thickness: number; clippingPlanes?: THREE.Plane[] }) {
  if (thickness <= 0) return null;
  return <Outlines thickness={thickness} color={inkOf(color)} angle={Math.PI} clippingPlanes={clippingPlanes} />;
}

const SHAPES: Record<ToonInstances["shape"], () => THREE.BufferGeometry> = {
  sphere: () => new THREE.SphereGeometry(1, 16, 12),
  disc: () => new THREE.CircleGeometry(1, 24).rotateX(-Math.PI / 2),
  box: () => new THREE.BoxGeometry(1, 1, 1),
  cylinder: () => new THREE.CylinderGeometry(1, 1, 1, 16),
};

function Instances({ data }: { data: ToonInstances }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => SHAPES[data.shape](), [data.shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    data.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [data]);
  return (
    <instancedMesh key={data.matrices.length} ref={ref} args={[geometry, undefined, data.matrices.length]}>
      <ToonMat color={data.color} flat={data.flat} doubleSide={data.shape === "disc"} />
      <Ink color={data.color} thickness={data.outline} />
    </instancedMesh>
  );
}

/** Renders a ToonModel. Disposes its geometry when the model changes. */
export function ToonScene({ model }: { model: ToonModel }) {
  useEffect(() => () => model.parts.forEach((p) => p.geometry.dispose()), [model]);
  return (
    <group>
      {model.parts.map((p) => (
        <mesh key={p.key} geometry={p.geometry} renderOrder={p.opacity < 1 ? 2 : 0}>
          <ToonMat color={p.color} opacity={p.opacity} doubleSide={p.doubleSide} flat={p.flat} />
          <Ink color={p.color} thickness={p.outline} />
        </mesh>
      ))}
      {model.instances.map((i) => (i.matrices.length ? <Instances key={i.key} data={i} /> : null))}
    </group>
  );
}
