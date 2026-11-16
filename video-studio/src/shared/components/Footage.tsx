import React from "react";
import { AbsoluteFill } from "remotion";
import { Video } from "@remotion/media";
import { resolveMedia } from "../utils/media";

/**
 * Shows a video clip that fills the frame (cropping as needed, so landscape footage
 * also works in a vertical video). If no `src` is given, a `fallback` is shown instead —
 * this is how the templates look good before you've added your own footage.
 */
export type FootageProps = {
  /** Path inside /public, e.g. "footage/ready/summit.mp4". Leave empty to use the fallback. */
  src?: string;
  /** Skip this many seconds at the start of the clip (your "in point") */
  trimBeforeSec?: number;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
  fps: number;
  fallback?: React.ReactNode;
};

export const Footage: React.FC<FootageProps> = ({
  src,
  trimBeforeSec = 0,
  muted = true,
  volume = 1,
  playbackRate = 1,
  fps,
  fallback,
}) => {
  if (!src) return <AbsoluteFill>{fallback}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <Video
        src={resolveMedia(src)}
        trimBefore={Math.round(trimBeforeSec * fps)}
        muted={muted}
        volume={volume}
        playbackRate={playbackRate}
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
};
