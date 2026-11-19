import React from "react";
import { AbsoluteFill, spring } from "remotion";

/**
 * ONE CANVAS — presenter and graphics share one design instead of cutting away.
 *
 * When an explainer graphic is needed (a layer with props.layout = "split"), the real footage
 * glides into a rounded window in the lower part of the frame and the graphic draws itself on
 * clean paper above it; afterwards the window opens back to full screen. Everything uses the
 * same paper, ink, type and motion curve, so the edit reads as ONE system, not a pile of effects.
 * The footage inside the window is the original picture (only moved/scaled, never altered).
 */
export const CANVAS = {
  paper: "#f4f3ef",
  /** window rectangle on the 1080×1920 screen (fully open state) */
  top: 790,
  side: 46,
  bottom: 54,
  radius: 46,
  /** footage moves down this much (px) and scales by `scale` so the face sits in the window */
  shift: 360,
  scale: 0.94,
  /** area above the window where split graphics are laid out */
  regionTop: 120,
  get regionBottom() {
    return this.top - 50;
  },
};

export type CanvasSpan = { from: number; to: number }; // frames

/** split layers closer than `joinFrames` share one open canvas (no in-and-out flicker) */
export const mergeSpans = (spans: CanvasSpan[], joinFrames: number): CanvasSpan[] => {
  const s = [...spans].sort((a, b) => a.from - b.from);
  const out: CanvasSpan[] = [];
  for (const x of s) {
    const last = out[out.length - 1];
    if (last && x.from - last.to <= joinFrames) last.to = Math.max(last.to, x.to);
    else out.push({ ...x });
  }
  return out;
};

export const canvasProgress = (frame: number, spans: CanvasSpan[], fps: number): number => {
  let p = 0;
  for (const sp of spans) {
    if (frame < sp.from - 1 || frame > sp.to + 1) continue;
    const pin = sp.from <= 0 ? 1 : spring({ frame: frame - sp.from, fps, config: { damping: 200 }, durationInFrames: 16 });
    const pout = 1 - spring({ frame: frame - (sp.to - 16), fps, config: { damping: 200 }, durationInFrames: 16 });
    p = Math.max(p, Math.min(pin, pout));
  }
  return Math.max(0, Math.min(1, p));
};

export const CanvasFrame: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => {
  if (p <= 0.001) return <AbsoluteFill>{children}</AbsoluteFill>;
  const C = CANVAS;
  const t = C.top * p, sd = C.side * p, b = C.bottom * p, r = C.radius * p;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: C.paper, opacity: Math.min(1, p * 1.6) }} />
      {/* soft shadow under the window */}
      <div style={{ position: "absolute", top: t, left: sd, right: sd, bottom: b, borderRadius: r, boxShadow: `0 ${30 * p}px ${70 * p}px rgba(0,0,0,${0.22 * p})` }} />
      <AbsoluteFill style={{ clipPath: `inset(${t}px ${sd}px ${b}px ${sd}px round ${r}px)` }}>
        <AbsoluteFill style={{ transform: `translateY(${C.shift * p}px) scale(${1 - (1 - C.scale) * p})`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
