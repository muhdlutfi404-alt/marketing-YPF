import React from "react";
import { AbsoluteFill } from "remotion";
import { CinematicZoom, type ZoomDirection } from "../../../shared/components/CinematicZoom";
import { ColorGrade, type GradeName } from "../../../shared/components/CinematicLook";
import { Footage } from "../../../shared/components/Footage";
import { ProceduralLandscape, type LandscapeVariant } from "../../../shared/components/ProceduralLandscape";

export type ClipSettings = {
  /** Path inside /public, e.g. "footage/ready/summit.mp4". Empty = animated placeholder. */
  src?: string;
  trimBeforeSec?: number;
  placeholder: LandscapeVariant;
};

/** A graded, slowly-zooming footage shot — the basic building block of a documentary. */
export const AMShot: React.FC<{
  clip: ClipSettings;
  grade: GradeName;
  durationInFrames: number;
  fps: number;
  zoom?: ZoomDirection;
  seed?: number;
  darken?: number;
  punchAt?: number[];
}> = ({ clip, grade, durationInFrames, fps, zoom = "in", seed = 1, darken = 0, punchAt }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <CinematicZoom durationInFrames={durationInFrames} direction={zoom} amount={0.14} pan={{ x: seed % 2 ? -2 : 2, y: -1 }} punchAt={punchAt}>
      <ColorGrade grade={grade}>
        <Footage src={clip.src} trimBeforeSec={clip.trimBeforeSec} fps={fps} fallback={<ProceduralLandscape variant={clip.placeholder} seed={seed} />} />
      </ColorGrade>
    </CinematicZoom>
    {darken > 0 ? <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${darken * 0.6}) 0%, rgba(0,0,0,${darken}) 100%)` }} /> : null}
  </AbsoluteFill>
);
