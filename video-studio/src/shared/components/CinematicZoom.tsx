import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * "Ken Burns" cinematic zoom + pan for footage or stills.
 * Optional `punchAt` adds quick zoom "hits" on specific frames (sync to music beats / impacts).
 */
export type ZoomDirection = "in" | "out";

export const CinematicZoom: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  direction?: ZoomDirection;
  /** How much zoom (0.15 = 15%) */
  amount?: number;
  /** Pan in % of the frame, e.g. {x: -4, y: 2} */
  pan?: { x: number; y: number };
  punchAt?: number[];
  punchAmount?: number;
}> = ({ children, durationInFrames, direction = "in", amount = 0.15, pan = { x: 0, y: 0 }, punchAt = [], punchAmount = 0.06 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.33, 0, 0.67, 1),
  });
  const base = direction === "in" ? 1 + amount * t : 1 + amount * (1 - t);
  const punch = punchAt.reduce((acc, at) => {
    if (frame < at) return acc;
    const p = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 160 } });
    // goes up quickly then settles back
    return acc + punchAmount * Math.sin(Math.min(1, p) * Math.PI) * Math.exp(-(frame - at) / 12);
  }, 0);
  const scale = base + punch;
  // keep a little headroom so panning never shows an edge
  const tx = pan.x * t;
  const ty = pan.y * t;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${scale}) translate(${tx}%, ${ty}%)`, transformOrigin: "50% 50%" }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
