import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveZoomTime, zoomScaleAt, type ClipInfo, type ResolvedShot, type TimelineWord } from "./engine";
import { FramedVideo } from "./FramedVideo";
import { FootageGradeLayer } from "./grades";

/**
 * One shot of the REAL footage with its original audio.
 * Handles: digital zoom & punch-ins (incl. quote-anchored), gentle breathing push,
 * the transition INTO the shot, colour grade, and click-free audio edges.
 */
export const ShotView: React.FC<{
  shot: ResolvedShot;
  next?: ResolvedShot;
  clip: ClipInfo;
  words: TimelineWord[];
  grade: string;
  gradeIntensity: number;
  breathing: number;
}> = ({ shot, next, clip, words, grade, gradeIntensity, breathing }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const dur = Math.round(shot.duration * fps);

  const events = (shot.zooms ?? [])
    .map((z) => ({ ...z, at: resolveZoomTime(z, shot, words) }))
    .filter((z): z is typeof z & { at: number } => z.at !== null);
  const scale = zoomScaleAt(t, events, shot.duration, shot.breathing ?? breathing);

  // transition into this shot
  const tf = Math.round(shot.transitionSec * fps);
  const p = tf > 0 ? interpolate(frame, [0, tf], [0, 1], { extrapolateRight: "clamp" }) : 1;
  const type = shot.transition?.type ?? "cut";
  let style: React.CSSProperties = {};
  let overlay: React.ReactNode = null;
  if (tf > 0) {
    if (type === "fade" || type === "light-leak") style = { opacity: p };
    if (type === "slide") style = { transform: `translateY(${(1 - p) * 100}%)` };
    if (type === "wipe") style = { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` };
    if (type === "iris" || type === "clock-wipe") style = { clipPath: `circle(${p * 120}% at 50% 45%)` };
    if (type === "zoom-punch") style = { transform: `scale(${interpolate(p, [0, 1], [1.3, 1])})`, opacity: Math.min(1, p * 2), filter: `blur(${(1 - p) * 12}px)` };
    if (type === "frost-dissolve") style = { opacity: p, filter: `blur(${(1 - p) * 20}px) brightness(${1 + (1 - p) * 0.5})` };
    if (type === "flash") {
      style = { opacity: p > 0.5 ? 1 : 0 };
      overlay = <AbsoluteFill style={{ background: "#fff", opacity: Math.sin(p * Math.PI) ** 1.5 }} />;
    }
    if (type === "light-leak")
      overlay = <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 90% at ${20 + p * 60}% 50%, rgba(255,170,80,0.9), transparent 70%)`, mixBlendMode: "screen", opacity: Math.sin(p * Math.PI) }} />;
    if (type === "frost-dissolve") overlay = <AbsoluteFill style={{ background: "rgba(190,232,255,0.9)", opacity: Math.sin(p * Math.PI) * 0.5 }} />;
  }

  // audio: fade in over the transition (or 2 frames), fade out at the end (overlap of next transition or 2 frames)
  const fadeIn = Math.max(2, tf);
  const fadeOut = Math.max(2, next ? Math.round(next.transitionSec * fps) : 2);
  const gain = Math.min(1, Math.pow(10, (shot.gainDb ?? 0) / 20));
  const volume = (f: number) =>
    gain * interpolate(f, [0, fadeIn, dur - fadeOut, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={style}>
      <FootageGradeLayer grade={grade} intensity={gradeIntensity}>
        <FramedVideo clip={clip} trimBeforeSec={shot.in} focus={shot.focus} scale={scale} muted={shot.audio === "mute"} volume={volume} fps={fps} frameWidth={width} frameHeight={height} />
      </FootageGradeLayer>
      {overlay}
    </AbsoluteFill>
  );
};
