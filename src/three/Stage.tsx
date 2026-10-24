"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { ModelLabel } from "./toon/kit";

export interface StageProps {
  children: React.ReactNode;
  /** Where the camera should be; it glides there whenever `cameraKey` changes */
  camera: THREE.Vector3;
  target?: THREE.Vector3;
  cameraKey: string;
  labels: ModelLabel[];
  floorY: number;
  /** Changes when the model changes, so the one-off contact shadow is redrawn */
  shadowKey: string;
  sway?: boolean;
  interactive?: boolean;
  className?: string;
}

/** Glides the camera to `to` whenever `cameraKey` changes. */
function CameraRig({ to, target, cameraKey }: { to: THREE.Vector3; target: THREE.Vector3; cameraKey: string }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const latest = useRef({ to, target });
  useEffect(() => {
    latest.current = { to, target };
  });
  useEffect(() => {
    goal.current = { pos: latest.current.to.clone(), target: latest.current.target.clone() };
    invalidate();
  }, [cameraKey, invalidate]);
  useFrame((_, dt) => {
    if (!goal.current) return;
    const k = Math.min(1, dt * 4);
    camera.position.lerp(goal.current.pos, k);
    controls?.target.lerp(goal.current.target, k);
    controls?.update();
    if (camera.position.distanceTo(goal.current.pos) < 0.01) goal.current = null;
    else invalidate();
  });
  return null;
}

/** Moves the HTML labels to the projected screen position of their anchors every frame. */
function LabelProjector({ labels, elements, group }: { labels: ModelLabel[]; elements: React.RefObject<(HTMLDivElement | null)[]>; group: React.RefObject<THREE.Group | null> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    labels.forEach((l, i) => {
      const el = elements.current?.[i];
      if (!el) return;
      v.copy(l.pos);
      if (group.current) v.applyMatrix4(group.current.matrixWorld);
      v.project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = v.z > 1 ? "0" : "1";
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
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.5;
    groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.05;
  });
  return <group ref={groupRef}>{children}</group>;
}

/** Canvas, lights, orbit controls, camera glide and the label overlay shared by every 3D view. */
export function Stage({ children, camera, target = new THREE.Vector3(), cameraKey, labels, floorY, shadowKey, sway, interactive = true, className }: StageProps) {
  const labelEls = useRef<(HTMLDivElement | null)[]>([]);
  const groupRef = useRef<THREE.Group | null>(null);
  return (
    <div className={className}>
      <Canvas
        // Render only when something changes; the home page sway animates continuously.
        frameloop={sway ? "always" : "demand"}
        // No filmic tone mapping: keep the flat anime colours exactly as specified.
        flat
        dpr={[1, 2]}
        camera={{ position: [camera.x, camera.y, camera.z], fov: 34, near: 0.05, far: 80 }}
        onCreated={({ gl, camera: cam }) => {
          gl.localClippingEnabled = true;
          cam.lookAt(target);
        }}
      >
        <ambientLight intensity={1.15} />
        <hemisphereLight args={["#ffffff", "#e6eedc", 0.45]} />
        <directionalLight position={[-3, 6, 4]} intensity={1.9} />
        <directionalLight position={[4, 2, -3]} intensity={0.35} />
        {sway ? <Sway groupRef={groupRef}>{children}</Sway> : <group ref={groupRef}>{children}</group>}
        <ContactShadows key={shadowKey} frames={1} position={[0, floorY, 0]} opacity={0.3} scale={8} blur={2.4} far={4} color="#3b5233" />
        {interactive && <OrbitControls makeDefault target={target} enablePan={false} minDistance={1.2} maxDistance={14} enableDamping dampingFactor={0.12} />}
        {interactive && <CameraRig to={camera} target={target} cameraKey={cameraKey} />}
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
                {l.text.includes(" · ") && <span className="cell-label-en"> · {l.text.split(" · ")[1]}</span>}
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
