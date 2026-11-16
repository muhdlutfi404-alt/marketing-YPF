import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FrostBackdrop } from "../../brands/yapakcik-frozen/components/FrostBackdrop";
import type { ClipInfo, Focus } from "../engine";
import { FramedVideo } from "../FramedVideo";
import type { StoryStyle } from "../styles";

/** Entrance (spring 0→1) and exit (1→0 over the last frames) for a layer lasting `dur` frames. */
export const useInOut = (dur: number, exitFrames = 10) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 140 } });
  const exit = interpolate(frame, [dur - exitFrames, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  return { frame, fps, enter, exit, visible: Math.min(Math.min(1, enter * 1.4), exit) };
};

/** Font size that shrinks for longer text so headlines always fit 1080px wide. */
export const fitSize = (text: string, max: number, min: number, idealChars = 9) => {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length), 1);
  const byLine = (max * idealChars) / Math.max(idealChars, text.length * 0.55);
  const byWord = (max * 7.5) / Math.max(7.5, longest);
  return Math.max(min, Math.min(max, byLine, byWord));
};

/** Clearly identifies unfinished content. Final export is blocked while any exist. */
export const PlaceholderRibbon: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 30,
      left: -70,
      transform: "rotate(-30deg)",
      background: "#ffd400",
      color: "#000",
      fontFamily: "monospace",
      fontWeight: 900,
      fontSize: 34,
      padding: "8px 90px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      zIndex: 99,
    }}
  >
    PLACEHOLDER
  </div>
);

export type PlateSource = { clip: ClipInfo; trimBeforeSec: number; focus?: Focus } | null;

/**
 * Background for full-screen graphics.
 *  "blur"  — the REAL footage underneath, blurred & darkened (keeps the story's context)
 *  "brand" — animated brand backdrop
 *  "dark"  — plain dark
 */
export const Plate: React.FC<{ kind: "blur" | "brand" | "dark"; source: PlateSource; style: StoryStyle; fps: number; width: number; height: number }> = ({
  kind,
  source,
  style,
  fps,
  width,
  height,
}) => {
  if (kind === "blur" && source) {
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ filter: "blur(38px) brightness(0.42) saturate(1.2)", transform: "scale(1.25)" }}>
          <FramedVideo clip={source.clip} trimBeforeSec={source.trimBeforeSec} focus={source.focus} muted fps={fps} frameWidth={width} frameHeight={height} />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: `linear-gradient(180deg, ${style.colors.dark}99 0%, transparent 45%, ${style.colors.dark}cc 100%)` }} />
      </AbsoluteFill>
    );
  }
  if (kind === "brand" && style.plate === "frost") return <FrostBackdrop variant="navy" />;
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, #232a20 0%, ${style.colors.dark} 75%)` }} />;
};
