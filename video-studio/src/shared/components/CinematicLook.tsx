import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useLayout } from "../hooks/useLayout";

/** Colour-grade presets. Applied as CSS filters + a tinted overlay. */
export const GRADES = {
  none: { filter: "none", tint: "transparent", blend: "normal" },
  "teal-orange": {
    filter: "contrast(1.12) saturate(1.15)",
    tint: "linear-gradient(180deg, rgba(0,95,115,0.28) 0%, rgba(255,140,60,0.22) 100%)",
    blend: "soft-light",
  },
  "golden-hour": {
    filter: "contrast(1.06) saturate(1.2) sepia(0.12)",
    tint: "linear-gradient(160deg, rgba(255,190,90,0.35) 0%, rgba(255,95,60,0.18) 100%)",
    blend: "soft-light",
  },
  "cold-mist": {
    filter: "contrast(1.05) saturate(0.85) brightness(1.03)",
    tint: "linear-gradient(180deg, rgba(120,170,220,0.35) 0%, rgba(30,60,90,0.25) 100%)",
    blend: "soft-light",
  },
  "bleach-bypass": {
    filter: "contrast(1.25) saturate(0.6)",
    tint: "linear-gradient(180deg, rgba(40,40,40,0.15), rgba(0,0,0,0.25))",
    blend: "multiply",
  },
} as const;
export type GradeName = keyof typeof GRADES;
export const GRADE_NAMES = Object.keys(GRADES) as [GradeName, ...GradeName[]];

/** Wrap footage in this to apply a colour grade. */
export const ColorGrade: React.FC<{ grade: GradeName; children: React.ReactNode }> = ({ grade, children }) => {
  const g = GRADES[grade];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: g.filter }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: g.tint, mixBlendMode: g.blend as React.CSSProperties["mixBlendMode"] }} />
    </AbsoluteFill>
  );
};

/** Animated film grain (changes every frame, like real film). */
export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const frame = useCurrentFrame();
  const id = `grain-${frame % 8}`;
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 8} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/**
 * Cinematic black bars. In landscape they crop to the "scope" 2.39:1 look.
 * In vertical they become slim bars, so you keep the full tall frame.
 */
export const Letterbox: React.FC<{ animateInFrames?: number; color?: string }> = ({
  animateInFrames = 30,
  color = "#000",
}) => {
  const frame = useCurrentFrame();
  const { width, height, isVertical } = useLayout();
  const target = isVertical ? height * 0.045 : Math.max(0, (height - width / 2.39) / 2);
  const p = interpolate(frame, [0, animateInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const h = target * p;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: h, background: color }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h, background: color }} />
    </AbsoluteFill>
  );
};

/** All-in-one finishing layer placed on top of the whole video. */
export const CinematicOverlay: React.FC<{
  grain?: boolean;
  vignette?: boolean;
  letterbox?: boolean;
}> = ({ grain = true, vignette = true, letterbox = true }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {vignette ? <Vignette /> : null}
    {grain ? <FilmGrain /> : null}
    {letterbox ? <Letterbox /> : null}
  </AbsoluteFill>
);
