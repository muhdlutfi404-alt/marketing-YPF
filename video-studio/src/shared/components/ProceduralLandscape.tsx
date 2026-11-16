import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { useLayout } from "../hooks/useLayout";
import { rand } from "../utils/random";

/**
 * A moving, parallax landscape drawn entirely in code.
 * Used as the placeholder "footage" for Project A.M until you drop in real clips,
 * so the template already feels cinematic out of the box.
 */
export const LANDSCAPE_VARIANTS = {
  "dawn-mountains": { sky: ["#1b2a4a", "#e9875c", "#f6c58f"], layers: ["#6b5b7b", "#4a4060", "#2c2840", "#15131f"], sun: "#ffd9a0", stars: false, mist: 0.25 },
  "forest-mist": { sky: ["#8fa6a8", "#c9d4cc", "#e6e8df"], layers: ["#7d9284", "#5a7263", "#3a5245", "#1d2e25"], sun: "#ffffff", stars: false, mist: 0.6 },
  "river-valley": { sky: ["#2f6d8c", "#8cc0d6", "#e8efe6"], layers: ["#6f8f73", "#4f7356", "#34533c", "#1b2f21"], sun: "#fff6d8", stars: false, mist: 0.3 },
  "golden-ridge": { sky: ["#3b2a3f", "#c8643b", "#f4b860"], layers: ["#8a4f3a", "#5f3428", "#3a1f1a", "#1a0e0c"], sun: "#ffe2a1", stars: false, mist: 0.15 },
  "night-camp": { sky: ["#05070f", "#0f1a33", "#1f2f52"], layers: ["#1c2640", "#141c31", "#0c1222", "#05080f"], sun: "#e8eefc", stars: true, mist: 0.12 },
} as const;
export type LandscapeVariant = keyof typeof LANDSCAPE_VARIANTS;
export const LANDSCAPE_NAMES = Object.keys(LANDSCAPE_VARIANTS) as [LandscapeVariant, ...LandscapeVariant[]];

const ridgePath = (seed: number, width: number, height: number, baseY: number, amp: number, drift: number) => {
  const steps = Math.max(24, Math.round(width / 40));
  let d = `M 0 ${height} L 0 ${baseY}`;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const n =
      noise2D(`ridge-${seed}`, (i + drift) / 9, seed) * 0.7 +
      noise2D(`ridge-detail-${seed}`, (i + drift) / 3, seed) * 0.3;
    d += ` L ${x.toFixed(1)} ${(baseY - n * amp).toFixed(1)}`;
  }
  return `${d} L ${width} ${height} Z`;
};

export const ProceduralLandscape: React.FC<{ variant?: LandscapeVariant; seed?: number }> = ({
  variant = "dawn-mountains",
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, isVertical } = useLayout();
  const v = LANDSCAPE_VARIANTS[variant];
  const horizon = height * (isVertical ? 0.58 : 0.55);

  const stars = useMemo(
    () =>
      Array.from({ length: 140 }, (_, i) => ({
        x: rand(`sx${seed}${i}`, 0, width),
        y: rand(`sy${seed}${i}`, 0, horizon),
        r: rand(`sr${seed}${i}`, 0.6, 2.2),
        tw: rand(`st${seed}${i}`, 0, Math.PI * 2),
      })),
    [seed, width, horizon],
  );

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${v.sky[0]} 0%, ${v.sky[1]} 55%, ${v.sky[2]} 100%)` }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {v.stars
          ? stars.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.4 + 0.6 * Math.abs(Math.sin(frame / 20 + s.tw))} />
            ))
          : null}
        <defs>
          <radialGradient id={`sun-${seed}`}>
            <stop offset="0%" stopColor={v.sun} stopOpacity={1} />
            <stop offset="35%" stopColor={v.sun} stopOpacity={0.5} />
            <stop offset="100%" stopColor={v.sun} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`mist-${seed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity={0} />
            <stop offset="50%" stopColor="#fff" stopOpacity={v.mist} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <circle
          cx={width * (isVertical ? 0.62 : 0.68)}
          cy={horizon - height * 0.12 - frame * 0.15}
          r={Math.min(width, height) * 0.32}
          fill={`url(#sun-${seed})`}
        />
        {v.layers.map((color, i) => {
          const depth = i + 1;
          const baseY = horizon + depth * height * 0.085;
          const amp = Math.min(width, height) * (isVertical ? 0.24 - i * 0.035 : 0.2 - i * 0.03);
          const drift = frame * 0.02 * depth + seed * 10;
          return (
            <g key={i}>
              <path d={ridgePath(seed * 10 + i, width, height, baseY, amp, drift)} fill={color} />
              {i === 1 ? (
                <rect x={0} y={baseY - amp * 0.6} width={width} height={amp * 1.2} fill={`url(#mist-${seed})`} transform={`translate(${Math.sin(frame / 60) * 30} 0)`} />
              ) : null}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
