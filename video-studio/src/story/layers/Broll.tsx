import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { zoomScaleAt, type ClipInfo, type Focus, type Zoom } from "../engine";
import { FramedVideo } from "../FramedVideo";
import { FootageGradeLayer } from "../grades";

/**
 * B-ROLL CUTAWAY — your REAL secondary footage (product, cooking, location) shown
 * over the presenter's voice. The voice keeps playing underneath (documentary L-cut).
 * Its own sound is muted by default; set props.volume (e.g. 0.25) to keep some ambience.
 */
export const Broll: React.FC<{
  dur: number;
  clip: ClipInfo | undefined;
  grade: string;
  gradeIntensity: number;
  props: { clip: string; in?: number; focus?: Focus; zooms?: Zoom[]; volume?: number; transition?: "cut" | "fade" | "flash" | "zoom-punch" | "slide"; breathing?: number };
}> = ({ dur, clip, grade, gradeIntensity, props }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (!clip) return null;
  const t = frame / fps;
  const events = (props.zooms ?? []).filter((z) => typeof z.at === "number").map((z) => ({ ...z, at: z.at as number }));
  const scale = zoomScaleAt(t, events, dur / fps, props.breathing ?? 0.06);
  const tin = Math.min(8, dur / 3);
  const p = interpolate(frame, [0, tin], [0, 1], { extrapolateRight: "clamp" });
  const tr = props.transition ?? "cut";
  const style: React.CSSProperties =
    tr === "fade"
      ? { opacity: p }
      : tr === "slide"
        ? { transform: `translateX(${(1 - p) * 100}%)` }
        : tr === "zoom-punch"
          ? { transform: `scale(${interpolate(p, [0, 1], [1.25, 1])})`, opacity: Math.min(1, p * 2), filter: `blur(${(1 - p) * 10}px)` }
          : {};
  const vol = props.volume ?? 0;
  return (
    <AbsoluteFill style={style}>
      <FootageGradeLayer grade={grade} intensity={gradeIntensity}>
        <FramedVideo
          clip={clip}
          trimBeforeSec={props.in ?? 0}
          focus={props.focus}
          scale={scale}
          muted={vol === 0}
          volume={(f) => vol * interpolate(f, [0, 6, dur - 6, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          fps={fps}
          frameWidth={width}
          frameHeight={height}
        />
      </FootageGradeLayer>
      {tr === "flash" ? <AbsoluteFill style={{ background: "#fff", opacity: interpolate(frame, [0, 2, 7], [0.9, 0.9, 0], { extrapolateRight: "clamp" }) }} /> : null}
    </AbsoluteFill>
  );
};
