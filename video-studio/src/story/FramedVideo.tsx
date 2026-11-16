import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";
import { resolveMedia } from "../shared/utils/media";
import type { ClipInfo, Focus } from "./engine";

/**
 * Shows REAL footage filling the 1080×1920 frame.
 * - Vertical phone footage fills the frame as-is (no crop at scale 1).
 * - Landscape footage is cropped around `focus` so the presenter stays in shot.
 * - `scale` is the digital zoom (punch-ins etc.), centred on the focus point.
 * Nothing about the person is altered — it's purely framing.
 */
export const FramedVideo: React.FC<{
  clip: ClipInfo;
  trimBeforeSec: number;
  focus?: Focus;
  scale?: number;
  muted?: boolean;
  volume?: number | ((f: number) => number);
  fps: number;
  frameWidth: number;
  frameHeight: number;
}> = ({ clip, trimBeforeSec, focus = { x: 0.5, y: 0.4 }, scale = 1, muted = false, volume = 1, fps, frameWidth, frameHeight }) => {
  const srcAR = clip.width / clip.height;
  const frameAR = frameWidth / frameHeight;
  let w: number;
  let h: number;
  if (srcAR > frameAR) {
    h = frameHeight;
    w = frameHeight * srcAR;
  } else {
    w = frameWidth;
    h = frameWidth / srcAR;
  }
  const left = -(w - frameWidth) * focus.x;
  const top = -(h - frameHeight) * focus.y;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${focus.x * 100}% ${focus.y * 100}%` }}>
        <OffthreadVideo
          src={resolveMedia(clip.src)}
          trimBefore={Math.max(0, Math.round(trimBeforeSec * fps))}
          muted={muted}
          volume={volume}
          style={{ position: "absolute", left, top, width: w, height: h, objectFit: "fill" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
