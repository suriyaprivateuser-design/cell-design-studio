"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { hasSecondaryWall, type CellDesign } from "@/simulation/design";
import { CUT_NORMAL, type CellParts, type CutParts, type CutView } from "./cellGeometry";
import { CELL_COLORS as C } from "./palette";
import { Ink, ToonMat } from "./toon/ToonScene";

interface Props {
  design: CellDesign;
  view: "whole" | CutView;
  parts: CellParts;
  cut: CutParts | null;
  /** Colour each wall layer separately (middle lamella / primary / secondary) */
  showLayers?: boolean;
}

const INK = 0.012;

/** One cell, cel-shaded with ink outlines: whole (see-through wall) or cut open. */
export function CellModel({ design, view, parts, cut, showLayers = true }: Props) {
  const clip = useMemo(() => (view === "whole" ? [] : [new THREE.Plane(CUT_NORMAL[view].clone().negate(), 0)]), [view]);
  const planeQuat = useMemo(
    () => (view === "whole" ? new THREE.Quaternion() : new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), CUT_NORMAL[view])),
    [view],
  );

  const lignified = design.lignified && hasSecondaryWall(design);
  const swColor = lignified ? C.lignin : C.secondaryWall;
  const mlColor = showLayers ? C.middleLamella : C.wallPlain;
  const innerWallColor = hasSecondaryWall(design) ? swColor : C.primaryWall;
  const plastidColor = design.plastids === "chloroplast" ? C.chloroplast : C.amyloplast;
  const faceColor: Record<string, string> = {
    ml: mlColor,
    pw: C.primaryWall,
    sw: swColor,
    membrane: C.membrane,
    tonoplast: C.tonoplast,
    cytoplasm: C.cytoplasm,
  };

  return (
    <group>
      {view === "whole" ? (
        <>
          <mesh geometry={parts.outer} renderOrder={5}>
            <ToonMat color={C.primaryWall} opacity={0.35} />
            <Ink color={C.middleLamella} thickness={INK} />
          </mesh>
          <mesh geometry={parts.wallInner} renderOrder={4}>
            <ToonMat color={innerWallColor} opacity={lignified ? 0.5 : 0.25} />
          </mesh>
          {parts.membrane && (
            <mesh geometry={parts.membrane} renderOrder={3}>
              <ToonMat color={C.cytoplasm} opacity={0.3} />
            </mesh>
          )}
          {parts.vacuole && (
            <mesh geometry={parts.vacuole} renderOrder={2}>
              <ToonMat color={C.vacuole} opacity={0.6} />
            </mesh>
          )}
        </>
      ) : (
        cut && (
          <>
            <mesh geometry={parts.outer}>
              <ToonMat color={mlColor} doubleSide clippingPlanes={clip} />
              <Ink color={mlColor} thickness={INK} clippingPlanes={clip} />
            </mesh>
            {cut.faces.map((f) => (
              <mesh key={f.id} geometry={f.geometry}>
                <ToonMat color={faceColor[f.id]} />
              </mesh>
            ))}
            {parts.vacuole ? (
              <mesh geometry={parts.vacuole}>
                <ToonMat color={C.vacuole} backSide clippingPlanes={clip} />
              </mesh>
            ) : (
              <mesh geometry={parts.wallInner}>
                <ToonMat color={C.lumen} backSide clippingPlanes={clip} />
              </mesh>
            )}
            {cut.plastidDiscs.map((p, i) => (
              <group key={i} position={p.position} quaternion={planeQuat}>
                <mesh rotation={[0, 0, p.angle]} scale={[p.rx, p.ry, 1]}>
                  <circleGeometry args={[1, 20]} />
                  <ToonMat color={plastidColor} />
                </mesh>
              </group>
            ))}
          </>
        )
      )}

      {parts.nucleus && (
        <group position={parts.nucleus.position}>
          <mesh>
            <sphereGeometry args={[parts.nucleus.radius, 40, 28]} />
            <ToonMat color={C.nucleus} clippingPlanes={clip} />
            <Ink color={C.nucleus} thickness={INK * 0.8} clippingPlanes={clip} />
          </mesh>
          {view === "whole" && (
            <mesh position={[-parts.nucleus.radius * 0.35, parts.nucleus.radius * 0.6, parts.nucleus.radius * 0.55]}>
              <sphereGeometry args={[parts.nucleus.radius * 0.17, 12, 8]} />
              <ToonMat color="#ffffff" flat />
            </mesh>
          )}
          {view !== "whole" && (
            <group quaternion={planeQuat}>
              <mesh position={[0, 0, -0.0005]}>
                <circleGeometry args={[parts.nucleus.radius, 40]} />
                <ToonMat color={C.nucleus} />
              </mesh>
              <mesh position={[parts.nucleus.radius * 0.2, parts.nucleus.radius * 0.15, -0.0002]}>
                <circleGeometry args={[parts.nucleus.radius * 0.36, 28]} />
                <ToonMat color={C.nucleolus} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {view === "whole" &&
        parts.plastids.map((p, i) => (
          <mesh key={i} position={p.position} quaternion={p.quaternion} scale={p.size}>
            <sphereGeometry args={[1, 16, 12]} />
            <ToonMat color={plastidColor} />
          </mesh>
        ))}
    </group>
  );
}
