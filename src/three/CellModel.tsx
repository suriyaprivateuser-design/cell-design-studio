"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { hasSecondaryWall, type CellDesign } from "@/simulation/design";
import { CUT_NORMAL, type CellParts, type CutParts, type CutView } from "./cellGeometry";
import { CELL_COLORS as C } from "./palette";

interface Props {
  design: CellDesign;
  view: "whole" | CutView;
  parts: CellParts;
  cut: CutParts | null;
  /** Colour each wall layer separately (middle lamella / primary / secondary) */
  showLayers?: boolean;
}

export function CellModel({ design, view, parts, cut, showLayers = true }: Props) {
  const clip = useMemo(
    () => (view === "whole" ? [] : [new THREE.Plane(CUT_NORMAL[view].clone().negate(), 0)]),
    [view],
  );
  const planeQuat = useMemo(
    () => (view === "whole" ? new THREE.Quaternion() : new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), CUT_NORMAL[view])),
    [view],
  );

  const lignified = design.lignified && hasSecondaryWall(design);
  const swColor = lignified ? C.lignin : C.secondaryWall;
  const mlColor = showLayers ? C.middleLamella : C.wallPlain;
  const innerWallColor = hasSecondaryWall(design) ? swColor : C.primaryWall;

  const plastidColor = design.plastids === "chloroplast" ? C.chloroplast : C.amyloplast;

  return (
    <group>
      {view === "whole" ? (
        <>
          <mesh geometry={parts.outer} renderOrder={5}>
            <meshPhysicalMaterial color={C.primaryWall} transparent opacity={0.32} roughness={0.55} depthWrite={false} />
          </mesh>
          <mesh geometry={parts.wallInner} renderOrder={4}>
            <meshPhysicalMaterial color={innerWallColor} transparent opacity={lignified ? 0.45 : 0.22} roughness={0.6} depthWrite={false} />
          </mesh>
          {parts.membrane && (
            <mesh geometry={parts.membrane} renderOrder={3}>
              <meshStandardMaterial color={C.cytoplasm} transparent opacity={0.28} depthWrite={false} />
            </mesh>
          )}
          {parts.vacuole && (
            <mesh geometry={parts.vacuole} renderOrder={2}>
              <meshPhysicalMaterial color={C.vacuole} transparent opacity={0.55} roughness={0.2} depthWrite={false} />
            </mesh>
          )}
        </>
      ) : (
        cut && (
          <>
            <mesh geometry={parts.outer}>
              <meshStandardMaterial color={mlColor} clippingPlanes={clip} side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
            {cut.faces.map((f) => (
              <mesh key={f.id} geometry={f.geometry}>
                <meshStandardMaterial
                  color={
                    f.id === "ml"
                      ? mlColor
                      : f.id === "pw"
                        ? C.primaryWall
                        : f.id === "sw"
                          ? swColor
                          : f.id === "membrane"
                            ? C.membrane
                            : f.id === "tonoplast"
                              ? C.tonoplast
                              : C.cytoplasm
                  }
                  roughness={0.8}
                />
              </mesh>
            ))}
            {parts.vacuole ? (
              <mesh geometry={parts.vacuole}>
                <meshStandardMaterial color={C.vacuole} clippingPlanes={clip} side={THREE.BackSide} roughness={0.35} />
              </mesh>
            ) : (
              <mesh geometry={parts.wallInner}>
                <meshStandardMaterial color={C.lumen} clippingPlanes={clip} side={THREE.BackSide} roughness={0.9} />
              </mesh>
            )}
            {cut.plastidDiscs.map((p, i) => (
              <group key={i} position={p.position} quaternion={planeQuat}>
                <mesh rotation={[0, 0, p.angle]} scale={[p.rx, p.ry, 1]}>
                  <circleGeometry args={[1, 20]} />
                  <meshStandardMaterial color={plastidColor} roughness={0.6} />
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
            <meshStandardMaterial color={C.nucleus} roughness={0.45} clippingPlanes={clip} />
          </mesh>
          {view !== "whole" && (
            <group quaternion={planeQuat}>
              <mesh position={[0, 0, -0.0005]}>
                <circleGeometry args={[parts.nucleus.radius, 40]} />
                <meshStandardMaterial color={C.nucleus} roughness={0.6} />
              </mesh>
              <mesh position={[parts.nucleus.radius * 0.2, parts.nucleus.radius * 0.15, -0.0002]}>
                <circleGeometry args={[parts.nucleus.radius * 0.36, 28]} />
                <meshStandardMaterial color={C.nucleolus} roughness={0.6} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {view === "whole" &&
        parts.plastids.map((p, i) => (
          <mesh key={i} position={p.position} quaternion={p.quaternion} scale={p.size}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color={plastidColor} roughness={0.5} />
          </mesh>
        ))}

    </group>
  );
}
