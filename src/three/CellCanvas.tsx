"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { CellDesign } from "@/simulation/design";
import { cellDims } from "@/simulation/dims";
import { buildCell, buildCut, cameraFor, cellLabels, type View } from "./cellGeometry";
import { CellModel } from "./CellModel";
import { Stage } from "./Stage";
import { buildTissueBlock } from "./tissueBlock";
import { ToonScene } from "./toon/ToonScene";

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

/** A designed cell: the tissue block, or one cell whole / cut across / cut lengthwise. */
export default function CellCanvas({ design, view, showLabels = true, showLayers = true, sway, interactive = true, distanceScale = 1, className }: CellCanvasProps) {
  const tissue = view === "tissue";
  const parts = useMemo(() => (tissue ? null : buildCell(design)), [design, tissue]);
  const cut = useMemo(() => (parts && (view === "cross" || view === "long") ? buildCut(design, parts, view) : null), [design, parts, view]);
  const block = useMemo(() => (tissue ? buildTissueBlock(design) : null), [design, tissue]);
  useEffect(
    () => () => {
      parts?.outer.dispose();
      parts?.wallInner.dispose();
      parts?.membrane?.dispose();
      parts?.vacuole?.dispose();
    },
    [parts],
  );
  useEffect(() => () => cut?.faces.forEach((f) => f.geometry.dispose()), [cut]);

  const labels = useMemo(() => {
    if (!showLabels) return [];
    if (block) return block.labels;
    return parts ? cellLabels(design, parts, cut, showLayers) : [];
  }, [showLabels, design, parts, cut, block, showLayers]);

  const camera = (block ? block.camera.clone() : cameraFor(view, design)).multiplyScalar(distanceScale);
  const target = block ? block.target : new THREE.Vector3();
  const dims = cellDims(design);
  const floorY = block ? block.floorY : -dims.scale * (design.shape === "elongated" ? 1.65 : 1.12);

  return (
    <Stage
      camera={camera}
      target={target}
      cameraKey={`${view}:${design.shape}:${distanceScale}`}
      labels={labels}
      floorY={floorY}
      shadowKey={`${view}:${JSON.stringify(design)}`}
      sway={sway}
      interactive={interactive}
      className={className}
    >
      {block ? <ToonScene model={block} /> : parts && view !== "tissue" && <CellModel design={design} view={view} parts={parts} cut={cut} showLayers={showLayers} />}
    </Stage>
  );
}
