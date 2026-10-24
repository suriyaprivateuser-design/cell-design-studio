"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CellDesign } from "@/simulation/design";
import { cellDims } from "@/simulation/dims";
import { buildCell, buildCut, cameraFor, cellLabels, type CellLabel, type View } from "./cellGeometry";
import { CellModel } from "./CellModel";

export interface CellCanvasProps {
  design: CellDesign;
  view: View;
  showLabels?: boolean;
  showLayers?: boolean;
  /** Slow presentation sway (home page) */
  sway?: boolean;
  interactive?: boolean;
  /** >1 moves the camera back, e.g. for narrow side-by-side views */
  distanceScale?: number;
  className?: string;
}

/** Glides the camera to the preset position whenever the view changes. */
function CameraRig({ view, design, distanceScale }: { view: View; design: CellDesign; distanceScale: number }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const target = useRef<THREE.Vector3 | null>(null);
  const shapeKey = `${view}:${design.shape}`;
  const designRef = useRef(design);
  useEffect(() => {
    designRef.current = design;
  });
  useEffect(() => {
    target.current = cameraFor(view, designRef.current, distanceScale);
    invalidate();
  }, [shapeKey, view, distanceScale, invalidate]);
  useFrame((_, dt) => {
    if (!target.current) return;
    const k = Math.min(1, dt * 4);
    camera.position.lerp(target.current, k);
    controls?.target.lerp(new THREE.Vector3(0, 0, 0), k);
    controls?.update();
    if (camera.position.distanceTo(target.current) < 0.01) target.current = null;
    else invalidate();
  });
  return null;
}

/** Moves the HTML labels to the projected screen position of their anchors every frame. */
function LabelProjector({ labels, elements, group }: { labels: CellLabel[]; elements: React.RefObject<(HTMLDivElement | null)[]>; group: React.RefObject<THREE.Group | null> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    labels.forEach((l, i) => {
      const el = elements.current?.[i];
      if (!el) return;
      v.copy(l.pos);
      if (group.current) v.applyMatrix4(group.current.matrixWorld);
      v.project(camera);
      const hidden = v.z > 1;
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = hidden ? "0" : "1";
      // Labels near the right edge open to the left so they stay inside the view.
      const flip = x > size.width * 0.6;
      if ((el.dataset.flip === "1") !== flip) el.dataset.flip = flip ? "1" : "";
    });
  });
  return null;
}

function Sway({ children, groupRef }: { children: React.ReactNode; groupRef: React.RefObject<THREE.Group | null> }) {
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.55;
    groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.08;
  });
  return <group ref={groupRef}>{children}</group>;
}

export default function CellCanvas({ design, view, showLabels = true, showLayers = true, sway, interactive = true, distanceScale = 1, className }: CellCanvasProps) {
  const parts = useMemo(() => buildCell(design), [design]);
  const cut = useMemo(() => (view === "whole" ? null : buildCut(design, parts, view)), [design, parts, view]);
  useEffect(
    () => () => {
      parts.outer.dispose();
      parts.wallInner.dispose();
      parts.membrane?.dispose();
      parts.vacuole?.dispose();
    },
    [parts],
  );
  useEffect(() => () => cut?.faces.forEach((f) => f.geometry.dispose()), [cut]);

  const labels = useMemo(() => (showLabels ? cellLabels(design, parts, cut, showLayers) : []), [showLabels, design, parts, cut, showLayers]);
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  const groupRef = useRef<THREE.Group | null>(null);

  const start = cameraFor(view, design, distanceScale);
  // The shadow is rendered once; a new key re-renders it when the cell changes.
  const shadowKey = `${view}:${JSON.stringify(design)}`;
  const dims = cellDims(design);
  const floor = -dims.scale * (design.shape === "elongated" ? 1.65 : 1.12);
  const model = <CellModel design={design} view={view} parts={parts} cut={cut} showLayers={showLayers} />;

  return (
    <div className={className}>
      <Canvas
        // Render only when something changes (camera move, new design); the home page sway animates continuously.
        frameloop={sway ? "always" : "demand"}
        dpr={[1, 2]}
        camera={{ position: [start.x, start.y, start.z], fov: 34, near: 0.05, far: 60 }}
        onCreated={({ gl, camera }) => {
          gl.localClippingEnabled = true;
          camera.lookAt(0, 0, 0);
        }}
      >
        <ambientLight intensity={0.85} />
        <hemisphereLight args={["#ffffff", "#dfe9d6", 0.6]} />
        <directionalLight position={[3, 6, 4]} intensity={1.35} />
        <directionalLight position={[-4, 2, -3]} intensity={0.35} />
        {sway ? <Sway groupRef={groupRef}>{model}</Sway> : <group ref={groupRef}>{model}</group>}
        <ContactShadows key={shadowKey} frames={1} position={[0, floor, 0]} opacity={0.22} scale={7} blur={2.6} far={4} color="#3b5233" />
        {interactive && <OrbitControls makeDefault enablePan={false} minDistance={1.4} maxDistance={9} enableDamping dampingFactor={0.12} />}
        {interactive && <CameraRig view={view} design={design} distanceScale={distanceScale} />}
        <LabelProjector labels={labels} elements={labelEls} group={groupRef} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {labels.map((l, i) => (
          <div
            key={l.key}
            ref={(el) => {
              labelEls.current[i] = el;
            }}
            className="absolute top-0 left-0 opacity-0 transition-opacity duration-200"
          >
            <div className="cell-label">
              <span className="cell-label-dot" />
              <span className="cell-label-text">
                {l.text.split(" · ")[0]}
                <span className="cell-label-en"> · {l.text.split(" · ")[1]}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      {labels.length > 0 && (
        <ul className="sr-only">
          {labels.map((l) => (
            <li key={l.key}>{l.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
