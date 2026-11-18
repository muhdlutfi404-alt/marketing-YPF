import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { FONT_STACKS } from "../../shared/fonts";
import type { StoryStyle } from "../styles";
import { Plate, type PlateSource, useInOut } from "./common";

/**
 * TYPESET — layered typography with a clear hierarchy (small linking words, big key words,
 * an elegant italic accent), each line sharpening in as it is spoken.
 * plate "blur" = your real footage softly blurred behind (opening titles); "none" = over the presenter.
 */
export type TypeLine = { text: string; size?: "xs" | "s" | "m" | "l" | "xl"; style?: "sans" | "script"; dim?: boolean };
const SIZES = { xs: 34, s: 46, m: 68, l: 104, xl: 150 } as const;

export const Typeset: React.FC<{
  dur: number;
  style: StoryStyle;
  plate: PlateSource;
  fps: number;
  width: number;
  height: number;
  props: { lines: TypeLine[]; revealAt?: number[]; plate?: "blur" | "white" | "none"; position?: "center" | "upper" | "lower"; hideCaptions?: boolean };
}> = ({ dur, style, plate, fps, width, height, props }) => {
  const frame = useCurrentFrame();
  const { exit, enter } = useInOut(dur, 8);
  const onWhite = props.plate === "white";
  const color = onWhite ? "#111315" : "#ffffff";
  const top = props.position === "upper" ? "16%" : props.position === "lower" ? "64%" : "40%";
  const n = props.lines.length;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {props.plate === "blur" ? (
        <AbsoluteFill style={{ opacity: Math.min(1, enter * 2) }}>
          <Plate kind="blur" source={plate} style={style} fps={fps} width={width} height={height} />
          <AbsoluteFill style={{ background: "rgba(8,10,12,0.35)" }} />
        </AbsoluteFill>
      ) : props.plate === "white" ? (
        <AbsoluteFill style={{ background: "#f7f7f5", opacity: Math.min(1, enter * 2.5) }} />
      ) : null}
      <div style={{ position: "absolute", top, left: 70, right: 70, transform: "translateY(-50%)", textAlign: "center" }}>
        {props.lines.map((l, i) => {
          const at = Math.round((props.revealAt?.[i] ?? (i * Math.min(0.45, (dur / fps) * 0.5 / Math.max(1, n)))) * fps);
          const p = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 12 });
          const script = l.style === "script";
          return (
            <div
              key={i}
              style={{
                fontFamily: script ? FONT_STACKS.playfairItalic : FONT_STACKS.inter,
                fontStyle: script ? "italic" : "normal",
                fontWeight: script ? 400 : l.size === "xs" || l.size === "s" ? 500 : 800,
                fontSize: SIZES[l.size ?? "m"] * (script ? 1.1 : 1),
                lineHeight: 1.02,
                letterSpacing: script ? 0 : l.size === "xl" || l.size === "l" ? -2 : 0,
                color,
                opacity: p * (l.dim ? 0.72 : 1),
                filter: `blur(${(1 - p) * 8}px)`,
                transform: `translateY(${(1 - p) * 12}px)`,
                textShadow: onWhite ? undefined : "0 2px 18px rgba(0,0,0,0.45)",
              }}
            >
              {l.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
