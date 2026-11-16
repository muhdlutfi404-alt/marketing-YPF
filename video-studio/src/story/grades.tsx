import React from "react";
import { AbsoluteFill } from "remotion";

/**
 * Footage colour grades for REAL people & products.
 * Deliberately gentle so skin tones stay natural (no beauty filters, no face changes).
 * `intensity` 0–1 scales the whole look.
 */
export const FOOTAGE_GRADES = {
  natural: { contrast: 0.04, saturate: 0.04, warmth: 0, tint: null, lift: 0 },
  "warm-commercial": {
    contrast: 0.08,
    saturate: 0.1,
    warmth: 0.05,
    tint: "linear-gradient(180deg, rgba(0,70,90,0.20) 0%, rgba(255,150,70,0.18) 100%)",
    lift: 0,
  },
  "cinematic-teal-orange": {
    contrast: 0.12,
    saturate: 0.05,
    warmth: 0.03,
    tint: "linear-gradient(180deg, rgba(0,95,115,0.30) 0%, rgba(255,140,60,0.22) 100%)",
    lift: 0.03,
  },
  "documentary-matte": {
    contrast: -0.04,
    saturate: -0.08,
    warmth: 0.02,
    tint: "linear-gradient(180deg, rgba(40,60,70,0.18) 0%, rgba(120,90,60,0.12) 100%)",
    lift: 0.08,
  },
  "fresh-cool": {
    contrast: 0.06,
    saturate: 0.06,
    warmth: -0.03,
    tint: "linear-gradient(180deg, rgba(120,190,255,0.22) 0%, rgba(255,255,255,0.05) 100%)",
    lift: 0.02,
  },
} as const;
export type FootageGrade = keyof typeof FOOTAGE_GRADES;

export const FootageGradeLayer: React.FC<{ grade: string; intensity?: number; children: React.ReactNode }> = ({
  grade,
  intensity = 1,
  children,
}) => {
  const g = FOOTAGE_GRADES[(grade in FOOTAGE_GRADES ? grade : "natural") as FootageGrade];
  const k = Math.max(0, Math.min(1, intensity));
  const filter = `contrast(${1 + g.contrast * k}) saturate(${1 + g.saturate * k}) sepia(${Math.max(0, g.warmth) * k}) hue-rotate(${Math.min(0, g.warmth) * 60 * k}deg)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter }}>{children}</AbsoluteFill>
      {g.tint ? <AbsoluteFill style={{ background: g.tint, mixBlendMode: "soft-light", opacity: k }} /> : null}
      {g.lift > 0 ? <AbsoluteFill style={{ background: `rgba(30,30,40,${g.lift * k})`, mixBlendMode: "lighten" }} /> : null}
    </AbsoluteFill>
  );
};
