"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Stage } from "./Stage";
import { TISSUE_MODELS } from "./models";
import { ToonScene } from "./toon/ToonScene";

export type ModelView = "oblique" | "top" | "side";

interface Props {
  tissueId: string;
  variantId: string;
  view: ModelView;
  showLabels: boolean;
  sway?: boolean;
  interactive?: boolean;
  className?: string;
}

/** A tissue model from the registry, with camera presets for oblique, top (cross) and side (longitudinal) views. */
export default function ModelCanvas({ tissueId, variantId, view, showLabels, sway, interactive = true, className }: Props) {
  const variants = TISSUE_MODELS[tissueId] ?? [];
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const model = useMemo(() => variant?.build(), [variant]);
  if (!model) return null;

  const dist = model.camera.distanceTo(model.target);
  const camera =
    view === "top"
      ? model.target.clone().add(new THREE.Vector3(0, dist, 0.001))
      : view === "side"
        ? model.target.clone().add(new THREE.Vector3(0, dist * 0.08, dist))
        : model.camera.clone();

  return (
    <Stage
      camera={camera}
      target={model.target}
      cameraKey={`${tissueId}:${variant.id}:${view}`}
      labels={showLabels ? model.labels : []}
      floorY={model.floorY}
      shadowKey={`${tissueId}:${variant.id}`}
      sway={sway}
      interactive={interactive}
      className={className}
    >
      <ToonScene model={model} />
    </Stage>
  );
}
